import React from "react";
import { motion } from "framer-motion";
import { ImagePlus, Ban } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * DragDropOverlay
 * A premium, dynamic overlay that appears when dragging media.
 * Adapts its layout and text based on the generation mode and errors.
 */
export function DragDropOverlay({ mode, onDrop, error }) {
  const isKeyframe = mode === "keyframe";
  
  // Dynamic labels based on mode
  const getLabel = (role) => {
    if (isKeyframe) {
      return role === "start" ? "Add start frame" : "Add end frame";
    }
    if (mode === "motion-control") {
      return "Add motion reference";
    }
    return "Add ingredient";
  };

  return (
    <div className="relative w-full h-full flex gap-3">
      {error ? (
        /* ── Error State (Prohibited) ── */
        <div className="flex-1 h-[60px] flex flex-row items-center justify-center gap-3 backdrop-blur-[80px] bg-[#161718e6] border border-[#ff4d8d]/50 rounded-2xl px-8 shadow-2xl">
           <div className="flex items-center justify-center text-[#ff4d8d]">
            <Ban className="size-6" strokeWidth={1.8} />
          </div>
          <span className="text-[#ff4d8d] font-semibold text-[15px] tracking-tight">
            {error}
          </span>
        </div>
      ) : isKeyframe ? (
        <>
          {/* Start Frame Zone */}
          <DropZone label={getLabel("start")} onDrop={() => onDrop?.("start")} />
          {/* End Frame Zone */}
          <DropZone label={getLabel("end")} onDrop={() => onDrop?.("end")} />
        </>
      ) : (
        /* Unified Ingredient Zone */
        <DropZone label={getLabel("normal")} onDrop={() => onDrop?.("normal")} />
      )}
    </div>
  );
}

function DropZone({ label, onDrop }) {
  const [isDraggedOver, setIsDraggedOver] = React.useState(false);

  return (
    <div 
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggedOver(true);
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
        onDrop?.();
      }}
      className={cn(
        "flex-1 h-[60px] flex flex-row items-center justify-center gap-4 transition-all duration-300 pointer-events-auto cursor-copy rounded-2xl px-8 shadow-2xl backdrop-blur-[80px] border-2 border-solid group",
        isDraggedOver 
          ? "bg-[#252628] border-white/60 shadow-white/10" 
          : "bg-[#161718e6] border-transparent hover:border-white/40 hover:shadow-white/5"
      )}
    >
      <div className={cn(
        "flex items-center justify-center transition-all duration-300 pointer-events-none",
        isDraggedOver ? "text-white" : "text-white/50 group-hover:text-white"
      )}>
        <ImagePlus className="size-7" strokeWidth={1.5} />
      </div>
      <span className={cn(
        "font-medium text-[16px] tracking-tight whitespace-nowrap transition-colors pointer-events-none",
        isDraggedOver ? "text-white" : "text-white/80 group-hover:text-white"
      )}>
        {label}
      </span>
    </div>
  );
}
