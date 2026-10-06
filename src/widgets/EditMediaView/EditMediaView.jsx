"use client";

import React, { useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { CoreMediaItemView } from "@/widgets/CoreMediaItemView";
import { useMediaViewerCore } from "@/features/workflows/core/useMediaViewerCore";

/**
 * VideoControlsBar
 * Clean interactive video playback scrubber & controls for the bottom slot.
 */
function VideoControlsBar({
  isPlaying,
  togglePlay,
  isMuted,
  toggleMute,
  progressPercent,
  seek,
  currentTime,
  duration,
  toggleFullscreen,
}) {
  const [isSeeking, setIsSeeking] = useState(false);
  const trackRef = useRef(null);

  const handlePointerDown = useCallback((e) => {
    if (!trackRef.current) return;
    e.stopPropagation();
    setIsSeeking(true);

    const update = (clientX) => {
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
      seek(ratio);
    };

    update(e.clientX);

    const onMove = (ev) => update(ev.clientX);
    const onUp = () => {
      setIsSeeking(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [seek]);

  return (
    <div className="p-3 w-full transition-opacity duration-300">
      <div
        className="flex items-center gap-2.5 p-2 px-3 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Play/Pause */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={togglePlay}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white"
        >
          {isPlaying ? <Pause className="size-3.5 fill-white" /> : <Play className="size-3.5 fill-white ml-0.5" />}
        </Button>

        {/* Scrubber Track */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          className="flex-1 h-6 flex items-center cursor-pointer relative group/track"
        >
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden transition-all duration-200 group-hover/track:h-1.5 relative pointer-events-none">
            <div
              className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Time label */}
        <span className="text-[11px] font-mono text-white/70 select-none tabular-nums shrink-0">
          {currentTime} / {duration}
        </span>

        {/* Mute */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={toggleMute}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white"
        >
          {isMuted ? <VolumeX className="size-3.5 text-white" /> : <Volume2 className="size-3.5 text-white" />}
        </Button>

        {/* Fullscreen */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={toggleFullscreen}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-white"
        >
          <Maximize className="size-3.5 text-white" />
        </Button>
      </div>
    </div>
  );
}

/**
 * EditMediaView
 * Dedicated media viewer built on top of CoreMediaItemView.
 * 
 * - Uses CoreMediaItemView with fit="contain" for uncropped, true-size display.
 * - Provides slot-based button placement: topLeft, topRight, bottomLeft, bottomRight, bottom.
 * - Supports active/deactivate menu via showMenu / activeMenu with custom menuItems.
 * - Automatically injects full video playback controls into the bottom slot for videos.
 */
export function EditMediaView({
  workflow,
  item = null,
  className,
  fit = "contain",

  // Slot buttons
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  bottom: customBottom,
  center,
  overlay,

  // Menu activation & items
  showMenu = false,
  activeMenu = false,
  menuItems = [],
  menuTrigger = null,
  menuPosition = "topRight",

  // Callbacks
  onRetry = null,
  onDelete = null,
}) {
  const core = useMediaViewerCore({ workflow, item });

  const isCompletedVideo = core.isCompleted && core.isVideo;

  const defaultBottomBar = isCompletedVideo ? (
    <VideoControlsBar
      isPlaying={core.isPlaying}
      togglePlay={core.togglePlay}
      isMuted={core.isMuted}
      toggleMute={core.toggleMute}
      progressPercent={core.progressPercent}
      seek={core.seek}
      currentTime={core.formattedCurrentTime}
      duration={core.formattedDuration}
      toggleFullscreen={core.toggleFullscreen}
    />
  ) : null;

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center p-6 select-none overflow-hidden", className)}>
      <CoreMediaItemView
        core={core}
        workflow={workflow}
        item={item}
        fit={fit}
        videoRef={core.videoRef}
        onVideoClick={core.togglePlay}
        // Slots
        topLeft={topLeft}
        topRight={topRight}
        bottomLeft={bottomLeft}
        bottomRight={bottomRight}
        bottom={customBottom !== undefined ? customBottom : defaultBottomBar}
        center={center}
        overlay={overlay}
        // Menu
        showMenu={showMenu}
        activeMenu={activeMenu}
        menuItems={menuItems}
        menuTrigger={menuTrigger}
        menuPosition={menuPosition}
        // Error handlers
        onRetry={onRetry}
        onDelete={onDelete}
      />
    </div>
  );
}

export default EditMediaView;
