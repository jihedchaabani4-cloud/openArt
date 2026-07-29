"use client";

import React, { useState, useEffect } from "react";
import { Star, Trash2, Loader2, AlertCircle, User, Sparkles } from "lucide-react";

/**
 * Pre-calculated stack offset definitions for character 3-view sheets.
 */
const STACK_PRESETS = [
  // Front Center
  { zIndex: 7, stackX: 0,   stackXHover: 0,   stackY: 0,  rotation: 0,  scale: 1.00, delay: 0  },
  // Left 1
  { zIndex: 6, stackX: -16, stackXHover: -40, stackY: -2, rotation: -6, scale: 0.92, delay: 30 },
  // Right 1
  { zIndex: 5, stackX: 16,  stackXHover: 40,  stackY: -2, rotation: 6,  scale: 0.92, delay: 30 },
  // Left 2
  { zIndex: 4, stackX: -30, stackXHover: -72, stackY: -2, rotation: -12, scale: 0.82, delay: 60 },
  // Right 2
  { zIndex: 3, stackX: 30,  stackXHover: 72,  stackY: -2, rotation: 12,  scale: 0.82, delay: 60 },
];

const MUTED_PALETTE = [
  "#5a6268", "#6b635b", "#4d5358", "#736d65",
  "#5c5854", "#4a5054", "#5e6466", "#464b50",
];

function extractFallbackColor(imageUrl, name = "") {
  let hash = 0;
  const sourceStr = (imageUrl || "") + (name || "");
  for (let i = 0; i < sourceStr.length; i++) {
    hash = (hash << 5) - hash + sourceStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % MUTED_PALETTE.length;
  return MUTED_PALETTE[index];
}

export function CharacterCardKrea({ character, onClick, onDelete }) {
  const [isStarred, setIsStarred] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const name = character.name || character.display_name || character.metadata?.displayName || "Untitled Character";
  const description = character.description || character.metadata?.description || "";
  const rawItems = character.items || character.reference_images || [];

  const images = Array.isArray(rawItems) && rawItems.length > 0
    ? rawItems.map(item => (typeof item === "string" ? item : item.url || item.src)).filter(Boolean)
    : [character.primary_media_url || character.url].filter(Boolean);

  const primaryImage = images[0] || "";
  const cardBgColor = extractFallbackColor(primaryImage, name);

  const isProcessing = character.status === "processing" || character.items?.[0]?.status === "processing";
  const isFailed = character.status === "failed" || character.items?.[0]?.status === "failed";
  const errorMessage = character.items?.[0]?.error || character.error || "Generation error";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); if (onClick && !isProcessing) onClick(character); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex cursor-pointer flex-col gap-2 rounded-xl p-2.5 transition-all duration-300 ease-out select-none outline-none hover:bg-white/[0.08] hover:shadow-2xl border border-white/5 hover:border-white/10"
    >
      {/* ── CARD INNER FRAME ── */}
      <div
        style={{ backgroundColor: cardBgColor }}
        className="relative flex aspect-[370/240] w-full items-center justify-center overflow-hidden rounded-[10px] transition-all duration-300 ease-out shadow-inner"
      >
        {/* Top-Left Category Type Badge (User Icon) */}
        {!isProcessing && !isFailed && (
          <span
            title="Character"
            className="absolute left-2.5 top-2.5 z-20 flex items-center justify-center text-white/90 drop-shadow-md bg-black/40 backdrop-blur-md p-1.5 rounded-lg border border-white/10 group-hover:opacity-0 transition-opacity"
          >
            <User className="size-3 text-white" />
          </span>
        )}

        {/* Top-Left Pin Star Button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsStarred(!isStarred); }}
          className="absolute top-2 left-2 z-30 flex size-7 items-center justify-center rounded-lg text-white transition-all duration-200 bg-black/40 hover:bg-white/20 backdrop-blur-md border border-white/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
          aria-label="Pin Character"
        >
          <Star className={`size-3.5 transition-colors ${isStarred ? "text-amber-400 fill-amber-400" : "text-white hover:text-amber-300"}`} />
        </button>

        {/* Top-Right Delete Button */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(character.id || character.name); }}
            className="absolute top-2 right-2 z-30 flex size-7 items-center justify-center rounded-lg text-white/80 hover:text-white transition-all duration-200 bg-black/40 hover:bg-rose-600/90 backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Delete Character"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}

        {/* ── CARD STATES ── */}
        {isProcessing ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 bg-zinc-950/90 text-white/80 backdrop-blur-md p-4 text-center">
            <Loader2 className="size-7 animate-spin text-amber-400" />
            <span className="text-xs font-semibold tracking-wide">Creating character...</span>
            <span className="text-[10px] text-white/50">LLM Prompt & Turnaround Generation</span>
          </div>
        ) : isFailed ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-rose-950/80 text-rose-200 p-3 text-center backdrop-blur-md">
            <AlertCircle className="size-6 text-rose-400" />
            <span className="text-xs font-bold tracking-wide">Generation Failed</span>
            <span className="text-[10px] text-rose-300/70 truncate max-w-full px-2">
              {errorMessage}
            </span>
          </div>
        ) : images.length > 0 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-none relative h-full w-full">
              {images.slice(0, 5).map((imgUrl, index) => {
                const preset = STACK_PRESETS[index] || STACK_PRESETS[0];
                const x = isHovered ? preset.stackXHover : preset.stackX;
                const rot = isHovered ? preset.rotation * 1.1 : preset.rotation;
                const sc = isHovered ? preset.scale * 1.05 : preset.scale;
                return (
                  <img
                    key={index}
                    alt={name}
                    src={imgUrl}
                    loading="lazy"
                    className="absolute top-1/2 left-1/2 w-[90px] aspect-[2/3] rounded-lg object-cover shadow-[0_20px_25px_-5px_rgba(0,0,0,0.5),0_8px_10px_-6px_rgba(0,0,0,0.5)] border border-white/15"
                    style={{
                      zIndex: preset.zIndex,
                      transform: `translate(-50%, -50%) translate(${x}px, ${preset.stackY}px) rotate(${rot}deg) scale(${sc})`,
                      transition: `transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1) ${preset.delay}ms`,
                      willChange: "transform",
                    }}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-zinc-900/90 text-white/50">
            <Sparkles className="size-6 text-amber-400/60" />
            <span className="text-xs">3-View Sheet</span>
          </div>
        )}
      </div>

      {/* ── CARD TITLE & DESCRIPTION ── */}
      <div className="flex flex-col gap-0.5 px-1 py-0.5">
        <p className="truncate text-sm font-bold text-white/90 group-hover:text-white transition-colors">
          {name}
        </p>
        {description && (
          <p className="line-clamp-1 text-[11px] text-white/50 group-hover:text-white/70 transition-colors">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default CharacterCardKrea;
