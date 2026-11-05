"use client";

import { useState } from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { ShineText } from "@/shared/ui/ShineText";

export default function ShineTextTestPage() {
  const [active, setActive] = useState(true);
  const [duration, setDuration] = useState(2.6);

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
              <span className="text-[12px] text-white/40">Shine Text Processing Animation</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Shine Text Demo</h1>
            <p className="text-sm text-white/50 mt-1">
              The text sibling of ProcessingCard: dim glyphs, white glint sweeping start → end, soft hold, loop.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white/[0.04] p-3 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-white/20 text-white border border-white/30"
                  : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
              }`}
            >
              {active ? <GoogleIcon iconName="pause" className="text-sm" /> : <GoogleIcon iconName="play_arrow" className="text-sm" />}
              {active ? "Sweeping (loop)" : "Idle (processing done)"}
            </button>

            <button
              type="button"
              onClick={() => {
                setActive(true);
                setDuration(2.6);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              <GoogleIcon iconName="refresh" className="text-sm" />
              Reset
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <span className="text-xs text-white/50 font-mono tabular-nums">{duration.toFixed(1)}s</span>
              <input
                type="range"
                min="1.2"
                max="4"
                step="0.2"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-24 accent-white cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ── Primary Showcase ── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white/90">
              1. Primary Processing Text (text-4xl / 5xl)
            </h2>
            <span className="text-xs text-white/40">Default cycle: 2.6s sweep + soft hold</span>
          </div>

          <div className="p-10 rounded-2xl bg-[#141518] border border-white/5 shadow-none flex items-center justify-center">
            <ShineText
              active={active}
              duration={duration}
              className="text-4xl md:text-5xl font-semibold tracking-tight"
            >
              Generating your character…
            </ShineText>
          </div>
        </section>

        {/* ── Common Sizes ── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-white/90">
            2. Multi-Size Grid
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/50 font-mono">text-xs (badge)</span>
              <ShineText active={active} duration={duration} className="text-xs font-medium">
                Training sheet…
              </ShineText>
            </div>

            <div className="flex flex-col gap-2 justify-center">
              <span className="text-xs text-white/50 font-mono">text-base</span>
              <ShineText active={active} duration={duration} className="text-base font-medium">
                Training sheet…
              </ShineText>
            </div>

            <div className="flex flex-col gap-2 justify-center">
              <span className="text-xs text-white/50 font-mono">text-2xl</span>
              <ShineText active={active} duration={duration} className="text-2xl font-semibold">
                Training sheet…
              </ShineText>
            </div>

            <div className="flex flex-col gap-2 justify-center">
              <span className="text-xs text-white/50 font-mono">text-5xl</span>
              <ShineText active={active} duration={duration} className="text-5xl font-bold">
                Training…
              </ShineText>
            </div>
          </div>
        </section>

        {/* ── Real Copy Variants ── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-white/90">
            3. Real Copy Variants
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg bg-[#141518] border border-white/5 flex flex-col gap-3">
              <span className="text-xs text-white/50 font-mono">Image generation</span>
              <ShineText active={active} duration={duration} className="text-xl font-semibold">
                Generating your character…
              </ShineText>
            </div>

            <div className="p-6 rounded-lg bg-[#141518] border border-white/5 flex flex-col gap-3">
              <span className="text-xs text-white/50 font-mono">Video generation</span>
              <ShineText active={active} duration={duration} className="text-xl font-semibold">
                Rendering your scene…
              </ShineText>
            </div>

            <div className="p-6 rounded-lg bg-[#141518] border border-white/5 flex flex-col gap-3">
              <span className="text-xs text-white/50 font-mono">Long copy (sweep across wrap)</span>
              <ShineText active={active} duration={duration} className="text-xl font-semibold">
                Upscaling 4× — almost there, polishing details…
              </ShineText>
            </div>

            <div className="p-6 rounded-lg bg-[#141518] border border-white/5 flex flex-col gap-3">
              <span className="text-xs text-white/50 font-mono">active=false (idle comparison)</span>
              <ShineText active={false} className="text-xl font-semibold">
                Upscaling 4× — almost there, polishing details…
              </ShineText>
            </div>
          </div>
        </section>

        {/* ── Specs Breakdown ── */}
        <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white/80 font-medium text-sm">
            <GoogleIcon iconName="auto_awesome" className="text-base text-white/60" />
            Spec Sheet
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/60">
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-black/40 border border-white/5">
              <span className="text-white font-medium">Glyphs &amp; Colors</span>
              <span>Base: dim <code className="text-white/80">white/38%</code> over dark surfaces</span>
              <span>Glint: bright <code className="text-white/80">white/96%</code> (aurora family)</span>
              <span>Background clip: <code className="text-white/80">background-clip: text</code></span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-black/40 border border-white/5">
              <span className="text-white font-medium">Motion</span>
              <span>Streak sweeps <strong>start → end</strong> (left → right)</span>
              <span>0–10% hold, 10–60% sweep, 60–100% hold → soft pause before loop</span>
              <span>Default cycle <code className="text-white/80">2.6s</code> (adjustable)</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-black/40 border border-white/5">
              <span className="text-white font-medium">Behavior</span>
              <span><code className="text-white/80">active</code>: loops while processing</span>
              <span><code className="text-white/80">active=false</code> → static dim, no animation</span>
              <span>Zero skeleton shimmer, zero spinners, zero framer-motion</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
