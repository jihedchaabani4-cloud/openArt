"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState, useCallback } from "react";
import { cn } from "@/shared/lib/utils";
import { ProcessingCard } from "@/shared/ui/ProcessingCard";
import { FlowErrorTile } from "@/shared/ui/FlowErrorTile";
import { StudioItemDropdownMenu, StudioContextMenuContent } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu";
import { ContextMenu, ContextMenuTrigger } from "@/shared/ui/context-menu";
import { useMediaViewerCore } from "@/features/workflows/core/useMediaViewerCore";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";

/**
 * CoreMediaItemPresenter - Pure presentational layout component for rendering media.
 * Does NOT call useMediaViewerCore; accepts normalized data and callbacks directly.
 */
export function CoreMediaItemPresenter({
  workflow,
  item = null,
  mediaId: _mediaId = null,
  core = {},
  src: propSrc = null,
  isVideo: propIsVideo = null,
  status: propStatus = null,
  aspect: propAspect = null,
  error: propError = null,
  progress: propProgress = null,

  // Display configuration
  fit = "contain",
  className,
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
  menuItems = [],
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
  isLiked: propIsLiked = null,
  onLikeToggle = null,
  showLikedBadge = true,
  showVideoBadge = true,
  ...props
}) {
  const internalVideoRef = useRef(null);
  const videoRef = externalVideoRef || core.videoRef || internalVideoRef;

  const isVideo = propIsVideo !== null ? propIsVideo : core.isVideo;
  const url = propSrc || core.url;
  const status = propStatus || core.status;
  const error = propError || core.error;
  const progress = propProgress !== null ? propProgress : core.progress;
  const displayAspect = propAspect || core.displayAspect;

  const isCompleted = status === "completed" && Boolean(url);
  const isProcessing = ["processing", "pending", "uploading", "queued"].includes(status);
  const isFailed = ["failed", "error", "rejected"].includes(status);
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
  const setMenuOpen = controlledOnMenuOpenChange || setInternalMenuOpen;

  const isMenuActive = Boolean(showMenu || activeMenu || menuSlot);

  // Local hover state for overlay visibility
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback((e) => {
    setIsHovered(true);
    if (playOnHover && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    propOnMouseEnter?.(e);
  }, [playOnHover, videoRef, propOnMouseEnter]);

  const handleMouseLeave = useCallback((e) => {
    setIsHovered(false);
    if (playOnHover && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    propOnMouseLeave?.(e);
  }, [playOnHover, videoRef, propOnMouseLeave]);

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

  const renderDropdownMenu = () => {
    if (menuSlot) return menuSlot;
    if (isMenuActive) {
      return (
        <StudioItemDropdownMenu
          items={menuItems}
          open={isMenuOpen}
          onOpenChange={setMenuOpen}
          trigger={menuTrigger}
        />
      );
    }
    return null;
  };

  const cardElement = (
    <div
      className={cn(
        "group relative select-none items-center justify-center overflow-hidden rounded-lg bg-black/40 shadow-2xl",
        isContain ? "inline-flex w-fit h-fit max-w-full max-h-full shrink-0" : "flex w-full h-full",
        draggable ? "cursor-grab active:cursor-grabbing" : onClick ? "cursor-pointer" : "",
        className
      )}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...(displayAspect ? { aspectRatio: displayAspect } : {}),
        ...propStyle,
      }}
      {...props}
    >
      {/* ── 1. The Media Layer ── */}
      <div className={cn("relative flex items-center justify-center overflow-hidden", isContain ? "w-fit h-fit max-w-full max-h-full" : "w-full h-full")}>
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
            onClick={onVideoClick || core.togglePlay}
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
              <div className="absolute inset-0 bg-[#15161a] animate-pulse rounded-lg" />
            )}
            <img
              src={url}
              alt={core.prompt || item?.name || "Media"}
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
            onReusePrompt={onRetry}
            canReusePrompt={canReusePrompt}
            onDelete={onDelete}
          />
        )}
      </div>

      {/* ── 2. Slot: Center ── */}
      {center && (
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
          showHoverOverlay && !(isLiked && effectiveShowLikedBadge) && !effectiveShowVideoBadge
            ? (isHovered || isMenuOpen ? "opacity-100" : "opacity-0")
            : "opacity-100"
        )}
      >
        {/* Top edge slots */}
        <div className="w-full flex items-start justify-between p-3 gap-2">
          {/* Top Left Slot */}
          <div className="pointer-events-auto flex items-center gap-2">
            {isLiked && effectiveShowLikedBadge && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
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
                <GoogleIcon
                  iconName="favorite"
                  fill={true}
                  className="text-base text-white fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                />
              </Button>
            )}
            {effectiveShowVideoBadge && (
              <div
                className="flex items-center justify-center w-7 h-7 bg-transparent border-0 shadow-none pointer-events-none select-none"
                title="Video"
                aria-label="Video"
              >
                <GoogleIcon
                  iconName="videocam"
                  className="text-[16px] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                />
              </div>
            )}
            {topLeft}
            {isMenuActive && menuPosition === "topLeft" && renderDropdownMenu()}
          </div>

          {/* Top Right Slot */}
          <div className="pointer-events-auto flex items-center gap-1.5 ml-auto">
            {topRight}
            {isMenuActive && menuPosition === "topRight" && renderDropdownMenu()}
          </div>
        </div>

        {/* Bottom edge slots */}
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
      </div>

      {/* ── 4. Slot: Bottom Bar (e.g. Video Controls, Timeline) ── */}
      {bottom && (
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
    </div>
  );

  if (hasContextMenu) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {cardElement}
        </ContextMenuTrigger>
        {contextMenuContent || (
          <StudioContextMenuContent items={contextMenuItems} />
        )}
      </ContextMenu>
    );
  }

  return cardElement;
}

/**
 * Connected wrapper that unconditionally runs useMediaViewerCore when no external core is passed.
 */
function CoreMediaItemConnected(props) {
  const shouldAutoPlay = props.autoPlay && !props.playOnHover;
  const core = useMediaViewerCore({
    workflow: props.workflow,
    item: props.item,
    mediaId: props.mediaId,
    autoPlay: shouldAutoPlay,
  });

  return <CoreMediaItemPresenter {...props} core={core} />;
}

/**
 * CoreMediaItemView container.
 * If `core` is passed, delegates directly to CoreMediaItemPresenter without allocating hook state.
 */
export function CoreMediaItemView(props) {
  if (props.core) {
    return <CoreMediaItemPresenter {...props} />;
  }
  return <CoreMediaItemConnected {...props} />;
}

export default CoreMediaItemView;
