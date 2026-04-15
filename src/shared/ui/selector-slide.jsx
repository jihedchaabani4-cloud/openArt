"use client"

import React from "react"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
} from "framer-motion"

// ─── Defaults ────────────────────────────────────────────────────────────────
const TICK_SPACING   = 14
const TICKS_PER_STEP = 10
const STEP_SPACING   = TICK_SPACING * TICKS_PER_STEP   // 140 px per step

// ─── Spring configs ───────────────────────────────────────────────────────────
// During drag  → snappy, low mass so it feels "attached to finger"
const DRAG_SPRING = { damping: 38, stiffness: 380, mass: 0.55 }
// On snap/release → slightly heavier, gives a satisfying settle bounce
const SNAP_SPRING = { damping: 30, stiffness: 280, mass: 0.75 }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getLabelAnim(dist) {
  if (dist === 0) return { opacity: 1,     color: "#ffffff", scale: 1.4  }
  if (dist === 1) return { opacity: 0.435, color: "#737475", scale: 1.22 }
  if (dist === 2) return { opacity: 0.314, color: "#737475", scale: 1.11 }
  if (dist === 3) return { opacity: 0.211, color: "#737475", scale: 1.01 }
  return               { opacity: 0.2,   color: "#737475", scale: 1    }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function SelectorSlide({
  steps = [],
  defaultIndex = 0,
  value,
  onChange,
  title,
  accentColor  = "#3b82f6",
  tickSpacing  = TICK_SPACING,
  ticksPerStep = TICKS_PER_STEP,
}) {
  const stepSpacing = tickSpacing * ticksPerStep

  const resolveIndex = React.useCallback(
    (v) => {
      const idx = steps.findIndex((s) => s.value === v)
      return idx >= 0 ? idx : defaultIndex
    },
    [steps, defaultIndex],
  )

  const initialIndex = value !== undefined ? resolveIndex(value) : defaultIndex
  const [selectedIndex, setSelectedIndex] = React.useState(initialIndex)

  const totalSteps = steps.length - 1
  const totalWidth = totalSteps * stepSpacing
  const totalTicks = totalSteps * ticksPerStep + 1

  // ── Motion values ─────────────────────────────────────────────────────────
  // `raw`    → follows pointer instantly
  // `smooth` → springs after `raw`
  const raw    = useMotionValue(initialIndex * stepSpacing)
  const smooth = useSpring(raw, DRAG_SPRING)

  // Negated for translateX on the sliding tracks
  const negated = useTransform(smooth, (v) => -v)

  // ── Snap ─────────────────────────────────────────────────────────────────
  const snapToIndex = React.useCallback(
    (idx) => {
      const clamped = Math.max(0, Math.min(totalSteps, idx))
      const target  = clamped * stepSpacing
      animate(smooth, target, { type: "spring", ...SNAP_SPRING })
      raw.set(target)   // keep raw in sync for next drag
      setSelectedIndex(clamped)
      onChange?.(steps[clamped]?.value)
    },
    [totalSteps, stepSpacing, steps, onChange, smooth, raw],
  )

  // Sync controlled value
  React.useEffect(() => {
    if (value === undefined) return
    const idx = resolveIndex(value)
    if (idx !== selectedIndex) snapToIndex(idx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const dragging = React.useRef(false)
  const startX   = React.useRef(0)
  const startOff = React.useRef(0)

  const onPointerDown = (e) => {
    dragging.current = true
    startX.current   = e.clientX
    startOff.current = raw.get()
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!dragging.current) return
    const delta   = startX.current - e.clientX
    const clamped = Math.max(0, Math.min(totalWidth, startOff.current + delta))
    raw.set(clamped)
    const idx = Math.round(clamped / stepSpacing)
    setSelectedIndex(Math.max(0, Math.min(totalSteps, idx)))
  }

  const onPointerUp = () => {
    if (!dragging.current) return
    dragging.current = false
    const idx = Math.round(raw.get() / stepSpacing)
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

        {/* Tick track — driven by spring */}
        <motion.div
          className="absolute top-0 h-full flex items-center"
          style={{ left: "50%", x: negated }}
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
        </motion.div>
      </div>

      {/* ── Labels ── */}
      <div
        className="relative w-full h-9 overflow-hidden touch-none mt-2.5"
        {...pointerProps}
      >
        <motion.div
          className="absolute top-0 h-full"
          style={{ left: "50%", x: negated }}
        >
          {steps.map((step, i) => {
            const dist = Math.abs(i - selectedIndex)
            return (
              <motion.button
                key={String(step.value)}
                type="button"
                onClick={() => snapToIndex(i)}
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap cursor-pointer text-xl font-medium leading-7 tracking-[-0.2px] bg-transparent border-none p-0"
                style={{ left: i * stepSpacing }}
                animate={getLabelAnim(dist)}
                transition={{
                  type:      "spring",
                  damping:   26,
                  stiffness: 240,
                  mass:      0.6,
                }}
              >
                {step.label}
              </motion.button>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}