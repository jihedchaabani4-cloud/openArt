"use client";

import { Download, Heart, Trash2, X } from "lucide-react";

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
          <Download className="h-4 w-4" />
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
          <Heart className={`h-4 w-4 ${allSelectedAreLiked ? "fill-current text-white" : ""}`} />
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="size-10 p-0"
          onClick={onDeleteSelected}
          disabled={isDeleting || isFavoriting}
          aria-label="Delete selected"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="secondary"
          className="size-10 p-0"
          onClick={onClearSelection}
          aria-label="Clear selection"
        >
          <X className="h-4.5 w-4.5" />
        </Button>
      </div>
    </div>
  );
}
