"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState, useEffect, useCallback, forwardRef, memo } from "react";
import { cn } from "@/shared/lib/utils";
import {
  normalizeCssAspectRatio,
  parseAspectRatioValue,
  setCachedImageDimensions,
} from "@/shared/lib/displayUtils";
import { ProcessingCard } from "@/components/cinema-studio/media/ProcessingCard";
import { UploadingCard } from "@/components/cinema-studio/media/UploadingCard";
import {
  WorkflowTypeBadge,
  resolveWorkflowBadgeType,
} from "@/components/cinema-studio/media/WorkflowTypeBadge";
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
import {
  resolveMediaLifecycle,
  resolveStudioActions,
} from "@/features/workflows/lib/studioActionRules";
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
      prompt: propPrompt = null,

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
      showTypeBadge = true,
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
    const rawStatus = propStatus || core.status || item?.raw?.status || item?.status || workflow?.status || (url ? "completed" : null);
    const error = propError || core.error || item?.error || null;
    const effectiveStatus =
      rawStatus && String(rawStatus).trim().toLowerCase() !== "completed"
        ? rawStatus
        : error && !url
          ? "failed"
          : rawStatus;
    const progress = propProgress !== null ? propProgress : (core.progress !== undefined ? core.progress : item?.progress ?? null);
    const uploadId =
      item?.uploadId ||
      item?.raw?.uploadId ||
      workflow?.uploadId ||
      item?.workflowId ||
      item?.workflow_id ||
      workflow?.name ||
      workflow?.id ||
      null;
    const displayAspect =
      normalizeCssAspectRatio(core.intrinsicAspect) ||
      normalizeCssAspectRatio(propAspect) ||
      normalizeCssAspectRatio(propAspectRatio) ||
      normalizeCssAspectRatio(core.displayAspect);

    const actionRules = resolveStudioActions({
      workflow,
      item,
      status: effectiveStatus,
      isVideo,
      hasUrl: Boolean(url),
      hasReusablePrompt: canReusePrompt,
      isSelectionMode,
      isSelected,
    });
    // Render media visuals from the targeted item so a sibling in-flight item in workflow.items
    // never replaces a completed preview with ProcessingCard.
    const visualLifecycle = resolveMediaLifecycle({
      status: effectiveStatus,
      item,
      workflow: item || propStatus ? null : workflow,
    });
    const isUploading = visualLifecycle === "uploading";
    const isCompleted = visualLifecycle === "completed" && Boolean(url);
    const isProcessing = visualLifecycle === "processing";
    const isFailed = visualLifecycle === "failed";
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
    const workflowBadgeType = resolveWorkflowBadgeType({ workflow, item, isVideo });
    const effectiveShowTypeBadge =
      Boolean(showTypeBadge) &&
      Boolean(showVideoBadge) &&
      Boolean(workflowBadgeType) &&
      Boolean(url) &&
      !isUploading &&
      !isProcessing &&
      !isFailed;

    // Local or controlled menu open state
    const [internalMenuOpen, setInternalMenuOpen] = useState(false);
    const isMenuOpen = controlledMenuOpen !== undefined ? controlledMenuOpen : internalMenuOpen;
    const _setMenuOpen = controlledOnMenuOpenChange || setInternalMenuOpen;

    const isMenuActive =
      actionRules.can.openMenu &&
      !isSelectionMode &&
      Boolean(showMenu || activeMenu || menuSlot || menuTrigger);

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

    const isInFlight = actionRules.isInFlight;

    const handleContextMenu = useCallback((e) => {
      if (isInFlight) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      propOnContextMenu?.(e);
      if (isSelectionMode && !isSelected) {
        e.preventDefault();
      }
    }, [isInFlight, propOnContextMenu, isSelectionMode, isSelected]);

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
    const resolvedAspectRatioNum =
      parseAspectRatioValue(displayAspect)?.ratio ?? Number(core.aspectRatioNumber || 1);
    const isLandscapeContainFallback =
      isContain && !isCompleted && resolvedAspectRatioNum > 1;
    const effectiveSelectionEnabled = Boolean(selectionEnabled && actionRules.can.select);
    const canNativeDrag = Boolean(draggable && !isSelectionMode && actionRules.can.drag);
    const hasContextMenu = Boolean(
      !isInFlight && ((contextMenuItems && contextMenuItems.length > 0) || contextMenuContent)
    );
    const showBulkContextMenu = Boolean(actionRules.can.openMenu && isSelectionMode && isSelected);
    const showSingleContextMenu = Boolean(actionRules.can.openMenu && !isSelectionMode && hasContextMenu);
    const shouldWrapContextMenu = Boolean(hasContextMenu || effectiveSelectionEnabled || showBulkContextMenu);
    const isContextMenuDisabled = !actionRules.can.openMenu || (!showBulkContextMenu && !showSingleContextMenu);

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

    const effectiveAspect = displayAspect || (!isCompleted && isContain ? "1 / 1" : null);
    const containerStyle = effectiveAspect ? { aspectRatio: effectiveAspect, ...propStyle } : propStyle;

    const resolvedPrompt =
      propPrompt ||
      core.prompt ||
      item?.params?.prompt ||
      item?.prompt ||
      core.targetItem?.prompt ||
      workflow?.prompt ||
      workflow?.metadata?.prompt ||
      workflow?.metadata?.generationConfig?.prompt ||
      item?.generationConfig?.prompt ||
      null;

    const displayName =
      resolvedPrompt ||
      item?.name ||
      core.targetItem?.name ||
      "Media";

    const cardElement = (
      <div
        ref={ref}
        data-selected={isSelected && !isInFlight ? "true" : undefined}
        className={cn(
          "group relative select-none items-center justify-center overflow-hidden rounded-comfortable shadow-none transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          surface === "card"
            ? "bg-surface-card border-0"
            : isContain && isCompleted
              ? "bg-transparent"
              : "bg-black/40",
          isContain && !isCompleted
            ? isLandscapeContainFallback
              ? "flex w-full h-auto max-w-full max-h-full shrink-0 rounded-comfortable"
              : "flex h-full w-auto max-w-full max-h-full shrink-0 rounded-comfortable"
            : "flex w-full h-full",
          isInFlight
            ? "cursor-default"
            : canNativeDrag
              ? "cursor-grab active:cursor-grabbing"
              : isSelectionMode || onClick
                ? "cursor-pointer"
                : "",
          isSelectionMode && !isSelected
            ? (isInFlight ? "opacity-50" : "opacity-50 hover:opacity-75")
            : "opacity-100",
          className
        )}
        draggable={canNativeDrag}
        onDragStart={canNativeDrag ? onDragStart : undefined}
        onDragEnd={canNativeDrag ? onDragEnd : undefined}
        onClick={isInFlight ? undefined : handleCardClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={containerStyle}
        {...props}
      >
        {/* ── 1. The Media Layer ── */}
        <div className="relative flex items-center justify-center w-full h-full">
          {isCompleted && isVideo && (
            <video
              key={url}
              ref={(el) => {
                if (videoRef && typeof videoRef === "object") {
                  videoRef.current = el;
                }
                if (el && el.readyState >= 1 && el.videoWidth > 0 && el.videoHeight > 0) {
                  if (core.handleIntrinsicDimensions) {
                    core.handleIntrinsicDimensions(el.videoWidth, el.videoHeight, url);
                  } else if (url) {
                    setCachedImageDimensions(url, el.videoWidth, el.videoHeight);
                  }
                }
              }}
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
                  ? "w-full h-full block object-contain select-none"
                  : "w-full h-full object-cover",
                mediaClassName
              )}
            />
          )}

          {isCompleted && !isVideo && (
            <div className="relative flex items-center justify-center w-full h-full">
              {core.isMediaLoaded === false && (
                <div className="absolute inset-0 bg-surface-panel animate-pulse" />
              )}
              <img
                key={url}
                ref={(el) => {
                  if (
                    el?.complete &&
                    el?.naturalWidth > 0 &&
                    el?.naturalHeight > 0 &&
                    el.getAttribute("src") === url &&
                    (!el.currentSrc || el.currentSrc === el.src)
                  ) {
                    if (core.handleIntrinsicDimensions) {
                      core.handleIntrinsicDimensions(el.naturalWidth, el.naturalHeight, url);
                    } else if (url) {
                      setCachedImageDimensions(url, el.naturalWidth, el.naturalHeight);
                    }
                    if (core.isMediaLoaded === false) {
                      core.onMediaLoaded?.();
                    }
                  }
                }}
                src={url}
                alt={displayName}
                decoding="async"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img?.naturalWidth && img?.naturalHeight) {
                    if (core.handleIntrinsicDimensions) {
                      core.handleIntrinsicDimensions(img.naturalWidth, img.naturalHeight, url);
                    } else if (url) {
                      setCachedImageDimensions(url, img.naturalWidth, img.naturalHeight);
                    }
                  }
                  core.onMediaLoaded?.();
                }}
                onError={core.onMediaError}
                className={cn(
                  "transition-opacity duration-300 select-none",
                  isContain
                    ? "w-full h-full block object-contain"
                    : "w-full h-full object-cover",
                  core.isMediaLoaded === false ? "opacity-0" : "opacity-100",
                  mediaClassName
                )}
              />
            </div>
          )}

          {isUploading && (
            <UploadingCard
              src={url}
              isVideo={isVideo}
              progress={progress}
              uploadId={uploadId}
              alt={displayName}
              className="w-full h-full rounded-none"
            />
          )}

          {isProcessing && (
            <ProcessingCard
              progress={progress}
              isVideo={isVideo}
              showPlayIcon={isVideo}
              prompt={resolvedPrompt}
              onReusePrompt={undefined}
              canReusePrompt={false}
              className="w-full h-full rounded-none border-0"
            />
          )}

          {isFailed && (
            <FlowErrorTile
              error={error}
              onReusePrompt={actionRules.can.reusePrompt ? onRetry : undefined}
              canReusePrompt={actionRules.can.reusePrompt}
              onDelete={actionRules.can.delete ? onDelete : undefined}
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
              !(actionRules.can.like && isLiked && effectiveShowLikedBadge) &&
              !effectiveShowTypeBadge &&
              !(isSelectionMode || isSelected)
              ? (isHovered || isMenuOpen ? "opacity-100" : "opacity-0")
              : "opacity-100"
          )}
        >
          {/* Top edge slots */}
          <div className="w-full flex items-start justify-between p-2.5 gap-2">
            {/* Top Left Slot */}
            <div className="pointer-events-auto flex items-center gap-1.5">
              {effectiveSelectionEnabled && (
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
              {actionRules.can.like && isLiked && effectiveShowLikedBadge && (
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
                    filled
                    size="sm"
                    className="text-white drop-shadow"
                  />
                </Button>
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
          {(!isSelectionMode || effectiveShowTypeBadge) && (
            <div className="w-full flex items-end justify-between p-3 gap-2">
              {/* Bottom Left Slot */}
              {!isSelectionMode && (
                <div className="pointer-events-auto flex items-center gap-2 min-w-0">
                  {bottomLeft}
                  {isMenuActive && menuPosition === "bottomLeft" && renderDropdownMenu()}
                </div>
              )}

              {/* Bottom Right Slot */}
              <div
                data-slot="media-bottom-right"
                className="pointer-events-auto flex items-center gap-2 ml-auto shrink-0"
              >
                {!isSelectionMode && bottomRight}
                {effectiveShowTypeBadge && (
                  <WorkflowTypeBadge type={workflowBadgeType} />
                )}
                {!isSelectionMode && isMenuActive && menuPosition === "bottomRight" && renderDropdownMenu()}
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
        {!isContain && !isUploading && !isProcessing && !isFailed && !isSelectionMode && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          />
        )}

        {/* ── 7. Selected Frame Outline (single hairline 1px border inside contain: paint) ── */}
        {(effectiveSelectionEnabled || (isSelected && !isInFlight)) && (
          <div
            data-slot="card-selected-outline"
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 z-30 rounded-comfortable border border-text-primary/65 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              outlineClassName,
              isSelected && !isInFlight ? "opacity-100" : "opacity-0"
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
