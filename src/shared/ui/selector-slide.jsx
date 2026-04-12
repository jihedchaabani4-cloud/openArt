"use client"

import React from "react"

// ─── Defaults ────────────────────────────────────────────────────────────────
const TICK_SPACING   = 14   // px between ticks
const TICKS_PER_STEP = 10   // minor ticks between each labeled step
const STEP_SPACING   = TICK_SPACING * TICKS_PER_STEP   // 140 px per step

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getLabelStyle(dist) {
  if (dist === 0) return { opacity: 1,     color: "#ffffff", transform: "scale(1.4)"  }
  if (dist === 1) return { opacity: 0.435, color: "#737475", transform: "scale(1.22)" }
  if (dist === 2) return { opacity: 0.314, color: "#737475", transform: "scale(1.11)" }
  if (dist === 3) return { opacity: 0.211, color: "#737475", transform: "scale(1.01)" }
  return               { opacity: 0.2,   color: "#737475", transform: "none"         }
}

/**
 * SelectorSlide
 *
 * A horizontal, draggable ruler / step-selector.
 *
 * @param {Object[]} steps           – Array of { label, value } objects.
 * @param {number}   defaultIndex    – Which step index is selected on mount.
 * @param {*}        value           – Controlled value (optional).
 * @param {Function} onChange        – Called with `step.value` on each change.
 * @param {string}   title           – Optional heading above the ruler.
 * @param {string}   accentColor     – CSS colour for the center cursor (default blue-500).
 * @param {number}   tickSpacing     – px between minor ticks.
 * @param {number}   ticksPerStep    – Minor ticks between each labeled step.
 */
export function SelectorSlide({
  steps = [],
  defaultIndex = 0,
  value,
  onChange,
  title,
  accentColor = "#3b82f6",  // blue-500
  tickSpacing  = TICK_SPACING,
  ticksPerStep = TICKS_PER_STEP,
}) {
  const stepSpacing = tickSpacing * ticksPerStep

  // Resolve initial index from controlled `value` if provided
  const resolveIndex = React.useCallback(
    (v) => {
      const idx = steps.findIndex((s) => s.value === v)
      return idx >= 0 ? idx : defaultIndex
    },
    [steps, defaultIndex],
  )

  const [selectedIndex, setSelectedIndex] = React.useState(() =>
    value !== undefined ? resolveIndex(value) : defaultIndex,
  )

  const dragging  = React.useRef(false)
  const startX    = React.useRef(0)
  const startOff  = React.useRef(0)
  const offsetRef = React.useRef(selectedIndex * stepSpacing)
  const [offset, setOffsetState] = React.useState(offsetRef.current)

  const totalSteps = steps.length - 1
  const totalWidth = totalSteps * stepSpacing
  const totalTicks = totalSteps * ticksPerStep + 1

  // Sync controlled value → selectedIndex
  React.useEffect(() => {
    if (value === undefined) return
    const idx = resolveIndex(value)
    if (idx !== selectedIndex) {
      offsetRef.current = idx * stepSpacing
      setOffsetState(offsetRef.current)
      setSelectedIndex(idx)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const snapToIndex = React.useCallback(
    (idx) => {
      const clamped = Math.max(0, Math.min(totalSteps, idx))
      offsetRef.current = clamped * stepSpacing
      setOffsetState(offsetRef.current)
      setSelectedIndex(clamped)
      onChange?.(steps[clamped]?.value)
    },
    [totalSteps, stepSpacing, steps, onChange],
  )

  // ── Pointer handlers ──────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    dragging.current = true
    startX.current   = e.clientX
    startOff.current = offsetRef.current
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!dragging.current) return
    const delta   = startX.current - e.clientX
    const raw     = startOff.current + delta
    const clamped = Math.max(0, Math.min(totalWidth, raw))
    offsetRef.current = clamped
    setOffsetState(clamped)
    const idx = Math.round(clamped / stepSpacing)
    setSelectedIndex(Math.max(0, Math.min(totalSteps, idx)))
  }

  const onPointerUp = () => {
    if (!dragging.current) return
    dragging.current = false
    const idx = Math.round(offsetRef.current / stepSpacing)
    snapToIndex(idx)
  }

  const pointerProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  }

  if (steps.length === 0) return null

  return (
    <div className="flex flex-col w-full select-none py-6">
      {title && (
        <p className="text-xl font-semibold text-white/70 text-center leading-7 tracking-[-0.2px] mb-3">
          {title}
        </p>
      )}

      {/* ── Tick ruler ── */}
      <div
        className="relative w-full h-16 overflow-hidden cursor-grab active:cursor-grabbing touch-none"
        {...pointerProps}
      >
        {/* Center cursor line */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div
            className="rounded-full"
            style={{ width: 4, height: 32, background: accentColor }}
          />
        </div>

        {/* Moving ticks */}
        <div
          className="absolute top-0 h-full flex items-center"
          style={{ left: "50%", transform: `translateX(${-offset}px)` }}
        >
          {Array.from({ length: totalTicks }).map((_, i) => {
            const isMajor = i % ticksPerStep === 0
            return (
              <div
                key={i}
                className="absolute flex flex-col items-center"
                style={{ left: i * tickSpacing }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width:      2,
                    height:     isMajor ? 24 : 16,
                    background: "rgba(255,255,255,0.12)",
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Labels ── */}
      <div
        className="relative w-full h-9 overflow-hidden touch-none mt-2.5"
        {...pointerProps}
      >
        <div
          className="absolute top-0 h-full"
          style={{ left: "50%", transform: `translateX(${-offset}px)` }}
        >
          {steps.map((step, i) => {
            const dist = Math.abs(i - selectedIndex)
            return (
              <button
                key={step.value}
                type="button"
                onClick={() => snapToIndex(i)}
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap will-change-transform cursor-pointer text-xl font-medium leading-7 tracking-[-0.2px] bg-transparent border-none p-0 transition-all duration-150"
                style={{ left: i * stepSpacing, ...getLabelStyle(dist) }}
              >
                {step.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
