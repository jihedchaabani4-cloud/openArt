"use client";

import React from "react";

/**
 * ProcessingCharacterCard Component
 * Ultra-minimalist, sleek, text-less & logo-less processing card layer.
 * Renders a fluid, hypnotic ambient wave animation ("moja") with glowing mesh blur
 * and glassmorphic container alignment.
 *
 * Exact CSS specs:
 * - text-rendering: optimizespeed; font-family: "Google Sans Text"
 * - width: min(100cqw, 177.778cqh); height: min(100cqh, 56.25cqw);
 * - box-shadow: rgba(218, 220, 224, 0.15) 0px 0px 0px 1px;
 * - border-radius: 1rem; position: relative; overflow: hidden;
 * - --blur-amount: 80px; filter: brightness(1) contrast(1);
 */
export function ProcessingCharacterCard({ aspectRatio = "370/240" }) {
  return (
    <div
      className="relative flex w-full flex-col justify-between overflow-hidden rounded-2xl p-0.5 select-none outline-none bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500"
      style={{
        textRendering: "optimizeSpeed",
        fontFamily: '"Google Sans Text", system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── CARD FRAME WITH CONTAINER ASPECT RATIO & GLASS BORDER ── */}
      <div
        className="relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black shadow-inner"
        style={{
          aspectRatio: aspectRatio,
          boxShadow: "rgba(218, 220, 224, 0.15) 0px 0px 0px 1px",
          borderRadius: "1rem",
        }}
      >
        {/* ── FLUID WAVE MESH GLOW LAYER (--blur-amount: 80px) ── */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ opacity: 0.9, "--blur-amount": "80px" }}
        >
          {/* Wave 1: Pulsing Amber/Gold Fluid Wave */}
          <div
            className="absolute -top-1/4 -left-1/4 h-[150%] w-[150%] rounded-[40%] bg-gradient-to-tr from-amber-500/30 via-rose-500/20 to-violet-600/30 blur-[80px] animate-[spin_12s_linear_infinite]"
          />

          {/* Wave 2: Counter-rotating Cyan/Purple Wave */}
          <div
            className="absolute -bottom-1/4 -right-1/4 h-[150%] w-[150%] rounded-[45%] bg-gradient-to-bl from-cyan-500/25 via-indigo-500/20 to-amber-400/20 blur-[80px] animate-[spin_16s_linear_infinite_reverse]"
          />

          {/* Wave 3: Center Pulsing Ambient Aura */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[120%] w-[120%] rounded-full bg-gradient-to-r from-amber-400/15 via-pink-500/15 to-blue-500/15 blur-[80px] animate-pulse"
            style={{ animationDuration: "4s" }}
          />
        </div>

        {/* ── SKELETON & LIGHT FILTER LAYER (filter: brightness(1) contrast(1)) ── */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ filter: "brightness(1) contrast(1)" }}
        >
          {/* Subtle Shimmer Wave Passing Through */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

export default ProcessingCharacterCard;
