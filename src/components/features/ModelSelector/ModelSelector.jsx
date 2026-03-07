"use client"

import { useState, useRef, useEffect } from "react"

// ─── Data ─────────────────────────────────────────────────────────────────────
export const MODELS = [
  {
    id: 1,
    name: "Higgsfield Soul 2.0",
    subtitle: "Next gen ultra-realistic fashion visuals",
    badge: "NEW",
    quality: "4K",
    durationMin: 5,
    durationMax: 20,
    icon: "Hf",
    iconGradient: "linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%)",
  },
  {
    id: 2,
    name: "Kling 3.0",
    subtitle: null,
    badge: "EXCLUSIVE",
    quality: "1080p",
    durationMin: 3,
    durationMax: 15,
    icon: "K",
    iconGradient: "linear-gradient(135deg, #1e1a0f 0%, #0f0d07 100%)",
  },
  {
    id: 3,
    name: "Seedream Video",
    subtitle: "Cinematic quality at scale",
    badge: "PREMIER",
    quality: "1080p",
    durationMin: 2,
    durationMax: 10,
    icon: "Sd",
    iconGradient: "linear-gradient(135deg, #0d1a1e 0%, #071013 100%)",
  },
  {
    id: 4,
    name: "Runway Gen-4",
    subtitle: null,
    badge: null,
    quality: "1080p",
    durationMin: 4,
    durationMax: 16,
    icon: "Rw",
    iconGradient: "linear-gradient(135deg, #1a0d0d 0%, #0f0707 100%)",
  },
  {
    id: 5,
    name: "Veo 3 Ultra",
    subtitle: "Google DeepMind flagship engine",
    badge: "NEW",
    quality: "4K",
    durationMin: 5,
    durationMax: 30,
    icon: "V",
    iconGradient: "linear-gradient(135deg, #0a0e1a 0%, #05070f 100%)",
  },
]

const BADGE = {
  EXCLUSIVE: { bg: "rgba(255,196,0,0.12)", border: "rgba(255,196,0,0.3)", color: "#ffc400" },
  NEW:       { bg: "rgba(72,222,128,0.12)", border: "rgba(72,222,128,0.3)", color: "#48de80" },
  PREMIER:   { bg: "rgba(148,130,255,0.12)", border: "rgba(148,130,255,0.3)", color: "#9482ff" },
}

// ─── Tiny icons ───────────────────────────────────────────────────────────────
const ChevronRight = ({ flip }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: "transform 0.2s", transform: flip ? "rotate(90deg)" : "rotate(0deg)" }}
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
)

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.87-3.87" />
  </svg>
)

const SparkleIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.74 2.61a.76.76 0 0 0-1.48 0C10.78 5.12 9.84 7.04 8.44 8.44 7.04 9.84 5.12 10.78 2.61 11.26a.76.76 0 0 0 0 1.48c2.51.48 4.43 1.42 5.83 2.82 1.4 1.4 2.34 3.32 2.82 5.83a.76.76 0 0 0 1.48 0c.48-2.51 1.42-4.43 2.82-5.83 1.4-1.4 3.32-2.34 5.83-2.82a.76.76 0 0 0 0-1.48c-2.51-.48-4.43-1.42-5.83-2.82-1.4-1.4-2.34-3.32-2.82-5.83Z" />
  </svg>
)

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
)

// ─── Model icon avatar ─────────────────────────────────────────────────────────
const ModelAvatar = ({ model, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.27,
    background: model.iconGradient,
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    fontSize: size * 0.34,
    fontWeight: 700,
    color: "rgba(255,255,255,0.55)",
    fontFamily: "'DM Mono', monospace",
    boxShadow: "inset 0 1.5px 3px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.4)",
    letterSpacing: "-0.03em",
  }}>
    {model.icon}
  </div>
)

// ─── Single row in dropdown ───────────────────────────────────────────────────
const ModelRow = ({ model, isSelected, onClick }) => {
  const badge = model.badge ? BADGE[model.badge] : null
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex", alignItems: "center", gap: 10,
        padding: "7px 10px 7px 8px",
        borderRadius: 11,
        border: isSelected
          ? "1px solid rgba(255,255,255,0.1)"
          : "1px solid transparent",
        background: isSelected
          ? "rgba(255,255,255,0.06)"
          : hovered
            ? "rgba(255,255,255,0.04)"
            : "transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.12s, border-color 0.12s",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <ModelAvatar model={model} size={36} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* name + badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: model.subtitle ? 2 : 3 }}>
          <span style={{
            fontSize: 13, fontWeight: 500,
            color: "rgba(255,255,255,0.88)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {model.name}
          </span>
          {badge && (
            <span style={{
              fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em",
              padding: "1.5px 5px", borderRadius: 4,
              border: `1px solid ${badge.border}`,
              background: badge.bg, color: badge.color,
              flexShrink: 0,
              fontFamily: "'DM Mono', monospace",
            }}>
              {model.badge}
            </span>
          )}
        </div>
        {/* subtitle */}
        {model.subtitle && (
          <p style={{
            fontSize: 10.5, color: "rgba(255,255,255,0.28)",
            margin: "0 0 3px", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {model.subtitle}
          </p>
        )}
        {/* meta */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { icon: "▣", label: model.quality },
            { icon: "◷", label: `${model.durationMin}s–${model.durationMax}s` },
          ].map(({ icon, label }) => (
            <span key={label} style={{
              fontSize: 10.5, color: "rgba(255,255,255,0.28)",
              fontFamily: "'DM Mono', monospace",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              {icon} {label}
            </span>
          ))}
        </div>
      </div>

      {/* checkmark */}
      <div style={{
        width: 18, flexShrink: 0,
        color: "rgba(255,255,255,0.5)",
        opacity: isSelected ? 1 : 0,
        transition: "opacity 0.15s",
      }}>
        <CheckIcon />
      </div>
    </button>
  )
}

// ─── Main selector ────────────────────────────────────────────────────────────
export function ModelSelector({ models = MODELS, defaultId = 1, onChange }) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(defaultId)
  const [query, setQuery] = useState("")
  const ref = useRef(null)

  const selected = models.find(m => m.id === selectedId) || models[0]

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = query.trim()
    ? models.filter(m =>
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        (m.badge && m.badge.toLowerCase().includes(query.toLowerCase()))
      )
    : models

  const handleSelect = (model) => {
    setSelectedId(model.id)
    setOpen(false)
    setQuery("")
    onChange?.(model)
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "5px 10px 5px 7px",
          borderRadius: 10,
          border: open
            ? "1px solid rgba(255,255,255,0.14)"
            : "1px solid rgba(255,255,255,0.08)",
          background: open
            ? "rgba(255,255,255,0.07)"
            : "rgba(255,255,255,0.04)",
          cursor: "pointer",
          transition: "all 0.15s",
          color: "rgba(255,255,255,0.85)",
        }}
      >
        <ModelAvatar model={selected} size={26} />
        <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>
          {selected.name}
        </span>
        <span style={{ color: "rgba(255,255,255,0.3)", marginLeft: 2, display: "flex", alignItems: "center" }}>
          <ChevronRight flip={open} />
        </span>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 8px)",
          left: 0,
          width: 320,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.09)",
          background: "rgba(14,16,18,0.97)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03) inset",
          zIndex: 9999,
          overflow: "hidden",
          animation: "dropOpen 0.18s cubic-bezier(0.16,1,0.3,1) forwards",
        }}>

          {/* ambient glow */}
          <div style={{
            position: "absolute", bottom: -18, left: "15%", right: "15%",
            height: 36, background: "rgba(120,200,255,0.15)",
            filter: "blur(28px)", borderRadius: "50%", pointerEvents: "none",
          }} />

          {/* search */}
          <label style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "9px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.28)",
            cursor: "text",
          }}>
            <SearchIcon />
            <input
              autoFocus
              placeholder="Search models..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                flex: 1, background: "transparent", border: "none",
                outline: "none", fontSize: 13,
                color: "rgba(255,255,255,0.82)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </label>

          {/* section label */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "8px 12px 4px",
            fontSize: 10.5, fontWeight: 500, letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            fontFamily: "'DM Mono', monospace",
          }}>
            <SparkleIcon /> Featured models
          </div>

          {/* list */}
          <div style={{
            overflowY: "auto",
            maxHeight: 320,
            padding: "2px 6px 8px",
            display: "flex", flexDirection: "column", gap: 2,
          }}
            className="model-list-scroll"
          >
            {filtered.length === 0 ? (
              <div style={{ padding: "20px 12px", textAlign: "center", fontSize: 12.5, color: "rgba(255,255,255,0.22)" }}>
                No models found
              </div>
            ) : (
              filtered.map((model, i) => (
                <div key={model.id} style={{
                  opacity: 0,
                  animation: `rowIn 0.2s ease forwards ${i * 0.035}s`,
                }}>
                  <ModelRow
                    model={model}
                    isSelected={model.id === selectedId}
                    onClick={() => handleSelect(model)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500;700&display=swap');
        @keyframes dropOpen {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .model-list-scroll::-webkit-scrollbar { width: 3px; }
        .model-list-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        input::placeholder { color: rgba(255,255,255,0.22); }
      `}</style>
    </div>
  )
}
