"use client";

import * as React from "react";
import "react-photo-album/rows.css";

import {
  AssetsGroupSection,
  AssetsSelectionBar,
  PAGE_SIZE,
  buildAssetsZipFilename,
  buildDownloadFilename,
  buildGroupedPhotos,
  filterLibraryItems,
  useAssetsFilters,
  useAssetsSelection,
} from "@/features/assets";
import { useInfiniteUserLibrary } from "@/features/media";
import { useRemoveWorkflow, useToggleWorkflowLike } from "@/features/workflows/api/workflowsApi";
import { downloadAssetsAsZip } from "@/shared/api/assets";
import { useAuthSession } from "@/shared/api/auth";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";

export function AssetsLibraryPage() {
  const loadMoreRef = React.useRef(null);
  const [isDownloadingSelection, setIsDownloadingSelection] = React.useState(false);
  const [isFavoritingSelection, setIsFavoritingSelection] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [isDeletingSelection, setIsDeletingSelection] = React.useState(false);
  const { searchQuery, mediaFilter, categoryFilter } = useAssetsFilters();
  const { data: currentUser, isLoading: authLoading } = useAuthSession();
  const { mutateAsync: toggleWorkflowLike } = useToggleWorkflowLike();
  const { mutateAsync: removeWorkflow } = useRemoveWorkflow();
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteUserLibrary({
    enabled: !authLoading && !!currentUser,
    limit: PAGE_SIZE,
  });

  const items = React.useMemo(
    () => data?.pages?.flatMap((page) => page.data || []) || [],
    [data]
  );
  const filteredItems = React.useMemo(
    () => filterLibraryItems(items, { searchQuery, mediaFilter, categoryFilter }),
    [categoryFilter, items, mediaFilter, searchQuery]
  );

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
  const {
    selectedIds,
    selectedEntries,
    selectedWorkflowIds,
    selectedCount,
    togglePhotoSelection,
    toggleGroupSelection,
    clearSelection,
  } = useAssetsSelection(filteredItems);

  const handleDownloadSelected = React.useCallback(async () => {
    if (isDownloadingSelection || selectedCount === 0) return;

    setIsDownloadingSelection(true);
    try {
      await downloadAssetsAsZip(selectedEntries, buildDownloadFilename, buildAssetsZipFilename());
    } catch (error) {
      console.error("❌ Failed to download assets as zip:", error);
    } finally {
      setIsDownloadingSelection(false);
    }
  }, [isDownloadingSelection, selectedCount, selectedEntries]);

  const allSelectedAreLiked =
    selectedCount > 0 && selectedEntries.every((entry) => !!entry?.workflow?.favorited);

  const handleFavoriteSelected = React.useCallback(async () => {
    if (isFavoritingSelection || isDeletingSelection || selectedCount === 0) return;

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
    selectedCount,
    selectedWorkflowIds,
    toggleWorkflowLike,
  ]);

  const handleDeleteSelected = React.useCallback(async () => {
    if (isDeletingSelection || isFavoritingSelection || selectedCount === 0) return;

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
    selectedCount,
    selectedWorkflowIds,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-white/40 text-lg font-medium tracking-tight">Loading library...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-white">
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

export default AssetsLibraryPage;
