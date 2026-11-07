"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState, useCallback, forwardRef, memo } from "react";
import { cn } from "@/shared/lib/utils";
import { ProcessingCard } from "@/shared/ui/ProcessingCard";
import { FlowErrorTile } from "@/shared/ui/FlowErrorTile";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/shared/ui/context-menu";
import { useMediaViewerCore } from "@/features/workflows/core/useMediaViewerCore";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";

function filterActiveMenuItems(items = []) {
  if (!items || !items.length) return [];
  const filtered = items.filter(
    (m) => m && (m.type === "separator" || m.key === "separator" || m.key?.startsWith("sep-") || !m.disabled)
  );
  const result = [];
  for (let i = 0; i < filtered.length; i++) {
    const curr = filtered[i];
    const isSep = curr.type === "separator" || curr.key === "separator" || curr.key?.startsWith("sep-");
    if (isSep) {
      if (result.length === 0) continue;
      const prev = result[result.length - 1];
      const prevIsSep = prev.type === "separator" || prev.key === "separator" || prev.key?.startsWith("sep-");
      if (prevIsSep) continue;
    }
    result.push(curr);
  }
  if (result.length > 0) {
    const last = result[result.length - 1];
    if (last.type === "separator" || last.key === "separator" || last.key?.startsWith("sep-")) {
      result.pop();
    }
  }
  return result;
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
      isLiked: propIsLiked = null,
      onLikeToggle = null,
      showLikedBadge = true,
      showVideoBadge = true,
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

    const isMenuActive = Boolean(showMenu || activeMenu || menuSlot || menuTrigger);

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
        className={cn(
          "group relative select-none items-center justify-center overflow-hidden rounded-xxxs shadow-none",
          surface === "card"
            ? "bg-surface-card border border-white/10 hover:border-white/20 transition-none"
            : "bg-black/40",
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
                    className="text-base text-white fill-white drop-shadow"
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
                    className="text-base text-white drop-shadow"
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
      const activeCtxItems = filterActiveMenuItems(contextMenuItems || []);
      return (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {cardElement}
          </ContextMenuTrigger>
          {contextMenuContent || (
            <ContextMenuContent className="min-w-48">
              {activeCtxItems.map((m, i) => {
                if (m.key === "separator" || m.type === "separator") {
                  return <ContextMenuSeparator key={m.key || `ctx-sep-${i}`} className="my-1.5" />;
                }
                return (
                  <ContextMenuItem
                    key={m.key || m.id || i}
                    variant={m.variant}
                    disabled={m.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (m.disabled) return;
                      m.onClick?.(e);
                    }}
                    className={cn(
                      "cursor-pointer",
                      m.variant === "destructive" && "text-destructive"
                    )}
                  >
                    {m.icon && (
                      typeof m.icon === "string" ? (
                        <GoogleIcon
                          iconName={m.icon}
                          className={cn("text-base shrink-0", m.iconClassName)}
                          fill={m.fill}
                        />
                      ) : (
                        m.icon
                      )
                    )}
                    <span className="truncate">{m.label}</span>
                  </ContextMenuItem>
                );
              })}
            </ContextMenuContent>
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
