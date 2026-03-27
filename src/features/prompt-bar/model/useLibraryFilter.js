// src/features/prompt-bar/model/useLibraryFilter.js
// ✅ Extracted from ImportMediaDialog — filter/sort logic belongs in a hook, not a UI component.

import { useState, useMemo } from "react";

/**
 * Encapsulates all filter/sort state for the media library dialog.
 *
 * @param {Array}  library - Raw library array (groups or flat items)
 * @param {string} mode    - "image" | "video" | "all"
 * @returns filter state + filtered visible items
 */
export function useLibraryFilter(library = [], mode = "all") {
  const [filter,          setFilter]          = useState(
    mode === "image" ? "images" : mode === "video" ? "videos" : "all"
  );
  const [sort,            setSort]            = useState("recent");
  const [search,          setSearch]          = useState("");
  const [selectedProject, setSelectedProject] = useState("all_projects");

  const visibleItems = useMemo(() => {
    let items = library.flatMap((i) => i.items ?? i);

    // Project filter
    if (selectedProject !== "all_projects") {
      items = items.filter((g) => g.project_id === selectedProject);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((g) => 
        (g.prompt?.toLowerCase().includes(q)) || 
        (g.asset_id?.toLowerCase().includes(q)) ||
        (g.id?.toLowerCase().includes(q))
      );
    }

    // Media type filter
    if (mode === "image") {
      items = items.filter((g) => !g.is_video);
    } else if (mode === "video") {
      items = items.filter((g) => g.is_video);
    }

    // Sort & Favorites
    if (sort === "favorites") {
      items = items.filter((g) => g.is_liked);
    }

    return items.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);

      switch (sort) {
        case "oldest":
          return dateA - dateB;
        case "recent":
        case "newest":
        case "favorites":
          return dateB - dateA;
        case "most_used":
          // Fallback to recent if usage metric missing
          return (b.usage_count || 0) - (a.usage_count || 0) || (dateB - dateA);
        default:
          return dateB - dateA;
      }
    });
  }, [library, sort, search, mode, selectedProject]);

  return {
    filter,          setFilter,
    sort,            setSort,
    search,          setSearch,
    selectedProject, setSelectedProject,
    visibleItems,
  };
}
