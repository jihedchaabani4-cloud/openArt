"use client";

import React, { useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { ProcessingCard } from "@/shared/ui/ProcessingCard";
import { FlowErrorTile } from "@/shared/ui/FlowErrorTile";
import { StudioItemDropdownMenu, StudioContextMenuContent } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu";
import { ContextMenu, ContextMenuTrigger } from "@/shared/ui/context-menu";
import { useMediaViewerCore } from "@/features/workflows/core/useMediaViewerCore";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

/**
 * CoreMediaItemView
 * 
 * Simple, flexible core layout component for rendering any media item.
 * Provides designated slots for buttons, overlays, and a toggleable menu.
 * 
 * Slots:
 * - topLeft: e.g. status tags, liked indicator, badges
 * - topRight: e.g. action buttons, like, history
 * - bottomLeft: e.g. title pill, prompt text
 * - bottomRight: e.g. entity badge, format pill
 * - bottom: e.g. video scrubber bar, timeline controls
 * - center: e.g. play button or centered icon
 * - overlay: custom elements rendered over the media
 * 
 * Menu Configuration:
 * - showMenu / activeMenu (boolean): whether to display the menu trigger
 * - menuItems (array): list of items [{ key, label, icon, onClick, variant, disabled }]
 * - menuTrigger (ReactNode): custom trigger element (defaults to 3-dots ActionBtn)
 * - menuPosition ("topRight" | "topLeft" | "bottomRight" | "bottomLeft"): default "topRight"
 */
export function CoreMediaItemView({
  // Media source props
  workflow,
  item = null,
  mediaId = null,
  core: propCore = null,
  src: propSrc = null,
  isVideo: propIsVideo = null,
  status: propStatus = null,
  aspect: propAspect = null,
  error: propError = null,
  progress: propProgress = null,

  // Display configuration
  fit = "contain", // "contain" for full uncropped view, "cover" for grid tiles
  className,
  style: propStyle = {},
  mediaClassName,
  draggable = false,
  onDragStart,
  onDragEnd,
  onClick,

  // Slots for buttons & actions ("b9aya3 l button places")
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  bottom,
  center,
  overlay,
  children,

  // Menu activation & items ("fazet l active w deactive l menu")
  showMenu = false,
  activeMenu = false,
  menuItems = [],
  menuTrigger = null,
  menuPosition = "topRight",
  isMenuOpen: controlledMenuOpen,
  onMenuOpenChange: controlledOnMenuOpenChange,

  // Context Menu (Right-click menu)
  contextMenuItems = null,
  contextMenuContent = null,

  // Video options & callbacks
  autoPlay = true,
  playOnHover = false,
  videoRef: externalVideoRef,
  onVideoTimeUpdate,
  onVideoLoadedMetadata,
  onVideoClick,
  showHoverOverlay = true,
  onRetry = null,
  onDelete = null,
  onMouseEnter: propOnMouseEnter,
  onMouseLeave: propOnMouseLeave,
  isLiked: propIsLiked = null,
  onLikeToggle = null,
  showLikedBadge = true,
  showVideoBadge = true,
  ...props
}) {
  // Use media core hook to resolve metadata, sizing, and media state
  const shouldAutoPlay = autoPlay && !playOnHover;
  const localCore = useMediaViewerCore({ workflow, item, mediaId, autoPlay: shouldAutoPlay });
  const core = propCore || localCore;
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

  // Automatically hide liked badge on edit pages unless explicitly forced
  let isEditRoute = false;
  try {
    if (typeof window !== "undefined" && window.location?.pathname?.includes("/edit")) {
      isEditRoute = true;
    }
  } catch {}
  const effectiveShowLikedBadge = Boolean(showLikedBadge) && !isEditRoute;
  const effectiveShowVideoBadge = Boolean(showVideoBadge) && Boolean(isVideo) && Boolean(url) && !isProcessing && !isFailed;

  // Local or controlled menu open state
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const isMenuOpen = controlledMenuOpen !== undefined ? controlledMenuOpen : internalMenuOpen;
  const setMenuOpen = controlledOnMenuOpenChange || setInternalMenuOpen;

  const isMenuActive = Boolean(showMenu || activeMenu);

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
    core.handleVideoLoadedMetadata(e);
    onVideoLoadedMetadata?.(e);
  }, [core, onVideoLoadedMetadata]);

  const handleVideoTime = useCallback((e) => {
    core.handleVideoTimeUpdate(e);
    onVideoTimeUpdate?.(e);
  }, [core, onVideoTimeUpdate]);

  const handleCardClick = useCallback((e) => {
    if (onClick) {
      onClick(e, { workflow, item: core.targetItem, url });
    }
  }, [onClick, workflow, core.targetItem, url]);

  const isContain = fit === "contain";
  const hasContextMenu = Boolean((contextMenuItems && contextMenuItems.length > 0) || contextMenuContent);

  const cardElement = (
    <div
      className={cn(
        "group relative select-none items-center justify-center overflow-hidden rounded-xl bg-black/40 shadow-2xl",
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
            muted={core.isMuted}
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
            {!core.isMediaLoaded && (
              <div className="absolute inset-0 bg-[#15161a] animate-pulse rounded-xl" />
            )}
            <img
              src={url}
              alt={core.prompt || "Media"}
              decoding="async"
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img?.naturalWidth && img?.naturalHeight) {
                  core.handleIntrinsicDimensions(img.naturalWidth, img.naturalHeight);
                }
                core.onMediaLoaded();
              }}
              onError={core.onMediaError}
              className={cn(
                "transition-opacity duration-300 select-none",
                isContain
                  ? "max-w-full max-h-full w-auto h-auto block object-contain"
                  : "w-full h-full object-cover",
                core.isMediaLoaded ? "opacity-100" : "opacity-0",
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
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLikeToggle?.(e);
                }}
                className={cn(
                  "flex items-center justify-center w-7 h-7 bg-transparent border-0 shadow-none transition-transform",
                  onLikeToggle ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default"
                )}
                title="Liked"
                aria-label="Liked"
              >
                <GoogleIcon
                  iconName="favorite"
                  fill={true}
                  className="text-[16px] text-white fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
                />
              </button>
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
            {isMenuActive && menuPosition === "topLeft" && (
              <StudioItemDropdownMenu
                items={menuItems}
                open={isMenuOpen}
                onOpenChange={setMenuOpen}
                trigger={menuTrigger}
              />
            )}
          </div>

          {/* Top Right Slot */}
          <div className="pointer-events-auto flex items-center gap-1.5 ml-auto">
            {topRight}
            {isMenuActive && menuPosition === "topRight" && (
              <StudioItemDropdownMenu
                items={menuItems}
                open={isMenuOpen}
                onOpenChange={setMenuOpen}
                trigger={menuTrigger}
              />
            )}
          </div>
        </div>

        {/* Bottom edge slots */}
        <div className="w-full flex items-end justify-between p-3 gap-2">
          {/* Bottom Left Slot */}
          <div className="pointer-events-auto flex items-center gap-2 min-w-0">
            {bottomLeft}
            {isMenuActive && menuPosition === "bottomLeft" && (
              <StudioItemDropdownMenu
                items={menuItems}
                open={isMenuOpen}
                onOpenChange={setMenuOpen}
                trigger={menuTrigger}
              />
            )}
          </div>

          {/* Bottom Right Slot */}
          <div className="pointer-events-auto flex items-center gap-2 ml-auto shrink-0">
            {bottomRight}
            {isMenuActive && menuPosition === "bottomRight" && (
              <StudioItemDropdownMenu
                items={menuItems}
                open={isMenuOpen}
                onOpenChange={setMenuOpen}
                trigger={menuTrigger}
              />
            )}
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

export default CoreMediaItemView;
