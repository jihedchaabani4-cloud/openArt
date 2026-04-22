import React from "react";
import { motion } from "framer-motion";
import { ImagePlus, Ban, RefreshCcw } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * DragDropOverlay
 * A premium, dynamic overlay that appears when dragging media.
 * Adapts its layout and text based on the generation mode and errors.
 */
export function DragDropOverlay({ mode, onDrop, error, referenceImages = [], draggedItem }) {
  const isKeyframe = mode === "keyframe";
  const isMotion   = mode === "motion" || mode === "motion-control";
  const isDual     = isKeyframe || isMotion;

  const draggedIsVideo = React.useMemo(() => {
    if (!draggedItem) return false;
    return !!(draggedItem.is_video || draggedItem.url?.toLowerCase().endsWith(".mp4") || draggedItem.url?.toLowerCase().endsWith(".webm"));
  }, [draggedItem]);

  // Resolve Slots
  const slots = React.useMemo(() => {
    if (isKeyframe) {
      return {
        s1: { role: "start", label: "start frame", asset: referenceImages.find(r => r.role === 'start'), accepts: 'image' },
        s2: { role: "end",   label: "end frame",   asset: referenceImages.find(r => r.role === 'end'),   accepts: 'image' },
      };
    }
    if (isMotion) {
      return {
        s1: { role: "mc_video", label: "motion video", asset: referenceImages.find(r => r.role === 'mc_video'), accepts: 'video' },
        s2: { role: "mc_image", label: "source image", asset: referenceImages.find(r => r.role === 'mc_image'), accepts: 'image' },
      };
    }
    return {
      s1: { role: "normal", label: "ingredient", asset: null, accepts: 'any' }
    };
  }, [isKeyframe, isMotion, referenceImages]);

  return (
    <div className="relative w-full h-full flex gap-3">
      {error ? (
        /* ── Global Error State ── */
        <div className="flex-1 h-[60px] flex flex-row items-center justify-center gap-3 backdrop-blur-[80px] bg-[#161718e6] border border-[#ff4d8d]/50 rounded-2xl px-8 shadow-2xl">
           <div className="flex items-center justify-center text-[#ff4d8d]">
            <Ban className="size-6" strokeWidth={1.8} />
          </div>
          <span className="text-[#ff4d8d] font-semibold text-[15px] tracking-tight">
            {error}
          </span>
        </div>
      ) : isDual ? (
        <>
          <DropZone 
            label={`${slots.s1.asset ? 'Replace' : 'Add'} ${slots.s1.label}`}
            onDrop={() => onDrop?.(slots.s1.role)} 
            previewUrl={slots.s1.asset?.url}
            isVideo={slots.s1.asset?.is_video}
            requiredType={slots.s1.accepts}
            draggedIsVideo={draggedIsVideo}
          />
          <DropZone 
            label={`${slots.s2.asset ? 'Replace' : 'Add'} ${slots.s2.label}`}
            onDrop={() => onDrop?.(slots.s2.role)} 
            previewUrl={slots.s2.asset?.url}
            isVideo={slots.s2.asset?.is_video}
            requiredType={slots.s2.accepts}
            draggedIsVideo={draggedIsVideo}
          />
        </>
      ) : (
        /* Unified Ingredient Zone */
        <DropZone 
            label="Add ingredient" 
            onDrop={() => onDrop?.("normal")} 
            requiredType="any"
            draggedIsVideo={draggedIsVideo}
        />
      )}
    </div>
  );
}

function DropZone({ label, onDrop, previewUrl, isVideo = false, requiredType, draggedIsVideo }) {
  const [isDraggedOver, setIsDraggedOver] = React.useState(false);
  const isReplace = !!previewUrl;

  const isCompatible = React.useMemo(() => {
    if (requiredType === 'any') return true;
    if (requiredType === 'video') return draggedIsVideo;
    if (requiredType === 'image') return !draggedIsVideo;
    return true;
  }, [requiredType, draggedIsVideo]);

  return (
    <div 
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCompatible) setIsDraggedOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggedOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggedOver(false);
        if (isCompatible) onDrop?.();
      }}
      className={cn(
        "flex-1 h-[60px] relative overflow-hidden flex flex-row items-center justify-center gap-4 transition-all duration-300 pointer-events-auto cursor-copy rounded-2xl px-6 shadow-2xl backdrop-blur-[80px] border-2 border-solid group",
        !isCompatible && isDraggedOver
          ? "bg-[#2a131a] border-[#ff4d8d]/50 shadow-none scale-[0.98]"
          : isDraggedOver 
            ? "bg-[#252628] border-white/60 shadow-white/10" 
            : "bg-[#161718e6] border-transparent hover:border-white/40 hover:shadow-white/5"
      )}
    >
      {/* Background Preview */}
      {previewUrl && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {isVideo ? (
            <video 
              src={previewUrl} 
              autoPlay muted loop playsInline
              className="w-full h-full object-cover opacity-30 grayscale-[20%] brightness-75 scale-105 blur-[1px]"
            />
          ) : (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover opacity-30 grayscale-[20%] brightness-75 scale-105 blur-[1px]"
            />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}

      <div className={cn(
        "relative z-10 flex items-center justify-center transition-all duration-300 pointer-events-none",
        !isCompatible && isDraggedOver ? "text-[#ff4d8d]" : isDraggedOver ? "text-white" : "text-white/50 group-hover:text-white"
      )}>
        {!isCompatible && isDraggedOver ? (
          <Ban className="size-6" strokeWidth={2} />
        ) : isReplace ? (
          <RefreshCcw className="size-6" strokeWidth={2} />
        ) : (
          <ImagePlus className="size-7" strokeWidth={1.5} />
        )}
      </div>
      <span className={cn(
        "relative z-10 font-medium text-[15px] tracking-tight whitespace-nowrap transition-colors pointer-events-none",
        !isCompatible && isDraggedOver ? "text-[#ff4d8d]" : isDraggedOver ? "text-white" : "text-white/80 group-hover:text-white"
      )} style={{ textShadow: isReplace ? '0 1px 4px rgba(0,0,0,0.8)' : 'none' }}>
        {!isCompatible && isDraggedOver ? `Unsupported: ${requiredType} only` : label}
      </span>
    </div>
  );
}
