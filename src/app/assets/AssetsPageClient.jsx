"use client";

import * as React from "react";
import JSZip from "jszip";
import "react-photo-album/rows.css";

import { useAssetsFilters } from "./AssetsFiltersContext";
import { buildGroupedPhotos, isVideoUrl, PAGE_SIZE, resolveLibraryCategory } from "./assetsUtils";
import { AssetsGroupSection } from "./components/AssetsGroupSection";
import { AssetsSelectionBar } from "./components/AssetsSelectionBar";
import { downloadBlob } from "@/shared/lib/utils";
import { useInfiniteUserLibrary } from "@/features/media";
import { useRemoveWorkflow, useToggleWorkflowLike } from "@/features/workflows/api/workflowsApi";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";

export default function AssetsPageClient() {
  const loadMoreRef = React.useRef(null);
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());
  const [isDownloadingSelection, setIsDownloadingSelection] = React.useState(false);
  const [isFavoritingSelection, setIsFavoritingSelection] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [isDeletingSelection, setIsDeletingSelection] = React.useState(false);
  const { searchQuery, mediaFilter, categoryFilter } = useAssetsFilters();
  const { mutateAsync: toggleWorkflowLike } = useToggleWorkflowLike();
  const { mutateAsync: removeWorkflow } = useRemoveWorkflow();
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteUserLibrary({
    enabled: true,
    limit: PAGE_SIZE,
  });

  const items = React.useMemo(
    () => data?.pages?.flatMap((page) => page.data || []) || [],
    [data]
  );
  const filteredItems = React.useMemo(() => {
    return items.filter((entry) => {
      const workflow = entry?.workflow || {};
      const media = entry?.primary_media || {};
      const isVideo = isVideoUrl(media.url);
      const category = resolveLibraryCategory(entry);
      const searchableText = [
        workflow.display_name,
        entry?.generation_info?.prompt,
        entry?.generation_info?.model,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      if (mediaFilter === "image" && isVideo) return false;
      if (mediaFilter === "video" && !isVideo) return false;
      if (categoryFilter !== "all" && category !== categoryFilter) return false;

      return true;
    });
  }, [categoryFilter, items, mediaFilter, searchQuery]);

  React.useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const groupedPhotos = React.useMemo(() => buildGroupedPhotos(filteredItems), [filteredItems]);
  const visibleWorkflowIds = React.useMemo(
    () => new Set(filteredItems.map((entry) => entry?.workflow?.id).filter(Boolean)),
    [filteredItems]
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
    () => filteredItems.filter((entry) => selectedIds.has(entry?.workflow?.id)),
    [filteredItems, selectedIds]
  );

  const buildDownloadFilename = React.useCallback((entry) => {
    const media = entry?.primary_media || {};
    const workflow = entry?.workflow || {};
    const rawUrl = media.url || "";
    const extensionMatch = rawUrl.match(/\.([a-z0-9]+)(?:[?#].*)?$/i);
    const fallbackExtension = isVideoUrl(rawUrl) ? "mp4" : "png";
    const extension = extensionMatch?.[1] || fallbackExtension;
    const baseName =
      workflow.display_name?.trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, "-") ||
      workflow.id ||
      media.id ||
      "asset";

    return `${baseName}.${extension}`;
  }, []);

  const buildZipFilename = React.useCallback(() => {
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
    ].join("-");

    return `openart-assets-${timestamp}.zip`;
  }, []);

  const handleDownloadSelected = React.useCallback(async () => {
    if (isDownloadingSelection || selectedEntries.length === 0) return;

    setIsDownloadingSelection(true);
    try {
      const zip = new JSZip();
      const usedNames = new Set();

      for (const entry of selectedEntries) {
        const url = entry?.primary_media?.url;
        if (!url) continue;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch media: ${response.status}`);
        }

        const blob = await response.blob();
        const originalName = buildDownloadFilename(entry);
        let finalName = originalName;
        let duplicateIndex = 1;

        while (usedNames.has(finalName)) {
          const dotIndex = originalName.lastIndexOf(".");
          const hasExtension = dotIndex > 0;
          const basename = hasExtension ? originalName.slice(0, dotIndex) : originalName;
          const extension = hasExtension ? originalName.slice(dotIndex) : "";
          finalName = `${basename}-${duplicateIndex}${extension}`;
          duplicateIndex += 1;
        }

        usedNames.add(finalName);
        zip.file(finalName, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, buildZipFilename());
    } finally {
      setIsDownloadingSelection(false);
    }
  }, [buildDownloadFilename, buildZipFilename, isDownloadingSelection, selectedEntries]);

  const selectedCount = selectedEntries.length;
  const selectedWorkflowIds = React.useMemo(
    () => selectedEntries.map((entry) => entry?.workflow?.id).filter(Boolean),
    [selectedEntries]
  );
  const allSelectedAreLiked =
    selectedEntries.length > 0 && selectedEntries.every((entry) => !!entry?.workflow?.favorited);

  const handleFavoriteSelected = React.useCallback(async () => {
    if (isFavoritingSelection || isDeletingSelection || selectedEntries.length === 0) return;

    setIsFavoritingSelection(true);
    try {
      await toggleWorkflowLike({
        workflowIds: selectedWorkflowIds,
        favorited: !allSelectedAreLiked,
      });
    } finally {
      setIsFavoritingSelection(false);
    }
  }, [
    allSelectedAreLiked,
    isDeletingSelection,
    isFavoritingSelection,
    selectedEntries.length,
    selectedWorkflowIds,
    toggleWorkflowLike,
  ]);

  const handleDeleteSelected = React.useCallback(async () => {
    if (isDeletingSelection || isFavoritingSelection || selectedWorkflowIds.length === 0) return;

    setIsDeletingSelection(true);
    try {
      await removeWorkflow(selectedWorkflowIds);
      clearSelection();
    } finally {
      setIsDeletingSelection(false);
    }
  }, [
    clearSelection,
    isDeletingSelection,
    isFavoritingSelection,
    removeWorkflow,
    selectedWorkflowIds,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-white/40 text-lg font-medium tracking-tight">Loading library...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-white">
      <div className="w-full ">
        {filteredItems.length === 0 ? (
          <div className=" py-16 text-center text-white/35">
            {items.length === 0 ? "No assets found." : "No assets match these filters."}
          </div>
        ) : (
          <>
            <div className="space-y-10">
              {groupedPhotos.map((group) => (
                <AssetsGroupSection
                  key={group.label}
                  group={group}
                  selectedIds={selectedIds}
                  onToggleGroupSelection={toggleGroupSelection}
                  onTogglePhotoSelection={togglePhotoSelection}
                />
              ))}
            </div>
            <div ref={loadMoreRef} className="h-8 w-full" />
            {isFetchingNextPage && (
              <div className="pt-4 text-center text-sm text-white/45">
                Loading more assets...
              </div>
            )}
          </>
        )}
      </div>

      <AssetsSelectionBar
        selectedCount={selectedCount}
        isDownloading={isDownloadingSelection}
        isFavoriting={isFavoritingSelection}
        isDeleting={isDeletingSelection}
        allSelectedAreLiked={allSelectedAreLiked}
        onDownloadSelected={handleDownloadSelected}
        onFavoriteSelected={handleFavoriteSelected}
        onDeleteSelected={() => setIsDeleteConfirmOpen(true)}
        onClearSelection={clearSelection}
      />

      <ConfirmDeleteDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Delete selected workflows?"
        description={`This will permanently delete ${selectedCount} selected ${selectedCount === 1 ? "workflow" : "workflows"}.`}
        confirmLabel={isDeletingSelection ? "Deleting..." : "Yes, delete"}
        cancelLabel="No, keep them"
        loading={isDeletingSelection}
        onConfirm={handleDeleteSelected}
      />
    </div>
  );
}
