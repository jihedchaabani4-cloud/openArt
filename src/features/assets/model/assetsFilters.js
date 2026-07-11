"use client";

import * as React from "react";

const AssetsFiltersContext = React.createContext(null);

export const MEDIA_FILTERS = [
  { id: "all", label: "All Media" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
];

export const CATEGORY_FILTERS = [
  { id: "all", label: "All Types" },
  { id: "media", label: "Media" },
  { id: "character", label: "Character" },
  { id: "product", label: "Product" },
  { id: "location", label: "Location" },
];

export function AssetsFiltersProvider({ children }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [mediaFilter, setMediaFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");

  const value = React.useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      mediaFilter,
      setMediaFilter,
      categoryFilter,
      setCategoryFilter,
    }),
    [categoryFilter, mediaFilter, searchQuery]
  );

  return (
    <AssetsFiltersContext.Provider value={value}>
      {children}
    </AssetsFiltersContext.Provider>
  );
}

export function useAssetsFilters() {
  const context = React.useContext(AssetsFiltersContext);

  if (!context) {
    throw new Error("useAssetsFilters must be used inside AssetsFiltersProvider");
  }

  return context;
}
