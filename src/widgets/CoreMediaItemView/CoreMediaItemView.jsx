"use client";

import React, { useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { ProcessingCard } from "@/shared/ui/ProcessingCard";
import { FlowErrorTile } from "@/shared/ui/FlowErrorTile";
import { StudioItemDropdownMenu } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu";
import { useMediaViewerCore } from "@/features/workflows/core/useMediaViewerCore";

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
  src: propSrc = null,
  isVideo: propIsVideo = null,
  status: propStatus = null,
  aspect: propAspect = null,
  error: propError = null,
  progress: propProgress = null,

  // Display configuration
  fit = "contain", // "contain" for full uncropped view, "cover" for grid tiles
  className,
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

  // Video options & callbacks
  videoRef: externalVideoRef,
  onVideoTimeUpdate,
  onVideoLoadedMetadata,
  onVideoClick,
  showHoverOverlay = true,
  onRetry = null,
  onDelete = null,
}) {
  // Use media core hook to resolve metadata, sizing, and media state
  const core = useMediaViewerCore({ workflow, item });

  const isVideo = propIsVideo !== null ? propIsVideo : core.isVideo;
  const url = propSrc || core.url;
  const status = propStatus || core.status;
  const error = propError || core.error;
  const progress = propProgress !== null ? propProgress : core.progress;
  const displayAspect = propAspect || core.displayAspect;

  const isCompleted = status === "completed" && Boolean(url);
  const isProcessing = ["processing", "pending", "uploading", "queued"].includes(status);
  const isFailed = ["failed", "error", "rejected"].includes(status);

  // Local or controlled menu open state
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const isMenuOpen = controlledMenuOpen !== undefined ? controlledMenuOpen : internalMenuOpen;
  const setMenuOpen = controlledOnMenuOpenChange || setInternalMenuOpen;

  const isMenuActive = Boolean(showMenu || activeMenu) && menuItems.length > 0;

  // Local hover state for overlay visibility
  const [isHovered, setIsHovered] = useState(false);

  // Resolve video ref
  const internalVideoRef = core.videoRef;
  const videoRef = externalVideoRef || internalVideoRef;

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

  return (
    <div
      className={cn(
        "group relative select-none flex items-center justify-center overflow-hidden",
        draggable ? "cursor-grab active:cursor-grabbing" : onClick ? "cursor-pointer" : "",
        className
      )}
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        aspectRatio: displayAspect,
      }}
    >
      {/* ── 1. The Media Layer ── */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {isCompleted && isVideo && (
          <video
            ref={videoRef}
            src={url}
            loop
            playsInline
            muted={core.isMuted}
            onTimeUpdate={handleVideoTime}
            onLoadedMetadata={handleVideoLoaded}
            onClick={onVideoClick || core.togglePlay}
            className={cn(
              "w-full h-full",
              fit === "contain" ? "object-contain" : "object-cover",
              mediaClassName
            )}
          />
        )}

        {isCompleted && !isVideo && (
          <div className="relative w-full h-full flex items-center justify-center">
            {!core.isMediaLoaded && (
              <div className="absolute inset-0 bg-[#15161a] animate-pulse" />
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
                "w-full h-full transition-opacity duration-300",
                fit === "contain" ? "object-contain" : "object-cover",
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
          showHoverOverlay
            ? (isHovered || isMenuOpen ? "opacity-100" : "opacity-0")
            : "opacity-100"
        )}
      >
        {/* Top edge slots */}
        <div className="w-full flex items-start justify-between p-3 gap-2">
          {/* Top Left Slot */}
          <div className="pointer-events-auto flex items-center gap-2">
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
          <div className="pointer-events-auto flex items-center gap-2">
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
          <div className="pointer-events-auto flex items-center gap-2 ml-auto">
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
          <div className="w-full h-full pointer-events-auto">
            {overlay || children}
          </div>
        </div>
      )}
    </div>
  );
}

export default CoreMediaItemView;
