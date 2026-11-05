"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
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
  const [_isSeeking, setIsSeeking] = useState(false);
  const trackRef = useRef(null);
  const activeListenersRef = useRef(null);

  const cleanupListeners = useCallback(() => {
    if (activeListenersRef.current) {
      window.removeEventListener("pointermove", activeListenersRef.current.onMove);
      window.removeEventListener("pointerup", activeListenersRef.current.onUp);
      activeListenersRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanupListeners;
  }, [cleanupListeners]);

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

    cleanupListeners();

    const onMove = (ev) => update(ev.clientX);
    const onUp = () => {
      setIsSeeking(false);
      cleanupListeners();
    };

    activeListenersRef.current = { onMove, onUp };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [seek, cleanupListeners]);

  return (
    <div className="p-3 w-full transition-opacity duration-300">
      <div
        className="flex items-center gap-2.5 p-2 px-3 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Play/Pause */}
        <Button
          type="button"
          variant="ghost"
          className="size-8 p-0"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <GoogleIcon iconName="pause" fill={true} className="text-sm text-white" /> : <GoogleIcon iconName="play_arrow" fill={true} className="text-sm text-white ml-0.5" />}
        </Button>

        {/* Scrubber Track */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          className="flex-1 h-6 flex items-center cursor-pointer relative group/track"
        >
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden transition-all duration-200 group-hover/track:h-1.5 relative pointer-events-none">
            <div
              className="h-full bg-white"
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
          className="size-8 p-0"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <GoogleIcon iconName="volume_off" className="text-sm text-white" /> : <GoogleIcon iconName="volume_up" className="text-sm text-white" />}
        </Button>

        {/* Fullscreen */}
        <Button
          type="button"
          variant="ghost"
          className="size-8 p-0"
          onClick={toggleFullscreen}
          aria-label="Fullscreen"
        >
          <GoogleIcon iconName="fullscreen" className="text-sm text-white" />
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
  showMenu = true,
  activeMenu = true,
  menuItems = [],
  menuTrigger = null,
  menuPosition = "topRight",

  // Callbacks
  onRetry = null,
  onDelete = null,
  showLikedBadge = false,
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
        showLikedBadge={showLikedBadge}
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
