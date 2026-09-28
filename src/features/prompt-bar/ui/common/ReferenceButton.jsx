"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Film, Play, Image, ArrowLeftRight, Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const VARIANTS = {
  start:  { word: "Start",  HoverContent: () => <span className="text-[10px] uppercase tracking-[0.08em] text-[rgba(218,220,224,0.5)]">pick</span> },
  end:    { word: "End",    HoverContent: () => <span className="text-[10px] uppercase tracking-[0.08em] text-[rgba(218,220,224,0.5)]">pick</span> },
  motion: { word: "Motion", HoverContent: () => <Play size={15} strokeWidth={1.5} className="text-[rgba(218,220,224,0.6)]" /> },
  ref:    { word: "Ref",    HoverContent: () => <Image size={15} strokeWidth={1.5} className="text-[rgba(218,220,224,0.6)]" /> },
  add:    { word: "Add",    HoverContent: () => <Plus size={15} strokeWidth={1.5} className="text-[rgba(218,220,224,0.6)]" /> },
};

export function ReferenceButton({
  variant,
  word,
  hoverContent,
  onClick,
  disabled = false,
  pulse = false,
  className,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  ...props
}) {
  const preset = variant ? VARIANTS[variant] : null;
  const displayWord = word ?? preset?.word ?? null;
  const HoverContent = hoverContent ?? preset?.HoverContent ?? null;

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "group relative shrink-0",
        "w-[50px] h-[50px] rounded-[12px]",
        "flex items-center justify-center",
        "bg-white/[0.04]",
        "border border-[rgba(218,220,224,0.15)]",
        "transition-all duration-200 ease-out",
        "hover:bg-white/[0.07] hover:border-[rgba(218,220,224,0.28)]",
        "active:scale-95",
        pulse && "animate-pulse-border",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
      {...props}
    >
      {displayWord && (
        <span
          className={cn(
            "absolute pointer-events-none",
            "text-[13px] font-medium text-[rgba(218,220,224,0.75)]",
            "tracking-[0.01em] whitespace-nowrap",
            "transition-all duration-200 ease-out",
            "group-hover:-translate-y-2 group-hover:opacity-0"
          )}
        >
          {displayWord}
        </span>
      )}

      {HoverContent && (
        <div
          className={cn(
            "absolute pointer-events-none",
            "flex items-center justify-center",
            "translate-y-2 opacity-0",
            "transition-all duration-200 ease-out",
            "group-hover:translate-y-0 group-hover:opacity-100"
          )}
        >
          <HoverContent />
        </div>
      )}
    </div>
  );
}


export function SwapIcon({ className }) {
  return (
    <div className={cn("flex items-center justify-center text-white/40 shrink-0", className)}>
      <ArrowLeftRight size={18} strokeWidth={3} />
    </div>
  );
}


export function ViewReference({
  media,
  onRemove,
  label,
  className,
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (!media) return null;

  const isCharacter = media.type === "character" || media.workflow_type === "CHARACTER_SHEET";
  const isElement = media.type === "element" || media.workflow_type === "ELEMENT_SHEET";
  const isVideo = media.type === "video" || media.is_video;
  const src =
    media.url ||
    media.preview ||
    media.file_url ||
    media.thumbnail ||
    media.image_url ||
    media.image?.url ||
    media.video?.url ||
    media.src ||
    media.rawValue?.url ||
    media.rawValue?.preview ||
    media.rawValue?.file_url;
  const tooltipText = media.displayName || label || (isCharacter ? "Character" : isElement ? "Element" : "Reference");

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("group relative shrink-0 w-[50px] h-[50px]", className)}
    >
      {/* 50x50 Thumbnail Box without border */}
      <div className="relative w-full h-full rounded-[12px] overflow-hidden bg-white/[0.04]">
        {/* Media — slides UP on hover */}
        <div className="absolute inset-0 z-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-1.5">
          {isVideo ? (
            <video
              src={src}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Remove overlay — slides UP from bottom */}
        <div
          className="absolute overflow-hidden inset-0 z-20 flex items-center justify-center bg-[#202122]/90 backdrop-blur-sm translate-y-full group-hover:translate-y-0 transition-transform duration-200 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          title="Remove"
        >
          <X size={16} strokeWidth={2.5} className="text-white" />
        </div>

        {/* Type badge indicators */}
        {isVideo && (
          <div className="absolute top-1 left-1 z-10 bg-black/60 p-0.5 rounded backdrop-blur-[2px]">
            <Film size={10} className="text-white" />
          </div>
        )}
        {isCharacter && (
          <div className="absolute bottom-1 left-1 z-10 bg-purple-950/80 px-1 py-0.5 rounded text-[8px] font-semibold text-purple-200 uppercase tracking-wider backdrop-blur-[2px]">
            Char
          </div>
        )}
        {isElement && (
          <div className="absolute bottom-1 left-1 z-10 bg-emerald-950/80 px-1 py-0.5 rounded text-[8px] font-semibold text-emerald-200 uppercase tracking-wider backdrop-blur-[2px]">
            Elem
          </div>
        )}
      </div>

      {/* Floating Media Preview Popover directly above */}
      <AnimatePresence>
        {isHovered && src && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-[100] pointer-events-none flex flex-col items-center"
          >
            <div className="rounded-[18px] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.7)] bg-[#1e1f20] border-none flex items-center justify-center">
              {isVideo ? (
                <video
                  src={src}
                  className="max-w-[200px] max-h-[280px] w-auto h-auto rounded-[18px] object-contain block"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={src}
                  alt=""
                  className="max-w-[200px] max-h-[280px] w-auto h-auto rounded-[18px] object-contain block select-none pointer-events-none"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}