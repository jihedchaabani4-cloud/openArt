"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { ShineText } from "@/components/primitives/ShineText";
import { Button } from "@/components/base/button";

export default function ShineTextTestPage() {
  const [active, setActive] = useState(true);
  const [duration, setDuration] = useState(2.6);

  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-canvas-bg text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-sharp ds-type-micro-tag uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Interactive Test Lab
              </span>
              <span className="ds-type-small text-white/40">Shine Text Processing Animation</span>
            </div>
            <h1 className="ds-type-card-title">Shine Text Demo</h1>
            <p className="ds-type-small text-white/50 mt-1">
              The text sibling of ProcessingCard: dim glyphs, white glint sweeping start → end, soft hold, loop.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white/[0.04] p-3 rounded-comfortable border border-white/10">
            <Button
              type="button"
              variant={active ? "secondary" : "outline"}
              onClick={() => setActive(!active)}
              className="gap-2"
            >
              {active ? <HugeIcon name="pause" size="sm" /> : <HugeIcon name="play" size="sm" />}
              {active ? "Sweeping (loop)" : "Idle (processing done)"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActive(true);
                setDuration(2.6);
              }}
              className="gap-1.5"
            >
              <HugeIcon name="refresh" size="sm" />
              Reset
            </Button>

            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <span className="ds-type-small text-white/50 font-mono tabular-nums">{duration.toFixed(1)}s</span>
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
            <h2 className="ds-type-body text-white/90">
              1. Primary Processing Text (ds-type-display-hero)
            </h2>
            <span className="ds-type-small text-white/40">Default cycle: 2.6s sweep + soft hold</span>
          </div>

          <div className="p-10 rounded-comfortable bg-omni-bg border border-white/5 shadow-none flex items-center justify-center">
            <ShineText
              active={active}
              duration={duration}
              className="ds-type-display-hero"
            >
              Generating your character…
            </ShineText>
          </div>
        </section>

        {/* ── Common Sizes ── */}
        <section className="flex flex-col gap-4">
          <h2 className="ds-type-body text-white/90">
            2. Multi-Size Grid
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col gap-2">
              <span className="ds-type-small text-white/50 font-mono">ds-type-small (badge)</span>
              <ShineText active={active} duration={duration} className="ds-type-small">
                Training sheet…
              </ShineText>
            </div>

            <div className="flex flex-col gap-2 justify-center">
              <span className="ds-type-small text-white/50 font-mono">ds-type-body</span>
              <ShineText active={active} duration={duration} className="ds-type-body">
                Training sheet…
              </ShineText>
            </div>

            <div className="flex flex-col gap-2 justify-center">
              <span className="ds-type-small text-white/50 font-mono">ds-type-card-title</span>
              <ShineText active={active} duration={duration} className="ds-type-card-title">
                Training sheet…
              </ShineText>
            </div>

            <div className="flex flex-col gap-2 justify-center">
              <span className="ds-type-small text-white/50 font-mono">ds-type-display-hero</span>
              <ShineText active={active} duration={duration} className="ds-type-display-hero">
                Training…
              </ShineText>
            </div>
          </div>
        </section>

        {/* ── Real Copy Variants ── */}
        <section className="flex flex-col gap-4">
          <h2 className="ds-type-body text-white/90">
            3. Real Copy Variants
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-comfortable bg-omni-bg border border-white/5 flex flex-col gap-3">
              <span className="ds-type-small text-white/50 font-mono">Image generation</span>
              <ShineText active={active} duration={duration} className="ds-type-feature-title">
                Generating your character…
              </ShineText>
            </div>

            <div className="p-6 rounded-comfortable bg-omni-bg border border-white/5 flex flex-col gap-3">
              <span className="ds-type-small text-white/50 font-mono">Video generation</span>
              <ShineText active={active} duration={duration} className="ds-type-feature-title">
                Rendering your scene…
              </ShineText>
            </div>

            <div className="p-6 rounded-comfortable bg-omni-bg border border-white/5 flex flex-col gap-3">
              <span className="ds-type-small text-white/50 font-mono">Long copy (sweep across wrap)</span>
              <ShineText active={active} duration={duration} className="ds-type-feature-title">
                Upscaling 4× — almost there, polishing details…
              </ShineText>
            </div>

            <div className="p-6 rounded-comfortable bg-omni-bg border border-white/5 flex flex-col gap-3">
              <span className="ds-type-small text-white/50 font-mono">active=false (idle comparison)</span>
              <ShineText active={false} className="ds-type-feature-title">
                Upscaling 4× — almost there, polishing details…
              </ShineText>
            </div>
          </div>
        </section>

        {/* ── Specs Breakdown ── */}
        <section className="p-6 rounded-comfortable bg-white/[0.02] border border-white/10 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white/80 ds-type-caption-label">
            <HugeIcon name="sparkles" size="md" className="text-white/60" />
            Spec Sheet
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ds-type-small text-white/60">
            <div className="flex flex-col gap-1 p-3 rounded-comfortable bg-black/40 border border-white/5">
              <span className="ds-type-caption-label text-white">Glyphs &amp; Colors</span>
              <span>Base: dim <code className="text-white/80">white/38%</code> over dark surfaces</span>
              <span>Glint: bright <code className="text-white/80">white/96%</code> (aurora family)</span>
              <span>Background clip: <code className="text-white/80">background-clip: text</code></span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-comfortable bg-black/40 border border-white/5">
              <span className="ds-type-caption-label text-white">Motion</span>
              <span>Streak sweeps <strong>start → end</strong> (left → right)</span>
              <span>0–10% hold, 10–60% sweep, 60–100% hold → soft pause before loop</span>
              <span>Default cycle <code className="text-white/80">2.6s</code> (adjustable)</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-comfortable bg-black/40 border border-white/5">
              <span className="ds-type-caption-label text-white">Behavior</span>
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
