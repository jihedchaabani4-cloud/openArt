"use client";

import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";

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
          <GoogleIcon iconName="download" className="text-base" />
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
          <GoogleIcon iconName="favorite" fill={allSelectedAreLiked} className={allSelectedAreLiked ? "text-base text-white" : "text-base"} />
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="size-10 p-0"
          onClick={onDeleteSelected}
          disabled={isDeleting || isFavoriting}
          aria-label="Delete selected"
        >
          <GoogleIcon iconName="delete" className="text-base" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="size-10 p-0"
          onClick={onClearSelection}
          aria-label="Clear selection"
        >
          <GoogleIcon iconName="close" className="text-lg" />
        </Button>
      </div>
    </div>
  );
}
