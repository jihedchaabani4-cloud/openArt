"use client";

import { useMemo } from "react";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { ButtonGroup } from "@/shared/ui/button-group";
import { ActionBtn } from "@/shared/ui/action-button";
import { SharedGalleryGrid, MediaView } from "@/features/media";

export const DEFAULT_REFERENCE_ROW_HEIGHT = 300;
export const DEFAULT_CHARACTER_ROW_HEIGHT = 300;

/**
 * ReferenceMediaCard
 *
 * Dedicated presentational adapter component for Reference Media (Characters & Elements),
 * delegating media rendering to MediaItemView while providing reference-specific actions:
 * cover selection, deletion, loading states, and right-click context menu.
 */
export function ReferenceMediaCard({
  item,
  workflow = null,
  primaryMediaId = null,
  pendingUrls = [],
  deletingMediaId = null,
  onSetCover,
  onDeleteImage,
  width,
  height,
  className,
  onClick,
}) {
  const rawItem = item?.raw || item;
  const mediaId = item?.id || rawItem?.id || rawItem?.name || rawItem?.asset_id;
  const isCover =
    (primaryMediaId && (mediaId === primaryMediaId || item?.asset_id === primaryMediaId || rawItem?.asset_id === primaryMediaId)) ||
    (!primaryMediaId && Boolean(item?.is_primary || item?.isPrimary || rawItem?.is_primary || rawItem?.isPrimary));
  const isDeletingThis = deletingMediaId === mediaId;
  const url = item?.url || item?.file_url || rawItem?.url || rawItem?.file_url || rawItem?.asset?.file_url || null;
  const isAddingThis = Array.isArray(pendingUrls) && Boolean(url) && pendingUrls.includes(url);
  const isLoadingThis = isDeletingThis || isAddingThis;

  const contextMenuItems = useMemo(
    () => [
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
              onClick: () => onDeleteImage(rawItem),
            },
          ]
        : []),
    ],
    [onSetCover, onDeleteImage, isCover, mediaId, rawItem]
  );

  return (
    <MediaView
      workflow={workflow}
      item={rawItem}
      mediaId={mediaId}
      src={url || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
      fit="cover"
      style={{
        width,
        height,
        aspectRatio: width && height ? `${width} / ${height}` : undefined,
        transform: "translateZ(0)",
      }}
      className={cn(
        "group relative overflow-hidden bg-[#0a0a0a] border-none shadow-none flex items-center justify-center",
        className
      )}
      showLikedBadge={false}
      showVideoBadge={false}
      showMenu={false}
      showHoverOverlay={false}
      topLeft={null}
      contextMenuItems={contextMenuItems}
      onClick={onClick}
      topRight={
        (onSetCover || onDeleteImage) ? (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
            <ButtonGroup variant="pill" className="bg-white/60">
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
                    className="text-xs"
                  />
                </ActionBtn>
              )}
              {onDeleteImage && (
                <ActionBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteImage(rawItem);
                  }}
                  title="Supprimer l'image"
                  aria-label="Supprimer"
                  className="hover:text-error"
                >
                  <GoogleIcon iconName="delete" className="text-xs hover:text-error" />
                </ActionBtn>
              )}
            </ButtonGroup>
          </div>
        ) : null
      }
      overlay={
        isLoadingThis ? (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 flex items-center justify-center">
            <GoogleIcon iconName="progress_activity" className="text-2xl text-white animate-spin" />
          </div>
        ) : null
      }
    />
  );
}

/**
 * ReferenceMediaGalleryGrid
 *
 * Consolidated photo album grid for reference detail images (used by Characters and Elements)
 * powered directly by the canonical SharedGalleryGrid layout engine.
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
  spacing: propSpacing = 16,
  onDeleteImage,
  onSetCover,
  isSettingCover,
  className,
}) {
  const validItems = useMemo(
    () => items.filter((m) => Boolean(m?.url || m?.file_url || m?.asset?.file_url || m?.id || m?.name || m?.asset_id)),
    [items]
  );

  const cardProps = useMemo(
    () => ({
      workflow,
      primaryMediaId,
      pendingUrls,
      deletingMediaId,
      onDeleteImage,
      onSetCover,
      isSettingCover,
    }),
    [
      workflow,
      primaryMediaId,
      pendingUrls,
      deletingMediaId,
      onDeleteImage,
      onSetCover,
      isSettingCover,
    ]
  );

  const rowConstraints = useMemo(
    () => ({ singleRowMaxHeight: Math.round(targetRowHeight * 1.35) }),
    [targetRowHeight]
  );

  return (
    <div className={cn("w-full overflow-y-auto custom-scrollbar p-1 border-none", className)}>
      <SharedGalleryGrid
        items={validItems}
        workflow={workflow}
        CardComponent={ReferenceMediaCard}
        cardProps={cardProps}
        targetRowHeight={targetRowHeight}
        spacing={propSpacing}
        defaultContainerWidth={900}
        rowConstraints={rowConstraints}
        itemClassName="border-none"
      />
    </div>
  );
}

export default ReferenceMediaGalleryGrid;
