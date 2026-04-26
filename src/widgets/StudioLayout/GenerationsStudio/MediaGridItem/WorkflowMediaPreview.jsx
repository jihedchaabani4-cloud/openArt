import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Play, Pause, Maximize, Layers, Heart, Volume2, VolumeX, Camera, Loader2 } from "lucide-react";
import { ImageStatusView } from "@/features/workflows/ui/ImageStatusView";
import { getPrimaryMedia, getItemMetadata } from "@/shared/lib/generationUtils";
import dynamic from "next/dynamic";
const WorkflowMediaCanvas = dynamic(() => import("@/features/workflows/ui/WorkflowMediaCanvas").then(mod => mod.WorkflowMediaCanvas), { ssr: false });
import { useEditStore } from "@/features/prompt-bar/model/useEditStore";
import { useBatchUploadAssets } from "@/features/media/api/mediaApi";

export function WorkflowMediaPreview({
  workflow,
  className,
  externalActiveItem = null,
  onActiveItemChange = null,
  projectId = null,
  sessionId = null,
}) {
  const primaryItem = useMemo(() => getPrimaryMedia(workflow), [workflow]);
  const [internalActiveItem, setInternalActiveItem] = useState(primaryItem);

  const activeItem = externalActiveItem || internalActiveItem;
  const setActiveItem = onActiveItemChange || setInternalActiveItem;

  const items = workflow.items || [];

  useEffect(() => {
    if (primaryItem && (!activeItem || !items.find(i => i.id === activeItem.id || i.name === activeItem.name))) {
      setActiveItem(primaryItem);
    }
  }, [primaryItem, items]);

  const activeMetadata = useMemo(() => activeItem ? getItemMetadata(activeItem) : null, [activeItem]);
  const { isVideo, url, status, aspect, prompt } = activeMetadata || {};

  const { activeTab, selection, setSelection, clearSelection, editTarget } = useEditStore();
  const disableSelection = !!editTarget?.isElementSheet;

  const progress = useMotionValue(0);
  const progressWidth = useTransform(progress, (v) => `${v}%`);
  const videoRef = useRef(null);
  const progressRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const { mutateAsync: uploadBatch } = useBatchUploadAssets();

  // FIX 1: Sync `muted` DOM attribute directly — React doesn't propagate
  // the `muted` prop to the DOM element reliably (known React issue).
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // FIX 2: Force autoplay after video element mounts or src changes.
  // We also set muted=true directly on the element before calling play(),
  // because browsers require muted for autoplay without user gesture.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url || !isVideo) return;

    // Reset state for the new video
    setCurrentTime(0);
    setDuration(0);
    progress.set(0);
    setIsPlaying(true);

    // Ensure muted is set at the DOM level before attempting autoplay
    video.muted = true;
    setIsMuted(true);

    const attemptPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // AbortError is safe to ignore (happens when src changes mid-play)
          if (err.name !== "AbortError") {
            console.warn("Autoplay blocked:", err);
            setIsPlaying(false);
          }
        });
      }
    };

    // If already ready, play immediately; otherwise wait for canplay
    if (video.readyState >= 3) {
      attemptPlay();
    } else {
      video.addEventListener("canplay", attemptPlay, { once: true });
      return () => video.removeEventListener("canplay", attemptPlay);
    }
  }, [url, isVideo]);

  const handleExtractFrame = async (e) => {
    e.stopPropagation();
    if (!videoRef.current || isExtracting) return;

    setIsExtracting(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.95));
      if (!blob) throw new Error("Could not extract frame");

      const timestamp = Math.floor(video.currentTime * 1000);
      const file = new File([blob], `frame_${timestamp}.jpg`, { type: "image/jpeg" });

      const resolvedProjectId = projectId || workflow.project_id || activeItem?.project_id;
      const resolvedSessionId = sessionId || workflow.session_id || workflow.metadata?.sessionId || activeItem?.session_id;

      await uploadBatch({
        files: [file],
        projectId: resolvedProjectId,
        sessionId: resolvedSessionId,
      });
    } catch (err) {
      console.error("Frame extraction error:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  useEffect(() => {
    clearSelection();
    return () => clearSelection();
  }, [activeItem?.id, activeItem?.name, activeTab, disableSelection, clearSelection]);

  useEffect(() => {
    let frame;
    const update = () => {
      if (videoRef.current && !isDragging) {
        if (!videoRef.current.paused && videoRef.current.duration) {
          const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
          progress.set(p);
        }
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [progress, activeItem, isDragging]);

  const handleSeek = useCallback((clientX) => {
    if (!videoRef.current || !progressRef.current || !videoRef.current.duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const p = x / rect.width;
    videoRef.current.currentTime = p * videoRef.current.duration;
    progress.set(p * 100);
  }, [progress]);

  if (!activeItem) return null;

  const isDone = status === "completed" && !!url;

  return (
    <>
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id || activeItem.name}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="w-full h-full flex items-center justify-center relative p-6"
          >
            {/* Wrapper that grows to fill space but respects the video's aspect ratio */}
            <div
              className="relative h-full"
              style={{ aspectRatio: aspect, maxWidth: "100%", maxHeight: "100%" }}
            >
            <ImageStatusView
              status={status}
              src={url}
              alt={prompt}
              aspect={aspect}
              error={activeItem.error}
              showOverlay
              className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden bg-black/40"
            >
              {isDone && isVideo ? (
                <div className="relative w-full h-full group/video">
                  <video
                    ref={videoRef}
                    src={`${url}${url.includes('?') ? '&' : '?'}xcors=1`}
                    className="w-full h-full object-contain rounded-2xl cursor-pointer"
                    crossOrigin="anonymous"
                    autoPlay
                    muted
                    loop
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current) {
                        if (videoRef.current.paused) {
                          const playPromise = videoRef.current.play();
                          if (playPromise !== undefined) {
                            playPromise.catch((err) => {
                              if (err.name !== "AbortError") console.warn(err);
                            });
                          }
                        } else {
                          videoRef.current.pause();
                        }
                      }
                    }}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration);
                        videoRef.current.muted = isMuted;
                      }
                    }}
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        setCurrentTime(videoRef.current.currentTime);
                        setDuration(videoRef.current.duration || 0);
                        if (!isDragging) {
                          const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                          progress.set(p);
                        }
                      }
                    }}
                  />

                  {/* Top-left: liked / paused indicators */}
                  {(activeItem.is_liked || !isPlaying) && (
                    <div
                      className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-none drop-shadow-lg transition-opacity duration-300"
                      style={{ opacity: isPlaying ? 0 : 1 }}
                    >
                      {activeItem.is_liked && (
                        <div className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                          <Heart className="size-5 fill-[#FF2E97] text-[#FF2E97]" />
                        </div>
                      )}
                      {!isPlaying && (
                        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/10">
                          <Play className="size-4 fill-white text-white" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Top-right: extract frame button */}
                  <div className="absolute top-3 right-3 z-30 flex items-center gap-2 opacity-0 group-hover/video:opacity-100 transition-all">
                    <button
                      onClick={handleExtractFrame}
                      disabled={isExtracting}
                      title="Extract current frame as reference"
                      className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 cursor-pointer hover:bg-black/60 transition-colors disabled:opacity-50"
                    >
                      {isExtracting ? <Loader2 className="size-4 animate-spin text-white" /> : <Camera className="size-4 text-white" />}
                    </button>
                  </div>

                  {/* Bottom: video controls bar — overlaid on video */}
                  <div
                    className="absolute bottom-3 inset-x-3 z-30 flex items-center gap-3 p-1.5 px-3 backdrop-blur-[1px] rounded-xl opacity-0 group-hover/video:opacity-100 transition-opacity duration-300"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="w-7 h-7 flex items-center justify-center shrink-0 rounded-full hover:bg-white/10 text-white transition-colors"
                      onClick={() => {
                        if (videoRef.current) {
                          if (videoRef.current.paused) videoRef.current.play();
                          else videoRef.current.pause();
                        }
                      }}
                    >
                      {isPlaying ? <Pause className="size-3.5 fill-white" /> : <Play className="size-3.5 fill-white ml-0.5" />}
                    </button>

                    <div
                      ref={progressRef}
                      className="flex-1 h-6 flex items-center group/track cursor-pointer relative"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setIsDragging(true);
                        handleSeek(e.clientX);
                        const handleMove = (ev) => handleSeek(ev.clientX);
                        const handleUp = () => {
                          setIsDragging(false);
                          document.removeEventListener('pointermove', handleMove);
                          document.removeEventListener('pointerup', handleUp);
                        };
                        document.addEventListener('pointermove', handleMove);
                        document.addEventListener('pointerup', handleUp);
                      }}
                    >
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden transition-all duration-300 group-hover/track:h-1.5 relative pointer-events-none">
                        <motion.div
                          className="h-full bg-white relative overflow-visible shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                          style={{ width: progressWidth }}
                        />
                      </div>
                      <motion.div
                        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover/track:opacity-100 transition-opacity shadow-md pointer-events-none"
                        style={{ left: progressWidth, translateX: '-50%' }}
                      />
                    </div>

                    <div className="text-white text-[12px] font-medium tabular-nums ml-1 select-none shrink-0">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>

                    <button
                      onClick={() => setIsMuted(m => !m)}
                      className="w-7 h-7 flex items-center justify-center shrink-0 rounded-full hover:bg-white/10 text-white transition-colors ml-1"
                    >
                      {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                    </button>

                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen();
                          else if (videoRef.current.webkitRequestFullscreen) videoRef.current.webkitRequestFullscreen();
                        }
                      }}
                      className="w-7 h-7 flex items-center justify-center shrink-0 rounded-full hover:bg-white/10 text-white transition-colors"
                    >
                      <Maximize className="size-4" />
                    </button>
                  </div>
                </div>
              ) : isDone && !isVideo ? (
                <WorkflowMediaCanvas
                  imageUrl={url}
                  selection={disableSelection ? null : selection}
                  onSelectionChange={disableSelection ? undefined : setSelection}
                  readOnly={disableSelection || activeTab !== "describe"}
                />
              ) : null}
            </ImageStatusView>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}