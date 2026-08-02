"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Sparkles, Cpu, Layers } from "lucide-react";

/**
 * ProcessingCharacterCard Component
 * High-end glassmorphic processing card with animated glowing blur aura,
 * skeleton shimmer, container query aspect-ratio alignment, and Google Sans typography.
 *
 * Implements exact aesthetic requested:
 * - text-rendering: optimizespeed; font-family: "Google Sans Text"
 * - box-shadow: rgba(218, 220, 224, 0.15) 0px 0px 0px 1px
 * - border-radius: 1rem; position: relative; overflow: hidden
 * - --blur-amount: 80px; filter: brightness(1) contrast(1)
 */
export function ProcessingCharacterCard({
  name = "Creating Character...",
  stepLabel = "Enriching Prompt & Building 3-Views",
  aspectRatio = "370/240",
}) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const STEPS = [
    "Enriching prompt with AI Vision...",
    "Building 3-view turnaround (Front/Side/Back)...",
    "Generating high-fashion character sheet...",
    "Finalizing details & palette...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % STEPS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="group relative flex cursor-wait flex-col gap-2 rounded-2xl p-2.5 transition-all duration-500 ease-out select-none outline-none bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl"
      style={{
        textRendering: "optimizeSpeed",
        fontFamily: '"Google Sans Text", system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── CARD OUTER FRAME WITH CONTAINER ASPECT RATIO ── */}
      <div
        className="relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black shadow-inner"
        style={{
          aspectRatio: aspectRatio,
          boxShadow: "rgba(218, 220, 224, 0.15) 0px 0px 0px 1px",
          borderRadius: "1rem",
        }}
      >
        {/* ── BACKGROUND GLOWING BLUR AURA (--blur-amount: 80px) ── */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
          style={{ opacity: 0.85 }}
        >
          {/* Pulsing Gradient Orbs */}
          <div className="absolute -top-12 -left-12 h-44 w-44 rounded-full bg-amber-500/25 blur-[80px] animate-pulse" />
          <div className="absolute -bottom-12 -right-12 h-44 w-44 rounded-full bg-violet-600/30 blur-[80px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 rounded-full bg-cyan-500/20 blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        {/* ── SKELETON SHIMMER LAYER (filter: brightness(1) contrast(1)) ── */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{ filter: "brightness(1) contrast(1)" }}
        >
          {/* Animated Shimmer Line */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
          
          {/* 3-View Placeholder Card Shapes */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 p-6 opacity-20">
            <div className="h-28 w-16 rounded-lg bg-white/10 animate-pulse" style={{ animationDelay: "0.2s" }} />
            <div className="h-32 w-20 rounded-xl bg-white/20 border border-white/20 animate-pulse" style={{ animationDelay: "0.4s" }} />
            <div className="h-28 w-16 rounded-lg bg-white/10 animate-pulse" style={{ animationDelay: "0.6s" }} />
          </div>
        </div>

        {/* ── CENTRAL LOADING STATUS BADGE & CONTENT ── */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-3 p-4 text-center">
          {/* Animated Spinner with Sparkles */}
          <div className="relative flex items-center justify-center">
            <div className="absolute h-14 w-14 rounded-2xl bg-amber-500/20 blur-md animate-pulse" />
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/60 border border-amber-500/40 backdrop-blur-xl shadow-lg">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
            </div>
            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-black shadow-md">
              <Sparkles className="h-3 w-3 fill-black" />
            </div>
          </div>

          {/* Title & Animated Step Text */}
          <div className="flex flex-col items-center gap-1 max-w-[85%]">
            <span className="text-xs font-semibold tracking-wide text-white drop-shadow-sm truncate w-full">
              {name}
            </span>
            <span className="text-[11px] font-medium text-amber-300/90 tracking-tight transition-all duration-300 animate-pulse">
              {STEPS[activeStepIndex]}
            </span>
          </div>

          {/* Progress Indicator Dots */}
          <div className="flex items-center gap-1.5 pt-1">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === activeStepIndex
                    ? "w-5 bg-amber-400 shadow-sm shadow-amber-400/50"
                    : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── TOP-LEFT LIVE BADGE ── */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-black/50 px-2 py-1 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
          </span>
          <span className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">
            AI Processing
          </span>
        </div>
      </div>

      {/* ── BOTTOM CARD LABEL DETAILS ── */}
      <div className="flex items-center justify-between px-1 py-0.5 text-xs text-white/60">
        <span className="font-medium truncate max-w-[70%] text-white/80">
          {name}
        </span>
        <span className="text-[10px] text-amber-400/90 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
          Creating 3-views
        </span>
      </div>
    </div>
  );
}

export default ProcessingCharacterCard;
