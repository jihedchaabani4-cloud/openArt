"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { ProcessingCard } from "@/shared/ui/ProcessingCard";
import { FlowErrorTile } from "@/shared/ui/FlowErrorTile";
import { useMediaViewerCore } from "@/features/workflows/core/useMediaViewerCore";

/**
 * EditMediaView
 * Dedicated media viewer for the Edit pages (Generations Edit, Elements Edit).
 * 
 * Distinct from MediaGridItem:
 * - NO drag & drop prompt-bar handlers
 * - NO card hover menus or 3-dots dropdowns
 * - NO object-cover cropping (displays full uncropped media with true aspect ratio)
 * - Full interactive video playback controls (scrubbing, volume, fullscreen)
 */
export function EditMediaView({
  workflow,
  item = null,
  className,
  onRetry = null,
  onDelete = null,
}) {
  const {
    targetItem,
    isVideo,
    url,
    status,
    prompt,
    error,
    progress,
    isCompleted,
    isProcessing,
    isFailed,
    displayAspect,
    isMediaLoaded,
    onMediaLoaded,
    onMediaError,
    handleIntrinsicDimensions,
    // Video tools from core
    videoRef,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    progressPercent,
    formattedCurrentTime,
    formattedDuration,
    togglePlay,
    toggleMute,
    seek,
    toggleFullscreen,
    handleVideoTimeUpdate,
    handleVideoLoadedMetadata,
  } = useMediaViewerCore({ workflow, item });

  const [isControlsHovered, setIsControlsHovered] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const progressTrackRef = useRef(null);

  const handleTrackPointerDown = useCallback((e) => {
    if (!progressTrackRef.current) return;
    e.stopPropagation();
    setIsSeeking(true);

    const updateSeek = (clientX) => {
      const rect = progressTrackRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
      seek(ratio);
    };

    updateSeek(e.clientX);

    const onPointerMove = (ev) => updateSeek(ev.clientX);
    const onPointerUp = () => {
      setIsSeeking(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }, [seek]);

  return (
    <div
      className={cn(
        "relative w-full h-full flex items-center justify-center p-6 select-none overflow-hidden",
        className
      )}
      onMouseEnter={() => setIsControlsHovered(true)}
      onMouseLeave={() => setIsControlsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={targetItem?.id || targetItem?.name || "media-viewer"}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="relative max-w-full max-h-full flex items-center justify-center"
          style={{
            aspectRatio: displayAspect,
            height: "100%",
            maxHeight: "100%",
          }}
        >
          {/* Main Display Container */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40 flex items-center justify-center">
            {isCompleted && isVideo && (
              <div className="relative w-full h-full group flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={url}
                  loop
                  playsInline
                  muted={isMuted}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onClick={togglePlay}
                  className="w-full h-full object-contain cursor-pointer"
                />

                {/* Video Controls Bar */}
                <div
                  className={cn(
                    "absolute bottom-3 inset-x-3 z-30 flex items-center gap-2.5 p-2 px-3 bg-black/70 backdrop-blur-md border border-white/10 rounded-xl transition-opacity duration-300",
                    (!isPlaying || isControlsHovered || isSeeking)
                      ? "opacity-100 pointer-events-auto"
                      : "opacity-0 pointer-events-none"
                  )}
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
                    ref={progressTrackRef}
                    onPointerDown={handleTrackPointerDown}
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
                    {formattedCurrentTime} / {formattedDuration}
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
            )}

            {isCompleted && !isVideo && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Skeleton shimmer while image loads */}
                {!isMediaLoaded && (
                  <div className="absolute inset-0 bg-[#15161a] animate-pulse flex items-center justify-center" />
                )}

                <img
                  src={url}
                  alt={prompt || "Workflow generation"}
                  decoding="async"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img?.naturalWidth && img?.naturalHeight) {
                      handleIntrinsicDimensions(img.naturalWidth, img.naturalHeight);
                    }
                    onMediaLoaded();
                  }}
                  onError={onMediaError}
                  className={cn(
                    "w-full h-full object-contain transition-opacity duration-300",
                    isMediaLoaded ? "opacity-100" : "opacity-0"
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default EditMediaView;
