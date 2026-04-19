"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { Button } from "@/shared/ui/button"

// ─── Data ────────────────────────────────────────────────────────────────────
const ITEMS = [
  {
    id: "ltx-23",
    tag: "New model",
    title: "LTX-2.3",
    subtitle: "Next-generation quality, now supporting portrait.",
    cta: "Try it now",
    video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776522212/video-upscale-featured_fedjmv.mov",
    img: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776522212/video-upscale-featured_fedjmv.mov",
  },
  {
    id: "scaling",
    tag: "Enterprise",
    title: "Scaling",
    subtitle: "Scale your content with Dubbing and Captions. Available for Enterprise Plans.",
    cta: "Book a demo",
    video: "https://cdn.app.ltx.studio/assets/scaler-promo-qgPXV42o.webm",
    img: "https://cdn.app.ltx.studio/assets/scaler-promo-fR1yqxDL.webp",
  },
  {
    id: "nano-banana",
    tag: "Speed",
    title: "Nano Banana 2",
    subtitle: "More speed. Sharper text. Stronger consistency.",
    cta: "Try it now",
    video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776521045/Man_tilting_head_202604181500_gttli5.mp4",
    img: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776521045/Man_tilting_head_202604181500_gttli5.mp4",
  },
  {
    id: "motion-control",
    tag: "Feature",
    title: "Motion Control",
    subtitle: "Upload reference footage to guide exact motion.",
    cta: "Try it now",
    video: "https://cdn.app.ltx.studio/assets/motion-control-promo-qgPXV42o.webm",
    img: "https://cdn.app.ltx.studio/assets/motion-control-promo-fR1yqxDL.webp",
  },
]

// ─── Card ─────────────────────────────────────────────────────────────────────
function TickerCard({ item, width }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      draggable={false}
      className="relative flex flex-col justify-end shrink-0 cursor-pointer overflow-hidden rounded-[22px] bg-[#0e0f11] border border-white/10 group select-none pointer-events-auto"
      style={{
        width,
        height: 400,
      }}
    >
      {/* Background Media */}
      <div className="absolute inset-0 z-0">
        <img 
          src={item.img} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700" 
        />
        <video
          src={item.video}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
        />
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 z-10 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative z-20 p-8 flex flex-col items-flex-start gap-2">
        <h2 className="text-3xl font-bold text-white m-0 tracking-tight">
          {item.title}
        </h2>
        <p className="text-sm text-white/70 m-0 max-w-[80%] leading-relaxed line-clamp-2">
          {item.subtitle}
        </p>
        <Button className="mt-4 px-5 py-2 rounded-full w-fit bg-white/10 border border-white/20 text-white text-sm font-semibold cursor-pointer backdrop-blur-xl transition-all hover:bg-white/20 hover:border-white/30">
          {item.cta}
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Draggable Slider Row ─────────────────────────────────────────────────────
function DraggableRow({ items, gap = 16 }) {
  const containerRef = useRef(null)
  const [cardWidth, setCardWidth] = useState(0)
  const cardWidthRef = useRef(0)

  const xSpring = useSpring(0, { stiffness: 300, damping: 35, mass: 1 })
  const rawX = useRef(0)

  const isDragging = useRef(false)
  const startPointerX = useRef(0)
  const startRawX = useRef(0)
  const velTracker = useRef({ x: 0, t: 0 })
  const lastVel = useRef(0)

  const measuredRef = useCallback((node) => {
    if (!node) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      const cw = Math.floor(w * 0.98)
      cardWidthRef.current = cw
      setCardWidth(cw)
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  function maxScroll() {
    const total = items.length * (cardWidthRef.current + gap) - gap
    const visible = containerRef.current?.offsetWidth ?? 0
    return Math.max(0, total - visible)
  }

  function clamp(val) {
    return Math.min(0, Math.max(-maxScroll(), val))
  }

  function onPointerDown(e) {
    isDragging.current = false
    startPointerX.current = e.clientX
    startRawX.current = rawX.current
    velTracker.current = { x: e.clientX, t: performance.now() }
    lastVel.current = 0

    const move = (me) => {
      const dx = me.clientX - startPointerX.current
      if (!isDragging.current && Math.abs(dx) > 4) {
        isDragging.current = true
      }
      if (!isDragging.current) return

      const now = performance.now()
      const dt = now - velTracker.current.t
      lastVel.current = dt > 0 ? (me.clientX - velTracker.current.x) / dt : 0
      velTracker.current = { x: me.clientX, t: now }

      rawX.current = clamp(startRawX.current + dx)
      xSpring.set(rawX.current)
    }

    const up = (ue) => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)

      if (!isDragging.current) return

      // Reduced momentum for less "free" feel
      const momentum = lastVel.current * 100
      const target = rawX.current + momentum

      // Snapping logic
      const totalItemWidth = cardWidthRef.current + gap
      const nearestIndex = Math.round(target / -totalItemWidth)
      const snappedX = clamp(-nearestIndex * totalItemWidth)

      rawX.current = snappedX
      xSpring.set(snappedX)
      isDragging.current = false
    }

    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  function onClickCapture(e) {
    if (isDragging.current) e.preventDefault()
  }

  if (cardWidth === 0) {
    return (
      <div 
        ref={(node) => { containerRef.current = node; measuredRef(node) }}
        className="w-full h-[320px] mb-10" 
      />
    )
  }

  return (
    <div
      ref={(node) => { containerRef.current = node; measuredRef(node) }}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
      className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing select-none touch-pan-y mb-10"
    >
      <motion.div
        className="flex max-content will-change-transform"
        style={{
          x: xSpring,
          gap,
        }}
      >
        {items.map((item, i) => (
          <TickerCard key={`${item.id}-${i}`} item={item} width={cardWidth} />
        ))}
      </motion.div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function MarqueeTicker() {
  return (
    <div className="flex flex-col gap-[10px] w-full overflow-hidden">
      <DraggableRow items={ITEMS} gap={16} />
    </div>
  )
}

export default MarqueeTicker
