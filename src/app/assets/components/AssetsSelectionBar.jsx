"use client";

import { Download, FolderPlus, Heart, Trash2, X } from "lucide-react";

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
          variant="studio-normal"
          disabled={isDownloading}
          className="h-10 rounded-lg border border-white/10 bg-[#24262d] px-4 text-[14px] font-semibold text-white hover:bg-[#2d3038]"
        >
          <Download className="h-4 w-4" />
          {isDownloading ? "Downloading..." : "Download"}
        </Button>



        <Button
          type="button"
          variant="studio-normal"
          onClick={onFavoriteSelected}
          disabled={isFavoriting || isDeleting}
          className="h-10 w-10 rounded-lg border border-white/10 bg-[#24262d] text-white/78 hover:bg-[#2d3038] hover:text-white"
          aria-label="Favorite selected"
        >
          <Heart className={`h-4 w-4 ${allSelectedAreLiked ? "fill-current text-white" : ""}`} />
        </Button>

        <Button
          type="button"
          variant="studio-normal"
          onClick={onDeleteSelected}
          disabled={isDeleting || isFavoriting}
          className="h-10 w-10 rounded-lg border border-white/10 bg-[#24262d] text-white/78 hover:bg-[#2d3038] hover:text-white"
          aria-label="Delete selected"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          onClick={onClearSelection}
          className="h-10 w-10 rounded-lg border border-white/10 bg-[#24262d] text-white/62 hover:bg-[#2d3038] hover:text-white"
          aria-label="Clear selection"
        >
          <X className="h-4.5 w-4.5" />
        </Button>
      </div>
    </div>
  );
}
