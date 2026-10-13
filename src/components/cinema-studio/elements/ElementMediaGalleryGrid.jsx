"use client";

import React, { useRef } from "react";
import { Loader2, Star } from "lucide-react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { MediaItemView } from "@/widgets/CoreMediaItemView";

/**
 * ElementMediaGalleryGrid
 * 
 * Clean, lightweight grid for Element reference images.
 * Uses MediaItemView with direct mediaId support, preserving authentic
 * aspect ratio without forced 1:1 fallbacks, like buttons, or studio clutter.
 */
export function ElementMediaGalleryGrid({
  workflow = null,
  items = [],
  primaryMediaId = null,
  pendingUrls = [],
  deletingMediaId = null,
  maxAllowed = 6,
  onUploadFiles,
  onDeleteImage,
  onSetCover,
  isSettingCover = false,
  className,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onUploadFiles) {
      onUploadFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isFull = items.length >= maxAllowed;
  const validItems = items.filter((m) => Boolean(m.url || m.file_url || m.asset?.file_url || m.id || m.name));

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full overflow-y-auto custom-scrollbar p-1", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {validItems.map((item, idx) => {
        const mediaId = item.id || item.name || item.asset_id;
        const isCover =
          (primaryMediaId && (mediaId === primaryMediaId || item.asset_id === primaryMediaId)) ||
          idx === 0;
        const isDeletingThis = deletingMediaId === mediaId;
        const isAddingThis = pendingUrls.includes(item.url || item.file_url);
        const isLoadingThis = isDeletingThis || isAddingThis;

        return (
          <div
            key={mediaId || idx}
            className="group relative rounded-xl overflow-hidden bg-zinc-900/80 shadow-md flex items-center justify-center min-h-[160px]"
          >
            <MediaItemView
              workflow={workflow}
              item={item}
              mediaId={mediaId}
              src={item.url || item.file_url || item.asset?.file_url}
              fit="contain"
              className="w-full h-full rounded-xl"
              showLikedBadge={false}
              showVideoBadge={false}
              showMenu={false}
              showHoverOverlay={false}
              topLeft={
                isCover ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-white/15 text-white/90 text-[10.5px] font-medium shadow-sm backdrop-blur-md select-none pointer-events-none">
                    <Star className="size-3 text-amber-400 fill-amber-400" />
                    <span>Couverture</span>
                  </div>
                ) : null
              }
              topRight={
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isCover && onSetCover && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetCover(mediaId);
                      }}
                      className="h-7 px-2 rounded-lg bg-black/70 hover:bg-black/90 border border-white/15 text-white/80 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer backdrop-blur-sm"
                      title="Définir comme couverture"
                    >
                      <Star className="size-3 text-white/70" />
                      <span>Couverture</span>
                    </button>
                  )}
                  {onDeleteImage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteImage(item);
                      }}
                      className="w-7 h-7 rounded-lg bg-black/70 hover:bg-red-500/80 border border-white/15 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm"
                      title="Supprimer l'image"
                    >
                      <GoogleIcon iconName="delete" className="text-[16px]" />
                    </button>
                  )}
                </div>
              }
              overlay={
                isLoadingThis ? (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex items-center justify-center rounded-xl">
                    <Loader2 className="size-6 text-white animate-spin" />
                  </div>
                ) : null
              }
            />
          </div>
        );
      })}

      {/* "+ Add" dashed tile inside grid */}
      {!isFull && onUploadFiles && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group/addtile relative rounded-xl border border-dashed border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all min-h-[160px] flex flex-col items-center justify-center gap-2 cursor-pointer select-none"
          title="Ajouter une image de référence"
        >
          <div className="w-10 h-10 rounded-full bg-white/5 group-hover/addtile:bg-white/10 flex items-center justify-center transition-colors">
            <GoogleIcon
              iconName="add"
              className="text-[20px] text-white/50 group-hover/addtile:text-white"
            />
          </div>
          <span className="text-xs font-medium text-white/50 group-hover/addtile:text-white transition-colors">
            Ajouter une image
          </span>
        </div>
      )}
    </div>
  );
}

export default ElementMediaGalleryGrid;
