"use client";

import React, { useState } from "react";
import { Star, Trash2, Images, Loader2, AlertCircle } from "lucide-react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { FlowErrorTile } from "@/shared/ui/FlowErrorTile";
import { ProcessingCard } from "@/shared/ui/ProcessingCard";

const ELEMENT_TYPE_GOOGLE_ICONS = {
  object: "directions_car",
  style: "palette",
  font: "font_download",
  logo: "diamond",
};

/**
 * Pre-calculated stack offset definitions for up to 7 images.
 * stackX = resting position, stackXHover = spread position on card hover.
 */
const STACK_PRESETS = [
  // Front Center
  { zIndex: 7, stackX: 0,   stackXHover: 0,   stackY: 0,  rotation: 0,  scale: 1.00, delay: 0  },
  // Left 1
  { zIndex: 6, stackX: -14, stackXHover: -38, stackY: -2, rotation: -8, scale: 0.92, delay: 30 },
  // Right 1
  { zIndex: 5, stackX: 14,  stackXHover: 38,  stackY: -2, rotation: 8,  scale: 0.92, delay: 30 },
  // Left 2
  { zIndex: 4, stackX: -28, stackXHover: -70, stackY: -2, rotation: -14, scale: 0.82, delay: 60 },
  // Right 2
  { zIndex: 3, stackX: 28,  stackXHover: 70,  stackY: -2, rotation: 14,  scale: 0.82, delay: 60 },
  // Left 3
  { zIndex: 2, stackX: -42, stackXHover: -98, stackY: -2, rotation: -20, scale: 0.72, delay: 90 },
  // Right 3
  { zIndex: 1, stackX: 42,  stackXHover: 98,  stackY: -2, rotation: 20,  scale: 0.72, delay: 90 },
];

export function ElementCardKrea({ element, onClick, onDelete }) {
  const [isStarred, setIsStarred] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isUUID = (str) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
  const name = [
    element.element?.name,
    element.title,
    element.display_name,
    element.metadata?.displayName,
    element.name,
  ].find(n => n && typeof n === "string" && n.trim() && !isUUID(n.trim())) || "Untitled Element";
  const rawItems = element.items || element.reference_images || [];

  const images = Array.isArray(rawItems) && rawItems.length > 0
    ? rawItems.map(item => (typeof item === "string" ? item : item.url || item.src)).filter(Boolean)
    : [element.primary_media_url || element.url || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600"];

  const imageCount = images.length;
  const isProcessing = element.status === "processing" || element.items?.[0]?.status === "processing";
  const isFailed = element.status === "failed" || element.items?.[0]?.status === "failed";
  const elementType = element.element_type || element.type || "object";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); if (onClick && !isProcessing) onClick(element); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex cursor-pointer flex-col gap-2 rounded-lg p-2.5 transition-all duration-300 ease-out select-none outline-none hover:bg-white/[0.08] shadow-none"
    >
      {/* ── CARD INNER FRAME ── */}
      <div
        className="relative flex aspect-[370/231] w-full items-center justify-center overflow-hidden rounded-lg bg-surface-elevated transition-all duration-300 ease-out"
      >
        {/* Top-Left Category Type Badge (Google Icon) */}
        {!isProcessing && !isFailed && (
          <span
            title={`Type: ${elementType}`}
            className="absolute left-2.5 top-2.5 z-20 flex items-center justify-center text-white/80 group-hover:opacity-0 transition-opacity"
          >
            <GoogleIcon iconName={ELEMENT_TYPE_GOOGLE_ICONS[elementType] || "directions_car"} weight={200} className="text-[9.5px]" />
          </span>
        )}

        {/* Top-Left Pin Star Button */}
        <Button
          type="button"
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); setIsStarred(!isStarred); }}
          className="absolute top-2 left-2 z-30 flex size-7 items-center justify-center rounded-md text-white transition-all duration-200 bg-transparent hover:bg-white/15 backdrop-blur-md border border-white/20 opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
          aria-label="Pin Element"
        >
          <Star className={`size-3.5 transition-colors ${isStarred ? "text-yellow-400 fill-yellow-400" : "text-white hover:text-yellow-300"}`} />
        </Button>

        {/* Top-Right Delete Button */}
        {onDelete && (
          <Button
            type="button"
            variant="danger"
            onClick={(e) => { e.stopPropagation(); onDelete(element.id || element.name); }}
            className="absolute top-2 right-2 z-30 size-7 opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Delete Element"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}

        {/* ── CARD STATES ── */}
        {isProcessing ? (
          <ProcessingCard
            className="w-full h-full rounded-lg"
            showPlayIcon={false}
          />
        ) : isFailed ? (
          <FlowErrorTile
            error={element.items?.[0]?.error || "Provider error"}
            onDelete={onDelete ? (e) => { e?.stopPropagation?.(); onDelete(element.id || element.name); } : undefined}
          />
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-none relative h-full w-full">
              {images.slice(0, 7).map((imgUrl, index) => {
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
                    className="absolute top-1/2 left-1/2 w-[84px] aspect-[2/3] rounded-sm object-cover shadow-none border border-white/10"
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
        )}

      </div>

      {/* ── CARD TITLE ── */}
      <div className="text-foreground flex h-6 items-center justify-between gap-1 px-1">
        <p className="truncate text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
          {name}
        </p>
      </div>
    </div>
  );
}

export default ElementCardKrea;
