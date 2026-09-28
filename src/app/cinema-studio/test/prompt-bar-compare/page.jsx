"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// ── v3 ────────────────────────────────────────────────────────────────────────
import {
  PromptBarPlatform,
  generatedMediaType,
  generatedMediaConfig,
  useRealBackendModels,
} from "@/features/prompt-bar/index.platform";

// ── Payload log ───────────────────────────────────────────────────────────────
function PayloadLog({ entries, label, color }) {
  if (entries.length === 0) return null;
  return (
    <div className="mt-3 rounded-2xl bg-black/40 border border-white/10 overflow-hidden">
      <div className={`px-4 py-2 text-[11px] font-semibold tracking-wider uppercase ${color} border-b border-white/10`}>
        {label} — Last {entries.length} payload{entries.length > 1 ? "s" : ""}
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {entries.slice().reverse().map((entry, i) => (
          <div key={i} className="px-4 py-3 border-b border-white/5 last:border-0">
            <div className="text-[10px] text-white/30 mb-1">{entry.time}</div>
            <pre className="text-[11px] text-green-300/90 font-mono whitespace-pre-wrap break-all leading-relaxed">
              {JSON.stringify(entry.payload, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── V3 Single Panel ───────────────────────────────────────────────────────────
function V3Panel({ instanceLabel, color }) {
  const [payloads, setPayloads] = useState([]);
  const { data } = useRealBackendModels();
  const models = data?.models ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase ${color.badge}`}>
          v3 Platform — {instanceLabel}
        </div>
        <div className="text-[12px] text-white/40">
          Per-instance store · {models.length} models
        </div>
      </div>

      <div className="relative">
        <PromptBarPlatform
          type={generatedMediaType}
          featureConfig={generatedMediaConfig}
          models={models}
          onGenerate={(r) =>
            setPayloads((p) => [...p.slice(-4), { time: new Date().toLocaleTimeString(), payload: r }])
          }
          hideBackground={true}
        />
      </div>

      <PayloadLog entries={payloads} label={`${instanceLabel} Payload`} color={color.text} />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PromptBarTestPage() {
  const [activeTab, setActiveTab] = useState("single");

  const tabs = [
    { id: "single",    label: "Single Instance" },
    { id: "isolation", label: "Instance Isolation (×2)" },
  ];

  return (
    <div className="min-h-screen bg-[#0e0f10] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-[#0e0f10]/90 backdrop-blur-xl border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-semibold text-white">Prompt Bar v3 — Test Page</h1>
          <p className="text-[12px] text-white/40 mt-0.5">
            PromptBarPlatform · featureConfig · per-instance store
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all",
                activeTab === tab.id
                  ? "bg-white text-black shadow"
                  : "text-white/50 hover:text-white",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 py-8 max-w-[1200px] mx-auto">

        {/* ── Single Instance ─────────────────────────────────── */}
        {activeTab === "single" && (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl bg-white/[0.02] border border-white/5 p-8"
          >
            <V3Panel
              instanceLabel="Main"
              color={{ badge: "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400", text: "text-emerald-400" }}
            />
          </motion.div>
        )}

        {/* ── Instance Isolation ──────────────────────────────── */}
        {activeTab === "isolation" && (
          <motion.div
            key="isolation"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="rounded-2xl bg-purple-500/5 border border-purple-500/20 px-5 py-3 text-[12px] text-white/50 leading-relaxed">
              <span className="text-purple-400">ℹ</span> غيّر model أو mode في Instance A — Instance B ما يتأثرش. كل واحد عنده store منفصل 100%.
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="rounded-3xl bg-white/[0.02] border border-white/5 p-6">
                <V3Panel
                  instanceLabel="Instance A"
                  color={{ badge: "bg-purple-500/20 border border-purple-500/30 text-purple-400", text: "text-purple-400" }}
                />
              </div>
              <div className="rounded-3xl bg-white/[0.02] border border-white/5 p-6">
                <V3Panel
                  instanceLabel="Instance B"
                  color={{ badge: "bg-blue-500/20 border border-blue-500/30 text-blue-400", text: "text-blue-400" }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Architecture Summary ────────────────────────────── */}
        <div className="mt-8 rounded-3xl bg-white/[0.02] border border-white/5 p-6">
          <h2 className="text-[13px] font-semibold text-white/70 mb-4 uppercase tracking-wider">v3 Architecture</h2>
          <div className="grid grid-cols-2 gap-4 text-[12px]">
            {[
              ["Store", "Per-instance createStore() — Zustand vanilla, zero shared state"],
              ["Model eligibility", "featureConfig.filterEligibleModels — manifest capabilities only"],
              ["Reference slots", "COMPOSITION_REQUIREMENTS → image: [ref] / video.frames: [start, end]"],
              ["Top Panel Zone", "AnimatePresence mode=\"wait\" — @ mention ↔ ImportMedia panel"],
              ["Serialization", "serialize() → { model, prompt, parameters } via backend keys"],
              ["Parameter routing", "ParameterControl → RatioSelector / DurationSelector / VariationSelector..."],
            ].map(([feat, desc]) => (
              <div key={feat} className="flex gap-3 py-2.5 px-3 rounded-xl bg-white/[0.03]">
                <div className="text-emerald-400 shrink-0">✓</div>
                <div>
                  <div className="font-semibold text-white/80 mb-0.5">{feat}</div>
                  <div className="text-white/40 text-[11px] leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
