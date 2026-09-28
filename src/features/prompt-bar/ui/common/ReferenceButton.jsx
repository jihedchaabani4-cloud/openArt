"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Image, ArrowLeftRight, Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

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

  const isCharacter =
    media.type === "character" ||
    media.workflow_type === "CHARACTER_SHEET" ||
    Boolean(media.characterId) ||
    media.entity_type === "character";

  const isElement =
    media.type === "element" ||
    media.workflow_type === "ELEMENT_SHEET" ||
    Boolean(media.elementId) ||
    media.entity_type === "element";

  const isVideo = media.type === "video" || media.is_video || media.isVideo;

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

  const tooltipText =
    media.displayName ||
    media.name ||
    label ||
    (isCharacter ? "Ingrédient personnage" : isElement ? "Ingrédient élément" : "Ingrédient");

  const badgeIcon = isCharacter
    ? "accessibility_new"
    : isElement
    ? "widgets"
    : isVideo
    ? "videocam"
    : null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("group relative shrink-0 w-[50px] h-[50px]", className)}
    >
      {/* 50x50 Chip Container */}
      <div
        className="chip-container group w-full h-full relative rounded-[12px] overflow-hidden bg-white/[0.04] cursor-pointer flex items-center justify-center select-none"
        aria-label={tooltipText}
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.();
        }}
      >
        <div className="chip-image-wrapper absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
          {isVideo ? (
            <video
              src={src}
              className="chip-image w-full h-full object-cover select-none pointer-events-none"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={src}
              alt={tooltipText}
              className="chip-image w-full h-full object-cover select-none pointer-events-none"
            />
          )}
        </div>

        {/* Hover overlay — cancel button */}
        <div
          className="hover-icon-overlay absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
          title={`Supprimer ${tooltipText}`}
        >
          <GoogleIcon
            iconName="cancel"
            fill
            className="mat-icon notranslate hover-icon flow-icon-s google-symbols mat-icon-no-color text-white text-[20px]"
            aria-hidden="true"
          />
        </div>

        {/* Type badge pinned to bottom-right corner */}
        {badgeIcon && (
          <div
            className="type-badge"
            aria-hidden="true"
          >
            <GoogleIcon
              iconName={badgeIcon}
              fill
              weight={600}
              className="mat-icon notranslate type-badge-icon google-symbols mat-icon-no-color"
            />
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