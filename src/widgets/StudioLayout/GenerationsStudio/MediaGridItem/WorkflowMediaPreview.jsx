import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Play, Layers, Heart, Volume2, VolumeX, Camera, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ImageStatusView } from "@/features/workflows/ui/ImageStatusView";
import { getPrimaryMedia, getItemMetadata } from "@/shared/lib/generationUtils";
import { useWorkflowActions } from "@/features/workflows/model/useMediaActions";
import dynamic from "next/dynamic";
import { WorkflowMediaSidebar } from "@/features/workflows/ui/WorkflowMediaSidebar";
const WorkflowMediaCanvas = dynamic(() => import("@/features/workflows/ui/WorkflowMediaCanvas").then(mod => mod.WorkflowMediaCanvas), { ssr: false });
import { useEditStore } from "@/features/prompt-bar/model/useEditStore";
import { useUploadAsset } from "@/features/media/api/mediaApi";

/**
 * A simplified version of MediaGridItem for previewing workflow media
 * without action buttons, context menus, or drag-and-drop.
 */
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

  // Update active item if workflow changes and previous active item is no longer valid
  useEffect(() => {
    if (primaryItem && (!activeItem || !items.find(i => i.id === activeItem.id || i.name === activeItem.name))) {
      setActiveItem(primaryItem);
    }
  }, [primaryItem, items]);

  const activeMetadata = useMemo(() => activeItem ? getItemMetadata(activeItem) : null, [activeItem]);
  const { isVideo, url, status, aspect, prompt } = activeMetadata || {};

  const { activeTab, selection, setSelection, clearSelection } = useEditStore();

  const progress = useMotionValue(0);
  const progressWidth = useTransform(progress, (v) => `${v}%`);
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const { mutateAsync: uploadAsset } = useUploadAsset();

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
      
      await uploadAsset({
        file,
        projectId: resolvedProjectId,
        sessionId: resolvedSessionId,
      });
    } catch (err) {
      console.error("Frame extraction error:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  // Clear selection when active item changes or on unmount
  useEffect(() => {
    clearSelection();
    return () => clearSelection();
  }, [activeItem?.id, activeItem?.name, activeTab, clearSelection]);

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

  return (<>
      {/* Central View - Preserving Aspect Ratio */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id || activeItem.name}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="h-full w-auto flex relative group/video"
          >
            <ImageStatusView
              status={status}
              src={url}
              alt={prompt}
              aspect={aspect}
              error={activeItem.error}
              showOverlay
              className="h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden"
            >
              {isDone && isVideo ? (
                <video
                  ref={videoRef}
                  src={`${url}${url.includes('?') ? '&' : '?'}xcors=1`}
                  className="max-w-full max-h-full object-contain rounded-2xl cursor-pointer"
                  crossOrigin="anonymous"
                  autoPlay
                  muted={isMuted}
                  loop
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onClick={(e) => {
                    // Prevent bubbling if there are other click handlers
                    e.stopPropagation();
                    if (videoRef.current) {
                      if (videoRef.current.paused) {
                        const playPromise = videoRef.current.play();
                        if (playPromise !== undefined) {
                          playPromise.catch(() => {
                            // Ignore AbortError when media is removed or interrupted
                          });
                        }
                      } else {
                        videoRef.current.pause();
                      }
                    }
                  }}
                  onTimeUpdate={() => {
                      if (videoRef.current && !isDragging) {
                          const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                          progress.set(p);
                      }
                  }}
                />
              ) : isDone && !isVideo ? (
                <WorkflowMediaCanvas 
                  imageUrl={url}
                  selection={selection}
                  onSelectionChange={setSelection}
                  readOnly={activeTab !== "describe"}
                />
              ) : null}
            </ImageStatusView>

            {/* Icons overlay for the active item */}
            {isDone && (isVideo || activeItem.is_liked) && (
              <div className="absolute top-6 left-6 z-20 flex flex-col gap-3 pointer-events-none drop-shadow-lg transition-opacity duration-300" style={{ opacity: isVideo && isPlaying ? 0 : 1 }}>
                {activeItem.is_liked && (
                  <div className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                    <Heart className="size-5 fill-[#FF2E97] text-[#FF2E97]" />
                  </div>
                )}
                {isVideo && !isPlaying && (
                  <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/10">
                    <Play className="size-4 fill-white text-white" />
                  </div>
                )}
              </div>
            )}

            {/* Mute/Unmute Button */}
            {isDone && isVideo && (
              <div className="absolute top-6 right-6 z-30 flex items-center gap-2 opacity-0 group-hover/video:opacity-100 transition-all">
                <button
                  onClick={handleExtractFrame}
                  disabled={isExtracting}
                  title="Extract current frame as reference"
                  className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 cursor-pointer hover:bg-black/60 transition-colors disabled:opacity-50"
                >
                  {isExtracting ? <Loader2 className="size-4 animate-spin text-white" /> : <Camera className="size-4 text-white" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(m => !m);
                  }}
                  className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 cursor-pointer hover:bg-black/60 transition-colors"
                >
                  {isMuted ? <VolumeX className="size-4 text-white" /> : <Volume2 className="size-4 text-white" />}
                </button>
              </div>
            )}

            {/* Progress bar for video */}
            {isDone && isVideo && (
              <div 
                ref={progressRef}
                className="absolute bottom-4 inset-x-8 h-6 flex items-center z-30 group/track cursor-pointer"
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
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-md transition-all duration-300 group-hover/track:h-1.5" style={{ opacity: isPlaying && !isDragging ? 1 : 0.8 }}>
                  <motion.div 
                    className="h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] relative overflow-visible" 
                    style={{ width: progressWidth }} 
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/track:opacity-100 transition-opacity translate-x-1/2 shadow-md" />
                  </motion.div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div></>
  );
}
