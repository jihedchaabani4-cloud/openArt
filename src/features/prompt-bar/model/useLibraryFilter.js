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

    // 5. Media type filter
    if (mode === "image") {
      items = items.filter((g) => !g.is_video);
    } else if (mode === "video") {
      items = items.filter((g) => g.is_video);
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
  }, [library, sort, search, mode, selectedProject, selectedSession]);

  return {
    sort,            setSort,
    search,          setSearch,
    selectedProject, setSelectedProject,
    selectedSession, setSelectedSession,
    visibleItems,
  };
}
