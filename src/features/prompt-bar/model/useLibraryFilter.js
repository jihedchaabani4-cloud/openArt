// src/features/prompt-bar/model/useLibraryFilter.js
import { useState, useMemo } from "react";

/**
 * Encapsulates all filter/sort state for the media library dialog.
 * @param {Array}  library - Raw library array
 * @param {string} mode    - "image" | "video" | "all"
 */
export function useLibraryFilter(library = [], mode = "all") {
  const [sort,            setSort]            = useState("recent");
  const [search,          setSearch]          = useState("");
  const [selectedProject, setSelectedProject] = useState("all_projects");
  const [selectedSession, setSelectedSession] = useState("all_sessions");
  const [selectedCategory, setSelectedCategory] = useState(mode || "all");

  const visibleItems = useMemo(() => {
    // 1. Flatten items
    let items = library.flatMap((i) => i.items ?? i);

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
        (g.asset_id?.toLowerCase().includes(q)) ||
        (g.id?.toLowerCase().includes(q))
      );
    }

    // Helper to check if an item is an upload
    const checkIsUpload = (g) => 
      g.workflow_type === "UPLOAD" || g.workflowType === "UPLOAD" || g.type === "upload" || Boolean(g.is_upload);

    // 5. Category / Media type filter
    const activeCategory = selectedCategory !== "all" ? selectedCategory : (mode !== "all" ? mode : "all");
    
    if (activeCategory === "image") {
      // Generated Images only
      items = items.filter((g) => {
        const wType = String(g.workflow_type || "").toUpperCase();
        return (!g.is_video && g.type !== "video" && g.type !== "voice") && !checkIsUpload(g) && wType !== "CHARACTER" && wType !== "CHARACTER_SHEET" && wType !== "ELEMENT_SHEET" && wType !== "ELEMENT";
      });
    } else if (activeCategory === "video") {
      // Generated Videos only
      items = items.filter((g) => {
        const wType = String(g.workflow_type || "").toUpperCase();
        return (g.is_video || g.type === "video" || !!g.video) && !checkIsUpload(g) && wType !== "CHARACTER" && wType !== "CHARACTER_SHEET" && wType !== "ELEMENT_SHEET" && wType !== "ELEMENT";
      });
    } else if (activeCategory === "character") {
      items = items.filter((g) => {
        const wType = String(g.workflow_type || "").toUpperCase();
        return wType === "CHARACTER" || wType === "CHARACTER_SHEET" || g.type === "character";
      });
    } else if (activeCategory === "element") {
      items = items.filter((g) => {
        const wType = String(g.workflow_type || "").toUpperCase();
        return wType === "ELEMENT_SHEET" || wType === "ELEMENT" || g.type === "element";
      });
    } else if (activeCategory === "upload") {
      items = items.filter((g) => checkIsUpload(g));
    }

    // 6. Sort & Favorites
    if (sort === "favorites") {
      items = items.filter((g) => g.is_liked);
    }

    return items.sort((a, b) => {
      const dateA = new Date(a.mediaMetadata?.createTime || a.created_at || 0);
      const dateB = new Date(b.mediaMetadata?.createTime || b.created_at || 0);

      switch (sort) {
        case "oldest":
          return dateA - dateB;
        case "recent":
        default:
          return dateB - dateA;
      }
    });
  }, [library, sort, search, mode, selectedCategory, selectedProject, selectedSession]);

  return {
    sort,            setSort,
    search,          setSearch,
    selectedProject, setSelectedProject,
    selectedSession, setSelectedSession,
    selectedCategory, setSelectedCategory,
    visibleItems,
  };
}
