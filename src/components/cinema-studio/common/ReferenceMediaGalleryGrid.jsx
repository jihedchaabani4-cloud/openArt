"use client";

import { useMemo, useCallback } from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import { Loader2 } from "lucide-react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { ButtonGroup } from "@/shared/ui/button-group";
import { ActionBtn } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn";
import { MediaItemView } from "@/widgets/CoreMediaItemView";
import { getCachedImageDimensions } from "@/shared/lib/generationUtils";
import { getItemMetadata } from "@/shared/lib/displayUtils";

export const DEFAULT_REFERENCE_ROW_HEIGHT = 300;

/**
 * ReferenceMediaGalleryGrid
 *
 * Unified photo album grid for reference detail images (used by Characters and Elements)
 * conforming to the Studio Media Grid architecture (RowsPhotoAlbum).
 *
 * Preserves the authentic aspect ratio of every media item without forcing
 * arbitrary 1:1, 4:3 or uniform ratios, zero crop, and with clean MediaItemView defaults.
 */
export function ReferenceMediaGalleryGrid({
  workflow = null,
  items = [],
  primaryMediaId = null,
  pendingUrls = [],
  deletingMediaId = null,
  targetRowHeight = DEFAULT_REFERENCE_ROW_HEIGHT,
  onDeleteImage,
  onSetCover,
  className,
}) {
  const validItems = useMemo(
    () => items.filter((m) => Boolean(m.url || m.file_url || m.asset?.file_url || m.id || m.name)),
    [items]
  );

  // Build photo album entries with authentic aspect ratios
  const photos = useMemo(() => {
    return validItems.map((item, idx) => {
      const url = item.url || item.file_url || item.asset?.file_url;
      const natural = getCachedImageDimensions(url);
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
  }, [validItems, workflow]);

  const renderPhoto = useCallback(
    (_, { photo, width, height }) => {
      const item = photo.item;
      const mediaId = item?.id || item?.name || item?.asset_id;
      const isCover =
        (primaryMediaId && (mediaId === primaryMediaId || item?.asset_id === primaryMediaId)) ||
        validItems.indexOf(item) === 0;
      const isDeletingThis = deletingMediaId === mediaId;
      const isAddingThis = pendingUrls.includes(item?.url || item?.file_url);
      const isLoadingThis = isDeletingThis || isAddingThis;

      const contextMenuItems = [
        ...(onSetCover
          ? [
              {
                key: "set-cover",
                label: isCover ? "Image de couverture" : "Définir comme couverture",
                icon: "bookmark",
                fill: isCover,
                disabled: isCover,
                onClick: !isCover ? () => onSetCover(mediaId) : undefined,
              },
            ]
          : []),
        ...(onDeleteImage
          ? [
              {
                key: "delete-image",
                label: "Supprimer l'image",
                icon: "delete",
                variant: "destructive",
                onClick: () => onDeleteImage(item),
              },
            ]
          : []),
      ];

      return (
        <MediaItemView
          key={photo.key}
          workflow={workflow}
          item={item}
          mediaId={mediaId}
          src={photo.src}
          fit="cover"
          style={{
            width,
            height,
            aspectRatio: `${width} / ${height}`,
            transform: "translateZ(0)",
          }}
          className="group relative rounded-xl overflow-hidden bg-[#0a0a0a] border-none shadow-xl flex items-center justify-center"
          showLikedBadge={false}
          showVideoBadge={false}
          showMenu={false}
          showHoverOverlay={false}
          topLeft={null}
          contextMenuItems={contextMenuItems}
          topRight={
            (onSetCover || onDeleteImage) ? (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                <ButtonGroup className="bg-white/60 backdrop-blur-md rounded-lg border-0 border-none">
                  {onSetCover && (
                    <ActionBtn
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetCover(mediaId);
                      }}
                      title={isCover ? "Image de couverture" : "Définir comme couverture"}
                      aria-label="Couverture"
                    >
                      <GoogleIcon
                        iconName="bookmark"
                        fill={isCover}
                        className="text-[14px] text-[#303031]"
                      />
                    </ActionBtn>
                  )}
                  {onDeleteImage && (
                    <ActionBtn
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteImage(item);
                      }}
                      title="Supprimer l'image"
                      aria-label="Supprimer"
                      className="hover:text-red-600"
                    >
                      <GoogleIcon iconName="delete" className="text-[14px] text-[#303031]" />
                    </ActionBtn>
                  )}
                </ButtonGroup>
              </div>
            ) : null
          }
          overlay={
            isLoadingThis ? (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex items-center justify-center rounded-xl">
                <Loader2 className="size-6 text-white animate-spin" />
              </div>
            ) : null
          }
        />
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
    ]
  );

  const albumRender = useMemo(() => ({ photo: renderPhoto }), [renderPhoto]);

  return (
    <div className={cn("w-full overflow-y-auto custom-scrollbar p-1 border-none", className)}>
      <RowsPhotoAlbum
        photos={photos}
        defaultContainerWidth={900}
        targetRowHeight={targetRowHeight}
        spacing={16}
        rowConstraints={{ singleRowMaxHeight: Math.round(targetRowHeight * 1.35) }}
        render={albumRender}
      />
    </div>
  );
}

export default ReferenceMediaGalleryGrid;
