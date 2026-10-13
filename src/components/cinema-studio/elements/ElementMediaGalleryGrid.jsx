"use client";

import React, { useRef, useMemo, useCallback } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import { Loader2, Star } from "lucide-react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { MediaItemView } from "@/widgets/CoreMediaItemView";
import { getCachedImageDimensions } from "@/shared/lib/generationUtils";
import { getItemMetadata } from "@/shared/lib/displayUtils";

/**
 * ElementMediaGalleryGrid
 * 
 * Clean, lightweight photo album grid for Element reference images conforming
 * to the Studio Media Grid architecture (RowsPhotoAlbum).
 * 
 * Preserves the authentic aspect ratio of every media item without forcing
 * arbitrary 1:1 or uniform ratios, zero crop, and with clean MediaItemView defaults.
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
  const validItems = useMemo(
    () => items.filter((m) => Boolean(m.url || m.file_url || m.asset?.file_url || m.id || m.name)),
    [items]
  );

  // Build photo album entries with authentic aspect ratios
  const photos = useMemo(() => {
    const list = validItems.map((item, idx) => {
      const url = item.url || item.file_url || item.asset?.file_url;
      let natural = getCachedImageDimensions(url);
      let wNum = natural?.width;
      let hNum = natural?.height;

      if (!wNum || !hNum) {
        const meta = getItemMetadata(item, workflow);
        const aspect = meta?.aspect || item?.aspectRatio || item?.params?.aspectRatio || "1/1";
        const [wStr, hStr] = String(aspect).split("/");
        wNum = parseFloat(wStr) || 1;
        hNum = parseFloat(hStr) || 1;
      }

      const BASE = 1200;
      const width = Math.round(BASE * (wNum / Math.max(wNum, hNum)));
      const height = Math.round(BASE * (hNum / Math.max(wNum, hNum)));

      return {
        src: url || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
        width,
        height,
        key: item.id || item.name || item.asset_id || `item-${idx}`,
        item,
        itemType: "media",
      };
    });

    // Add "+ Add Image" tile if not full
    if (!isFull && onUploadFiles) {
      list.push({
        src: "data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg'/>",
        width: 1200,
        height: 1200,
        key: "add-media-tile",
        itemType: "add_tile",
      });
    }

    return list;
  }, [validItems, workflow, isFull, onUploadFiles]);

  const renderPhoto = useCallback(
    (_, { photo, width, height }) => {
      if (photo.itemType === "add_tile") {
        return (
          <div
            key="add-media-tile"
            onClick={() => fileInputRef.current?.click()}
            style={{ width, height }}
            className="group/addtile relative rounded-xl border border-dashed border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer select-none"
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
        );
      }

      const item = photo.item;
      const mediaId = item?.id || item?.name || item?.asset_id;
      const isCover =
        (primaryMediaId && (mediaId === primaryMediaId || item?.asset_id === primaryMediaId)) ||
        validItems.indexOf(item) === 0;
      const isDeletingThis = deletingMediaId === mediaId;
      const isAddingThis = pendingUrls.includes(item?.url || item?.file_url);
      const isLoadingThis = isDeletingThis || isAddingThis;

      return (
        <div
          key={photo.key}
          style={{ width, height }}
          className="group relative rounded-xl overflow-hidden bg-zinc-900/80 shadow-md flex items-center justify-center"
        >
          <MediaItemView
            workflow={workflow}
            item={item}
            mediaId={mediaId}
            src={photo.src}
            fit="cover"
            style={{ width, height, aspectRatio: `${width} / ${height}` }}
            className="w-full h-full rounded-xl border-none shadow-none"
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
    },
    [
      primaryMediaId,
      validItems,
      deletingMediaId,
      pendingUrls,
      workflow,
      onSetCover,
      onDeleteImage,
      fileInputRef,
    ]
  );

  const albumRender = useMemo(() => ({ photo: renderPhoto }), [renderPhoto]);

  return (
    <div className={cn("w-full overflow-y-auto custom-scrollbar p-1", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <RowsPhotoAlbum
        photos={photos}
        defaultContainerWidth={800}
        targetRowHeight={200}
        spacing={14}
        rowConstraints={{ singleRowMaxHeight: 260 }}
        render={albumRender}
      />
    </div>
  );
}

export default ElementMediaGalleryGrid;
