"use client";

import * as React from "react";

export function useAssetsSelection(visibleItems = []) {
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());

  const visibleWorkflowIds = React.useMemo(
    () => new Set(visibleItems.map((entry) => entry?.workflow?.id).filter(Boolean)),
    [visibleItems]
  );

  React.useEffect(() => {
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => visibleWorkflowIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [visibleWorkflowIds]);

  const togglePhotoSelection = React.useCallback((photoKey) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(photoKey)) {
        next.delete(photoKey);
      } else {
        next.add(photoKey);
      }
      return next;
    });
  }, []);

  const toggleGroupSelection = React.useCallback((groupPhotos) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      const keys = groupPhotos.map((photo) => photo.key);
      const shouldSelectAll = keys.some((key) => !next.has(key));

      keys.forEach((key) => {
        if (shouldSelectAll) {
          next.add(key);
        } else {
          next.delete(key);
        }
      });

      return next;
    });
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedEntries = React.useMemo(
    () => visibleItems.filter((entry) => selectedIds.has(entry?.workflow?.id)),
    [visibleItems, selectedIds]
  );

  const selectedWorkflowIds = React.useMemo(
    () => selectedEntries.map((entry) => entry?.workflow?.id).filter(Boolean),
    [selectedEntries]
  );

  return {
    selectedIds,
    selectedEntries,
    selectedWorkflowIds,
    selectedCount: selectedEntries.length,
    togglePhotoSelection,
    toggleGroupSelection,
    clearSelection,
  };
}
