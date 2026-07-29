"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles, Box } from "lucide-react";
import { Button } from "@/shared/ui/button";

/**
 * ElementsKreaHero Component
 * Premium video-background hero section matching Krea AI design.
 */
export function ElementsKreaHero({
  projectName = "Elements",
  description = "Upload reference images to save objects, styles, fonts, or logos. Recreate the exact look, feel, and visual aesthetic you want across all your generations.",
  createLabel = "Create new element",
  onOpenCreateModal,
}) {
  return (
    <div className="relative w-full aspect-[48/9] min-h-[120px] overflow-hidden bg-zinc-950 text-white rounded-md border border-white/10 shadow-2xl mb-4">
      {/* Background Video Layer */}
      <video
        playsInline
        autoPlay
        muted
        loop
        preload="metadata"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-80"
        src="https://s.krea.ai/h264_1080_best_1.mp4"
        poster="https://optim-images.krea.ai/https---s-krea-ai-h264-1080-best-1-mp4-256.webp"
      />

      {/* Horizontal black gradient overlay limited to left text area */}
      <div className="pointer-events-none absolute inset-0 z-1 bg-gradient-to-r from-black/80 via-black/30 via-20% to-transparent to-40%" />

      {/* Content Container (Vertically Centered) */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center gap-3 p-6 sm:p-8 max-w-2xl">
        <div className="flex flex-col gap-3">
          
          {/* Header Title with Krea Personalization Icon */}
          <div className="flex items-center gap-3">
            <img
              alt="Personalization icon"
              className="size-9 shrink-0"
              src="https://optim-images.krea.ai/https---s-krea-ai-icons-Personalization2-png-256.webp"
            />
            <h1 className="font-book text-3xl font-normal text-white tracking-normal">
              {projectName}
            </h1>
          </div>

          {/* Description Text */}
          <p className="font-book max-w-md text-base text-white/90 leading-relaxed">
            {description}
          </p>

          {/* Primary CTA Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex shrink-0 items-center justify-center gap-2 text-sm font-medium whitespace-nowrap transition-all bg-white text-black hover:bg-white/90 active:scale-98 h-10 px-8 rounded-full shadow-md cursor-pointer"
            >
              <Plus className="size-4 stroke-[2.2]" />
              <span>{createLabel}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ElementsKreaHero;
