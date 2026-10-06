"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { ProcessingCard } from "@/shared/ui/ProcessingCard";
import { CharacterCardKrea } from "@/components/cinema-studio/characters/CharacterCardKrea";
import { ElementCardKrea } from "@/components/cinema-studio/elements/ElementCardKrea";

export default function ProcessingCardTestPage() {
  const [progress, setProgress] = useState(29);
  const [isAutoSimulating, setIsAutoSimulating] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);

  // Auto-simulation mimicking real backend video progress:
  // "Yzid real progress (mouch fake loop), +1 ou +2 kol ~2s"
  useEffect(() => {
    if (!isAutoSimulating) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        const inc = Math.random() > 0.4 ? 2 : 1;
        return prev + inc;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [isAutoSimulating]);

  return (
    <div className="min-h-screen bg-[#0d0e11] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Interactive Test Lab
              </span>
              <span className="text-[12px] text-white/40">Aurora Processing Animation</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Processing Card Demo</h1>
            <p className="text-sm text-white/50 mt-1">
              Exact reverse-engineered specs: #17181a dark neutral base, 10s non-linear orbital drift, 13s secondary blob, blur-3xl glow, minimal play icon & tabular % counter.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white/[0.04] p-3 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setIsAutoSimulating(!isAutoSimulating)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isAutoSimulating
                  ? "bg-white/20 text-white border border-white/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
            >
              {isAutoSimulating ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              {isAutoSimulating ? "Simulating (+1/+2% / 2s)" : "Paused"}
            </button>

            <button
              type="button"
              onClick={() => setProgress(29)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Reset (29%)
            </button>

            <button
              type="button"
              onClick={() => setShowPlayIcon(!showPlayIcon)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                showPlayIcon
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-white/5 text-white/50 border-white/10 hover:text-white"
              }`}
            >
              {showPlayIcon ? "Video Icon: ON" : "Video Icon: OFF (Image mode)"}
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <span className="text-xs text-white/50 font-mono tabular-nums">{progress}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => {
                  setIsAutoSimulating(false);
                  setProgress(Number(e.target.value));
                }}
                className="w-24 accent-white cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ── Main Showcase: Standard Video Card ── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white/90">
              1. Primary Video Aspect Ratio (16:9 Aspect Video)
            </h2>
            <span className="text-xs text-white/40">Default size: max-w-xl aspect-video</span>
          </div>

          <div className="max-w-xl">
            <ProcessingCard
              progress={progress}
              aspectRatio="16/9"
              showPlayIcon={showPlayIcon}
              className="w-full shadow-2xl border border-white/5"
            />
          </div>
        </section>

        {/* ── Grid of Common Formats ── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-white/90">
            2. Multi-Aspect Responsive Grid
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* 16:9 Video */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/50 font-mono">16:9 (Landscape)</span>
              <ProcessingCard
                progress={progress}
                aspectRatio="16/9"
                showPlayIcon={showPlayIcon}
                className="w-full shadow-lg border border-white/5"
              />
            </div>

            {/* 1:1 Square */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/50 font-mono">1:1 (Square)</span>
              <ProcessingCard
                progress={progress}
                aspectRatio="1/1"
                showPlayIcon={showPlayIcon}
                className="w-full shadow-lg border border-white/5"
              />
            </div>

            {/* 9:16 Portrait */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/50 font-mono">9:16 (Portrait / Reel)</span>
              <ProcessingCard
                progress={progress}
                aspectRatio="9/16"
                showPlayIcon={showPlayIcon}
                className="w-full shadow-lg border border-white/5"
              />
            </div>

            {/* 21:9 Ultra-wide */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/50 font-mono">21:9 (Cinematic)</span>
              <ProcessingCard
                progress={progress}
                aspectRatio="21/9"
                showPlayIcon={showPlayIcon}
                className="w-full shadow-lg border border-white/5"
              />
            </div>
          </div>
        </section>

        {/* ── Studio Cards Integration ── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-white/90">
            3. Integrated Cards in Processing State
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Character Card in Processing */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/50 font-mono">CharacterCardKrea (processing)</span>
              <CharacterCardKrea
                character={{
                  status: "processing",
                  name: "Cyberpunk Nomad",
                  character_info: "Generating 3-view turnaround sheet...",
                  progress: progress,
                }}
              />
            </div>

            {/* Element Card in Processing */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/50 font-mono">ElementCardKrea (processing)</span>
              <ElementCardKrea
                element={{
                  status: "processing",
                  type: "object",
                  name: "Futuristic Vehicle",
                }}
              />
            </div>

            {/* Completed Preview comparison */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/50 font-mono">ProcessingCard without %</span>
              <ProcessingCard
                showPlayIcon={showPlayIcon}
                aspectRatio="370/240"
                className="w-full shadow-lg border border-white/5"
              />
            </div>
          </div>
        </section>

        {/* ── Specs Breakdown ── */}
        <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white/80 font-medium text-sm">
            <Sparkles className="size-4 text-white/60" />
            Reverse Engineered Video Analysis Specifications
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/60">
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-white font-medium">Card Container</span>
              <span>Background: <code className="text-white/80">#17181a</code> (pure neutral dark)</span>
              <span>Radius: <code className="text-white/80">rounded-2xl</code> (~16px)</span>
              <span>No skeleton shimmer, no spinner</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-white font-medium">Blobs Motion</span>
              <span>Blob A: 55% x 70%, 10s orbital loop</span>
              <span>Blob B: 40% x 50%, 13s loop (opacity 0.5)</span>
              <span>Blur: <code className="text-white/80">blur-3xl</code> (~64px ethereal glow)</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-white font-medium">Overlays</span>
              <span>Top-left: Semi-transparent Play icon (~16px)</span>
              <span>Top-right: <code className="text-white/80">11px font-medium text-white/60</code></span>
              <span>Tabular numbers for smooth % incrementation</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
