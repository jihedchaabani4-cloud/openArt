"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState, useEffect, useCallback, forwardRef, memo } from "react";
import { cn } from "@/shared/lib/utils";
import { ProcessingCard } from "@/components/cinema-studio/media/ProcessingCard";
import { FlowErrorTile } from "@/components/primitives/FlowErrorTile";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/primitives/context-menu";
import { MenuItemsList } from "@/components/base/menu";
import { StudioContextMenuContent } from "@/components/cinema-studio/media/StudioItemMenu";
import { useMediaViewerCore } from "@/features/workflows/core/useMediaViewerCore";
import { getBulkContextMenuSnapshot } from "@/features/workflows/model/studioBulkMenuBridge";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Button } from "@/components/base/button";
import { Checkbox } from "@/components/base/checkbox";

const BULK_CONTEXT_MENU_COMPONENTS = {
  Item: ContextMenuItem,
  Separator: ContextMenuSeparator,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
};

function buildBulkContextMenuItems(snapshot) {
  const { count, scope, isBusy, hasAllKeys } = snapshot;

  if (scope === "trash") {
    return [
      {
        key: "bulk-restore",
        label: "Restore",
        icon: "restore-bin",
        disabled: isBusy,
        onClick: snapshot.bulkRestore,
      },
      {
        key: "bulk-select-all",
        label: "Select all",
        icon: "select-01",
        disabled: isBusy || !hasAllKeys,
        onClick: snapshot.selectAll,
      },
      {
        key: "bulk-clear",
        label: "Clear selection",
        icon: "cancel-01",
        disabled: isBusy,
        onClick: snapshot.clearSelection,
      },
      { key: "sep-trash-danger", type: "separator" },
      {
        key: "bulk-delete-permanent",
        label: "Delete permanently",
        icon: "delete-02",
        variant: "destructive",
        disabled: isBusy,
        onClick: snapshot.openDeleteConfirm,
      },
    ];
  }

  const primaryItems = [];
  if (snapshot.canDownload) {
    primaryItems.push({
      key: "bulk-download",
      label: count > 1 ? `Download (${count})` : "Download",
      icon: "download-04",
      disabled: isBusy,
      onClick: snapshot.bulkDownload,
    });
  }
  if (snapshot.canMove) {
    primaryItems.push({
      key: "bulk-move",
      label: "Move to...",
      icon: "folder-transfer",
      disabled: isBusy,
      onClick: snapshot.openMoveDialog,
    });
  }
  if (snapshot.canLike) {
    primaryItems.push({
      key: "bulk-like",
      label: snapshot.isAllLiked ? "Unlike selected" : "Like selected",
      icon: "favourite",
      disabled: isBusy,
      onClick: snapshot.bulkToggleLike,
    });
  }
  if (snapshot.canAddToPrompt) {
    primaryItems.push({
      key: "bulk-add-to-prompt",
      label: "Add to Prompt",
      icon: "image-add-02",
      disabled: isBusy,
      onClick: snapshot.bulkAddToPrompt,
    });
  }

  return [
    ...primaryItems,
    ...(primaryItems.length > 0 ? [{ key: "sep-selection", type: "separator" }] : []),
    {
      key: "bulk-select-all",
      label: "Select all",
      icon: "select-01",
      disabled: isBusy || !hasAllKeys,
      onClick: snapshot.selectAll,
    },
    {
      key: "bulk-clear",
      label: "Clear selection",
      icon: "cancel-01",
      disabled: isBusy,
      onClick: snapshot.clearSelection,
    },
    { key: "sep-danger", type: "separator" },
    {
      key: "bulk-trash",
      label: "Move to Trash",
      icon: "delete-02",
      variant: "destructive",
      disabled: isBusy,
      onClick: snapshot.openDeleteConfirm,
    },
  ];
}

function BulkSelectionContextMenuContent({ snapshot }) {
  if (!snapshot || !snapshot.count) return null;
  const items = buildBulkContextMenuItems(snapshot);
  return (
    <ContextMenuContent data-bulk-context-menu="true">
      <ContextMenuLabel>{snapshot.count} selected</ContextMenuLabel>
      <MenuItemsList
        items={items}
        components={BULK_CONTEXT_MENU_COMPONENTS}
      />
    </ContextMenuContent>
  );
}

/**
 * CoreMediaItemPresenter - Pure presentational layout component for rendering media.
 * Does NOT call useMediaViewerCore; accepts normalized data and callbacks directly.
 */
export const CoreMediaItemPresenter = memo(
  forwardRef(function CoreMediaItemPresenter(
    {
      workflow,
      item = null,
      mediaId: _mediaId = null,
      core = {},
      src: propSrc = null,
      isVideo: propIsVideo = null,
      status: propStatus = null,
      aspect: propAspect = null,
      aspectRatio: propAspectRatio = null,
      error: propError = null,
      progress: propProgress = null,

      // Display configuration
      fit = "contain",
      surface = "default",
      className,
      outlineClassName,
      style: propStyle = {},
      mediaClassName,
      draggable = false,
      onDragStart,
      onDragEnd,
      onClick,

      // Slots for buttons and actions
      topLeft,
      topRight,
      bottomLeft,
      bottomRight,
      bottom,
      center,
      overlay,
      menuSlot = null,
      children,

      // Menu activation and items
      showMenu = false,
      activeMenu = false,
      menuItems: _menuItems = [],
      menuTrigger = null,
      menuPosition = "topRight",
      isMenuOpen: controlledMenuOpen,
      onMenuOpenChange: controlledOnMenuOpenChange,

      // Context Menu
      contextMenuItems = null,
      contextMenuContent = null,

      // Video options & callbacks
      autoPlay: _autoPlay = true,
      playOnHover = false,
      videoRef: externalVideoRef,
      onVideoTimeUpdate,
      onVideoLoadedMetadata,
      onVideoClick,
      showHoverOverlay = true,
      onRetry = null,
      canReusePrompt = true,
      onDelete = null,
      onMouseEnter: propOnMouseEnter,
      onMouseLeave: propOnMouseLeave,
      onContextMenu: propOnContextMenu,
      isLiked: propIsLiked = null,
      onLikeToggle = null,
      showLikedBadge = true,
      showVideoBadge = true,
      isSelected = false,
      isSelectionMode = false,
      selectionEnabled = false,
      onToggleSelect = null,
      ...props
    },
    ref
  ) {
    const internalVideoRef = useRef(null);
    const videoRef = externalVideoRef || core.videoRef || internalVideoRef;

    const url = propSrc || core.url || item?.url || item?.file_url || null;
    const isVideo = propIsVideo !== null
      ? Boolean(propIsVideo)
      : Boolean(
          core.isVideo ||
          item?.kind === "video" ||
          item?.is_video ||
          item?.type === "video" ||
          item?.asset_type === "video" ||
          (url && /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url))
        );
    const rawStatus = propStatus || core.status || item?.status || (url ? "completed" : null);
    const status = String(rawStatus || "").trim().toLowerCase();
    const error = propError || core.error || item?.error || null;
    const progress = propProgress !== null ? propProgress : (core.progress !== undefined ? core.progress : item?.progress ?? null);
    const displayAspect = propAspect || propAspectRatio || core.displayAspect;

    const isCompleted = (status === "completed" || status === "success" || status === "ready") && Boolean(url);
    const isProcessing = ["processing", "pending", "uploading", "queued", "in_progress", "starting"].includes(status);
    const isFailed = ["failed", "error", "rejected"].includes(status) || Boolean(error && !url);
    const isLiked = propIsLiked !== null
      ? Boolean(propIsLiked)
      : Boolean(
          item?.is_liked ||
          item?.favorited ||
          workflow?.is_liked ||
          workflow?.favorited ||
          workflow?.metadata?.favorited
        );

    // Directly respect showLikedBadge (no route-sniffing hazard)
    const effectiveShowLikedBadge = Boolean(showLikedBadge);
    const effectiveShowVideoBadge = Boolean(showVideoBadge) && Boolean(isVideo) && Boolean(url) && !isProcessing && !isFailed;

    // Local or controlled menu open state
    const [internalMenuOpen, setInternalMenuOpen] = useState(false);
    const isMenuOpen = controlledMenuOpen !== undefined ? controlledMenuOpen : internalMenuOpen;
    const _setMenuOpen = controlledOnMenuOpenChange || setInternalMenuOpen;

    const isMenuActive = !isSelectionMode && Boolean(showMenu || activeMenu || menuSlot || menuTrigger);

    // Local hover state for overlay visibility
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = useCallback((e) => {
      setIsHovered(true);
      if (playOnHover && !isSelectionMode && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
      propOnMouseEnter?.(e);
    }, [playOnHover, isSelectionMode, videoRef, propOnMouseEnter]);

    const handleMouseLeave = useCallback((e) => {
      setIsHovered(false);
      if (playOnHover && videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      propOnMouseLeave?.(e);
    }, [playOnHover, videoRef, propOnMouseLeave]);

    useEffect(() => {
      if (isSelectionMode && videoRef.current) {
        if (!videoRef.current.paused) {
          videoRef.current.pause();
        }
        if (videoRef.current.currentTime) {
          videoRef.current.currentTime = 0;
        }
      }
    }, [isSelectionMode, videoRef]);

    const handleContextMenu = useCallback((e) => {
      propOnContextMenu?.(e);
      if (isSelectionMode && !isSelected) {
        e.preventDefault();
      }
    }, [propOnContextMenu, isSelectionMode, isSelected]);

    const handleVideoLoaded = useCallback((e) => {
      core.handleVideoLoadedMetadata?.(e);
      onVideoLoadedMetadata?.(e);
    }, [core, onVideoLoadedMetadata]);

    const handleVideoTime = useCallback((e) => {
      core.handleVideoTimeUpdate?.(e);
      onVideoTimeUpdate?.(e);
    }, [core, onVideoTimeUpdate]);

    const handleCardClick = useCallback((e) => {
      if (onClick) {
        onClick(e, { workflow, item: core.targetItem || item, url });
      }
    }, [onClick, workflow, core.targetItem, item, url]);

    const isContain = fit === "contain";
    const hasContextMenu = Boolean((contextMenuItems && contextMenuItems.length > 0) || contextMenuContent);
    const showBulkContextMenu = Boolean(isSelectionMode && isSelected);
    const showSingleContextMenu = Boolean(!isSelectionMode && hasContextMenu);
    const shouldWrapContextMenu = Boolean(hasContextMenu || selectionEnabled || showBulkContextMenu);
    const isContextMenuDisabled = !showBulkContextMenu && !showSingleContextMenu;

    const [bulkMenuSnapshot, setBulkMenuSnapshot] = useState(null);
    const handleContextMenuOpenChange = useCallback(
      (open) => {
        if (showBulkContextMenu) {
          setBulkMenuSnapshot(open ? getBulkContextMenuSnapshot() : null);
        } else if (!open) {
          setBulkMenuSnapshot(null);
        }
      },
      [showBulkContextMenu]
    );

    const renderDropdownMenu = () => {
      if (menuSlot) return menuSlot;
      if (menuTrigger) return menuTrigger;
      return null;
    };

    const containerStyle = displayAspect ? { aspectRatio: displayAspect, ...propStyle } : propStyle;

    const displayName =
      core.prompt ||
      item?.prompt ||
      core.targetItem?.prompt ||
      item?.name ||
      core.targetItem?.name ||
      "Media";

    const cardElement = (
      <div
        ref={ref}
        data-selected={isSelected ? "true" : undefined}
        className={cn(
          "group relative select-none items-center justify-center overflow-hidden rounded-xxxs shadow-none transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          surface === "card" ? "bg-surface-card border-0" : "bg-black/40",
          isContain ? "inline-flex w-fit h-fit max-w-full max-h-full shrink-0" : "flex w-full h-full",
          draggable && !isSelectionMode
            ? "cursor-grab active:cursor-grabbing"
            : isSelectionMode || onClick
              ? "cursor-pointer"
              : "",
          isSelectionMode && !isSelected ? "opacity-50 hover:opacity-75" : "opacity-100",
          className
        )}
        draggable={draggable && !isSelectionMode}
        onDragStart={draggable && !isSelectionMode ? onDragStart : undefined}
        onDragEnd={draggable && !isSelectionMode ? onDragEnd : undefined}
        onClick={handleCardClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={containerStyle}
        {...props}
      >
        {/* ── 1. The Media Layer ── */}
        <div className={cn("relative flex items-center justify-center", isContain ? "w-fit h-fit max-w-full max-h-full" : "w-full h-full")}>
          {isCompleted && isVideo && (
            <video
              ref={videoRef}
              src={url}
              loop
              playsInline
              preload="metadata"
              muted={core.isMuted ?? true}
              onTimeUpdate={handleVideoTime}
              onLoadedMetadata={handleVideoLoaded}
              onClick={isSelectionMode ? undefined : (onVideoClick || core.togglePlay)}
              className={cn(
                isContain
                  ? "max-w-full max-h-full w-auto h-auto block object-contain select-none"
                  : "w-full h-full object-cover",
                mediaClassName
              )}
            />
          )}

          {isCompleted && !isVideo && (
            <div className={cn("relative flex items-center justify-center", isContain ? "w-fit h-fit max-w-full max-h-full" : "w-full h-full")}>
              {core.isMediaLoaded === false && (
                <div className="absolute inset-0 bg-surface-panel animate-pulse" />
              )}
              <img
                ref={(el) => {
                  if (el?.complete && el?.naturalWidth > 0 && core.isMediaLoaded === false) {
                    if (el.naturalWidth && el.naturalHeight) {
                      core.handleIntrinsicDimensions?.(el.naturalWidth, el.naturalHeight);
                    }
                    core.onMediaLoaded?.();
                  }
                }}
                src={url}
                alt={displayName}
                decoding="async"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img?.naturalWidth && img?.naturalHeight) {
                    core.handleIntrinsicDimensions?.(img.naturalWidth, img.naturalHeight);
                  }
                  core.onMediaLoaded?.();
                }}
                onError={core.onMediaError}
                className={cn(
                  "transition-opacity duration-300 select-none",
                  isContain
                    ? "max-w-full max-h-full w-auto h-auto block object-contain"
                    : "w-full h-full object-cover",
                  core.isMediaLoaded === false ? "opacity-0" : "opacity-100",
                  mediaClassName
                )}
              />
            </div>
          )}

          {isProcessing && (
            <ProcessingCard
              progress={progress}
              isVideo={isVideo}
              showPlayIcon={isVideo}
              className="w-full h-full rounded-none"
            />
          )}

          {isFailed && (
            <FlowErrorTile
              error={error}
              onReusePrompt={isSelectionMode ? undefined : onRetry}
              canReusePrompt={!isSelectionMode && canReusePrompt}
              onDelete={isSelectionMode ? undefined : onDelete}
              hideActions={isSelectionMode}
            />
          )}
        </div>

        {/* ── 2. Slot: Center ── */}
        {!isSelectionMode && center && (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div className="pointer-events-auto">
              {center}
            </div>
          </div>
        )}

        {/* ── 3. Overlay slots container ── */}
        <div
          className={cn(
            "absolute inset-0 z-20 pointer-events-none flex flex-col justify-between transition-opacity duration-200",
            showHoverOverlay &&
              !(isLiked && effectiveShowLikedBadge) &&
              !effectiveShowVideoBadge &&
              !(isSelectionMode || isSelected)
              ? (isHovered || isMenuOpen ? "opacity-100" : "opacity-0")
              : "opacity-100"
          )}
        >
          {/* Top edge slots */}
          <div className="w-full flex items-start justify-between p-2.5 gap-2">
            {/* Top Left Slot */}
            <div className="pointer-events-auto flex items-center gap-1.5">
              {selectionEnabled && (
                <div
                  data-slot="card-select-checkbox"
                  className={cn(
                    "relative z-30 flex items-center justify-center p-0.5 transition-opacity duration-150",
                    isSelectionMode || isSelected
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                  )}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect?.(e);
                  }}
                >
                  <Checkbox
                    variant="default"
                    size="lg"
                    checked={Boolean(isSelected)}
                    aria-label={isSelected ? "Deselect item" : "Select item"}
                    className={cn(
                      "border-border-heavy bg-fill-overlay",
                      isSelected && "border-text-primary bg-text-primary text-text-inverse"
                    )}
                  />
                </div>
              )}
              {!isSelectionMode && isLiked && effectiveShowLikedBadge && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLikeToggle?.(e);
                  }}
                  className={cn(
                    "size-7 transition-transform bg-transparent",
                    onLikeToggle ? "hover:scale-110 active:scale-95" : "cursor-default"
                  )}
                  title="Liked"
                  aria-label="Liked"
                >
                  <HugeIcon
                    name="favourite"
                    size="sm"
                    className="text-white drop-shadow"
                  />
                </Button>
              )}
              {effectiveShowVideoBadge && (
                <div
                  className="flex items-center justify-center w-7 h-7 bg-transparent border-0 shadow-none pointer-events-none select-none"
                  title="Video"
                  aria-label="Video"
                >
                  <HugeIcon
                    name="video-01"
                    size="sm"
                    className="text-white drop-shadow"
                  />
                </div>
              )}
              {!isSelectionMode && topLeft}
              {isMenuActive && menuPosition === "topLeft" && renderDropdownMenu()}
            </div>

            {/* Top Right Slot */}
            {!isSelectionMode && (
              <div className="pointer-events-auto flex items-center gap-1.5 ml-auto">
                {topRight}
                {isMenuActive && menuPosition === "topRight" && renderDropdownMenu()}
              </div>
            )}
          </div>

          {/* Bottom edge slots */}
          {!isSelectionMode && (
            <div className="w-full flex items-end justify-between p-3 gap-2">
              {/* Bottom Left Slot */}
              <div className="pointer-events-auto flex items-center gap-2 min-w-0">
                {bottomLeft}
                {isMenuActive && menuPosition === "bottomLeft" && renderDropdownMenu()}
              </div>

              {/* Bottom Right Slot */}
              <div className="pointer-events-auto flex items-center gap-2 ml-auto shrink-0">
                {bottomRight}
                {isMenuActive && menuPosition === "bottomRight" && renderDropdownMenu()}
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Slot: Bottom Bar (e.g. Video Controls, Timeline) ── */}
        {!isSelectionMode && bottom && (
          <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-auto">
            {bottom}
          </div>
        )}

        {/* ── 5. Slot: General Overlay / Children ── */}
        {(overlay || children) && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            {overlay || children}
          </div>
        )}

        {/* ── 6. Subtle Dark Hover Scrim (Cards) ── */}
        {!isContain && !isProcessing && !isFailed && !isSelectionMode && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
        )}

        {/* ── 7. Selected Frame Outline (single hairline 1px border inside contain: paint) ── */}
        {(selectionEnabled || isSelected) && (
          <div
            data-slot="card-selected-outline"
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 z-30 rounded-xxxs border border-text-primary/65 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              outlineClassName,
              isSelected ? "opacity-100" : "opacity-0"
            )}
          />
        )}
      </div>
    );

    if (shouldWrapContextMenu) {
      return (
        <ContextMenu onOpenChange={handleContextMenuOpenChange}>
          <ContextMenuTrigger asChild disabled={isContextMenuDisabled}>
            {cardElement}
          </ContextMenuTrigger>
          {showBulkContextMenu
            ? bulkMenuSnapshot && <BulkSelectionContextMenuContent snapshot={bulkMenuSnapshot} />
            : showSingleContextMenu && (
                contextMenuContent || (
                  <StudioContextMenuContent items={contextMenuItems || []} />
                )
              )}
        </ContextMenu>
      );
    }

    return cardElement;
  })
);
CoreMediaItemPresenter.displayName = "CoreMediaItemPresenter";

/**
 * Connected wrapper that unconditionally runs useMediaViewerCore when no external core is passed.
 */
const MediaViewConnected = memo(
  forwardRef(function MediaViewConnected(props, ref) {
    const shouldAutoPlay = props.autoPlay && !props.playOnHover;
    const effectiveItem = props.media !== undefined ? props.media : props.item;
    const core = useMediaViewerCore({
      workflow: props.workflow,
      item: effectiveItem,
      mediaId: props.mediaId,
      src: props.src,
      autoPlay: shouldAutoPlay,
    });

    return <CoreMediaItemPresenter {...props} item={effectiveItem} core={core} ref={ref} />;
  })
);
MediaViewConnected.displayName = "MediaViewConnected";

/**
 * MediaView - Canonical declarative media presentation component.
 *
 * Source contract:
 * - Direct media: `media={media}` or `item={item}` (normalized MediaItem or raw asset).
 * - Workflow: `workflow={workflow}` (primary media resolved via resolveMainMedia).
 * - Direct media + workflow context: if both are provided, direct media is the visual target;
 *   workflow provides contextual metadata (e.g. favorited state).
 * - mediaId: resolves target item within workflow.items or project.
 * - core: bypasses hook execution when precomputed by caller.
 * - src: direct URL string.
 */
export const MediaView = memo(
  forwardRef(function MediaView(props, ref) {
    if (props.core) {
      const effectiveItem = props.media !== undefined ? props.media : props.item;
      return <CoreMediaItemPresenter {...props} item={effectiveItem} ref={ref} />;
    }
    return <MediaViewConnected {...props} ref={ref} />;
  })
);
MediaView.displayName = "MediaView";

/**
 * Backward compatibility export.
 */
export const CoreMediaItemView = MediaView;
export default MediaView;
