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
    <div className="relative w-full h-full flex items-center justify-center p-3 pointer-events-none">
      {/* Content: 1 or 2 Drop Targets OR Error State */}
      <div className="relative w-full h-full flex gap-3">
        {error ? (
          /* ── Error State (Prohibited) ── */
          <div className="flex-1 h-[80px] flex flex-row items-center justify-center gap-3 bg-[#1b1c1e] border border-[#ff4d8d]/50 rounded-[24px] px-8 shadow-2xl backdrop-blur-3xl">
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
    </div>
  );
}

function DropZone({ label, onDrop }) {
  return (
    <div 
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop?.();
      }}
      className="flex-1 h-[90px] flex flex-row items-center justify-center gap-4 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-[28px] px-8 shadow-2xl backdrop-blur-3xl transition-all duration-300 pointer-events-auto cursor-copy hover:border-white/40 hover:bg-white/[0.08] hover:scale-[1.01] hover:shadow-white/5 group"
    >
      <div className="flex items-center justify-center text-white/50 transition-all duration-300 group-hover:text-white group-hover:scale-110">
        <ImagePlus className="size-7" strokeWidth={1.5} />
      </div>
      <span className="text-white/80 font-medium text-[16px] tracking-tight whitespace-nowrap transition-colors group-hover:text-white">
        {label}
      </span>
    </div>
  );
}
