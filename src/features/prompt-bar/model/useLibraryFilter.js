// src/features/studio/useLibraryFilter.js
import { useState, useMemo, useEffect } from "react";

/**
 * Extracts all identifying keys (id, workflow_id, url, etc.) from an item or item collection.
 */
export function extractIdentifyingKeys(item) {
  if (!item) return [];
  if (typeof item === "string" || typeof item === "number") {
    const s = String(item).trim();
    return s ? [s] : [];
  }
  if (typeof item !== "object") return [];

  const keys = new Set();
  const add = (val) => {
    if (val !== undefined && val !== null && val !== "") {
      const s = String(val).trim();
      if (s) {
        keys.add(s);
        const clean = s.replace(/^workflows\//, "").replace(/^media\//, "").trim();
        if (clean && clean !== s) {
          keys.add(clean);
        }
      }
    }
  };

  add(item.workflow_id);
  add(item.workflowId);
  add(item.asset_id);
  add(item.assetId);
  add(item.id);
  add(item.name);
  add(item.url);
  add(item.preview);
  add(item.file_url);
  add(item.src);
  add(item.image?.url);
  add(item.video?.url);

  if (item.workflow && typeof item.workflow === "object") {
    add(item.workflow.id);
    add(item.workflow.workflow_id);
    add(item.workflow.name);
  }

  if (item.rawValue && typeof item.rawValue === "object") {
    extractIdentifyingKeys(item.rawValue).forEach((k) => keys.add(k));
  }

  return Array.from(keys);
}

/**
 * Encapsulates all filter/sort state for the media library dialog.
 * @param {Array}  library         - Raw library array
 * @param {string} mode            - "image" | "video" | "all" | "asset-select"
 * @param {string} initialCategory - Default category tab ("all", "image", "video", etc.)
 * @param {object|Array} options   - Optional options object or excluded items list (e.g. { selectedItems: [...] })
 */
export function useLibraryFilter(library = [], mode = "all", initialCategory = "all", options = {}) {
  const [sort,            setSort]            = useState("recent");
  const [search,          setSearch]          = useState("");
  const [selectedProject, setSelectedProject] = useState("all_projects");
  const [selectedSession, setSelectedSession] = useState("all_sessions");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const excludedKeySet = useMemo(() => {
    const rawList = Array.isArray(options)
      ? options
      : [
          ...(options?.selectedItems || []),
          ...(options?.selectedReferences || []),
          ...(options?.selectedIds || []),
          ...(options?.excludedIds || []),
          ...(options?.excludedItems || []),
        ];

    const set = new Set();
    rawList.forEach((it) => {
      extractIdentifyingKeys(it).forEach((k) => set.add(k));
    });
    return set;
  }, [options]);

  const visibleItems = useMemo(() => {
    // 1. Flatten items only if container without its own concrete representation
    let items = library.flatMap((i) => {
      if (!i) return [];
      if (i.url || i.src || i.workflow_id || !Array.isArray(i.items)) {
        return i;
      }
      return i.items.length > 0 ? i.items : i;
    });

    // 1.1 Exclude already selected items
    if (excludedKeySet.size > 0) {
      items = items.filter((g) => {
        const itemKeys = extractIdentifyingKeys(g);
        return !itemKeys.some((k) => excludedKeySet.has(k));
      });
    }

    // 2. Project filter
    if (selectedProject !== "all_projects") {
      items = items.filter((g) => g.project_id === selectedProject);
    }

    // 3. Session filter
    if (selectedSession !== "all_sessions") {
      items = items.filter((g) => {
        const sId = 
          g.session_id || 
          g.sessionId || 
          g.mediaMetadata?.sessionId || 
          g.mediaMetadata?.session_id ||
          g.metadata?.sessionId || 
          g.metadata?.session_id;
        return sId === selectedSession;
      });
    }

    // 4. Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((g) => 
        (g.prompt?.toLowerCase().includes(q)) || 
        (g.display_name?.toLowerCase().includes(q)) ||
        (g.asset_id?.toLowerCase().includes(q)) ||
        (g.id?.toLowerCase().includes(q))
      );
    }

    // Helper to check if an item is an upload
    const checkIsUpload = (g) => 
      g.workflow_type === "UPLOAD" || g.workflowType === "UPLOAD" || g.type === "upload" || Boolean(g.is_upload);

    // 5. Category / Media type filter
    const activeCategory = selectedCategory !== "all" ? selectedCategory : (mode !== "all" && mode !== "asset-select" ? mode : "all");
    
    if (activeCategory === "image") {
      // All Images (includes uploaded images and generated images, strictly excluding characters and elements)
      items = items.filter((g) => {
        const isVid = g.is_video || g.type === "video" || !!g.video;
        const wType = String(g.workflow_type || g.workflowType || "").toUpperCase();
        const isChar = g.is_character || g.type === "character" || wType === "CHARACTER" || wType === "CHARACTER_SHEET";
        const isElem = g.is_element || g.type === "element" || wType === "ELEMENT" || wType === "ELEMENT_SHEET";
        return !isVid && !isChar && !isElem && g.type !== "voice";
      });
    } else if (activeCategory === "video") {
      // All Videos (includes uploaded videos and generated videos)
      items = items.filter((g) => {
        return g.is_video || g.type === "video" || !!g.video;
      });
    } else if (activeCategory === "character") {
      items = items.filter((g) => {
        const wType = String(g.workflow_type || g.workflowType || "").toUpperCase();
        return wType === "CHARACTER" || wType === "CHARACTER_SHEET" || g.type === "character" || g.is_character;
      });
    } else if (activeCategory === "element") {
      items = items.filter((g) => {
        const wType = String(g.workflow_type || g.workflowType || "").toUpperCase();
        return wType === "ELEMENT_SHEET" || wType === "ELEMENT" || g.type === "element" || g.is_element;
      });
    } else if (activeCategory === "upload") {
      items = items.filter((g) => checkIsUpload(g));
    }

    // 6. Sort & Favorites
    if (sort === "favorites") {
      items = items.filter((g) => g.is_liked);
    }

    return items.sort((a, b) => {
      const dateA = new Date(a.mediaMetadata?.createTime || a.created_at || a.create_time || 0);
      const dateB = new Date(b.mediaMetadata?.createTime || b.created_at || b.create_time || 0);

      switch (sort) {
        case "oldest":
          return dateA - dateB;
        case "recent":
        default:
          return dateB - dateA;
      }
    });
  }, [library, sort, search, mode, selectedCategory, selectedProject, selectedSession, excludedKeySet]);

  return {
    sort,            setSort,
    search,          setSearch,
    selectedProject, setSelectedProject,
    selectedSession, setSelectedSession,
    selectedCategory, setSelectedCategory,
    visibleItems,
  };
}
