"use client";

import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Button } from "@/components/base/button";

export function AssetsSelectionBar({
  selectedCount,
  isDownloading = false,
  isFavoriting = false,
  isDeleting = false,
  allSelectedAreLiked = false,
  onDownloadSelected,
  onFavoriteSelected,
  onDeleteSelected,
  onClearSelection,
}) {
  if (selectedCount <= 0) return null;

  return (
    <div className="fixed bottom-10 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-0.5 px-3 py-2">
        <div className="px-1 py-2 text-sm font-semibold text-white/92">
          {selectedCount} selected
        </div>

        <Button
          type="button"
          onClick={onDownloadSelected}
          variant="secondary"
          className="h-10 px-6 text-sm"
          disabled={isDownloading}
        >
          <HugeIcon name="download-04" />
          {isDownloading ? "Downloading..." : "Download"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="size-10 p-0"
          onClick={onFavoriteSelected}
          disabled={isFavoriting || isDeleting}
          aria-label="Favorite selected"
        >
          <HugeIcon name="favourite" filled={allSelectedAreLiked} className={allSelectedAreLiked ? "text-white" : undefined} />
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="size-10 p-0"
          onClick={onDeleteSelected}
          disabled={isDeleting || isFavoriting}
          aria-label="Delete selected"
        >
          <HugeIcon name="delete-02" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="size-10 p-0"
          onClick={onClearSelection}
          aria-label="Clear selection"
        >
          <HugeIcon name="cancel-01" />
        </Button>
      </div>
    </div>
  );
}
