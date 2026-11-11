"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Helper to get an image URL from a video URL (Cloudinary specific)
const getPosterUrl = (videoUrl, imgUrl) => {
  if (imgUrl && (imgUrl.endsWith(".mp4") || imgUrl.endsWith(".mov") || imgUrl.endsWith(".webm"))) {
    if (imgUrl.includes("cloudinary.com")) {
      return imgUrl.replace(/\.(mp4|mov|webm)$/i, ".jpg");
    }
  }
  return imgUrl;
};

// ─── Video with image fallback until ready ────────────────────────────────────
function VideoWithFallback({ src, poster }) {
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    setVideoReady(false)
    const v = videoRef.current
    if (v && v.readyState >= 3) setVideoReady(true)
  }, [src])

  const finalPoster = getPosterUrl(src, poster)

  return (
    <>
      <img
        src={finalPoster}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
      />

      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={() => setVideoReady(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  )
}

// ─── Data ────────────────────────────────────────────────────────────────────
const ITEMS = [
  {
    id: "nano-banana",
    tag: "New Model",
    title: "Nano Banana Pro\nHas Arrived",
    subtitle:
      "State of the art image generation with sharper edits, cleaner text, and cinematic detail.",
    cta: "Explore",
    video:
      "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776521045/Man_tilting_head_202604181500_gttli5.mp4",
    img:
      "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776521045/Man_tilting_head_202604181500_gttli5.mp4",
  },
  {
    id: "motion-control",
    tag: "Motion Control",
    title: "Direct Every\nMovement",
    subtitle:
      "Upload reference footage to guide motion with precision and consistency.",
    cta: "Try now",
    video:
      "https://res.cloudinary.com/dsak0vfdj/video/upload/v1779180205/motion-control-promo-B__blXC9_lpfe4j.webm",
    img:
      "https://res.cloudinary.com/dsak0vfdj/video/upload/v1779180205/motion-control-promo-B__blXC9_lpfe4j.webm",
  },
  {
    id: "story-consistency",
    tag: "Consistency",
    title: "Keep Your\nStory Cohesive",
    subtitle:
      "Maintain character identity, visual style, and cinematic continuity across every scene.",
    cta: "Discover",
    video:
      "https://res.cloudinary.com/dsak0vfdj/video/upload/v1779040843/0ad7a436-9a7d-4391-bf3a-ba1a400d6218_fuzcla.mp4",
    img:
      "https://res.cloudinary.com/dsak0vfdj/video/upload/v1779040843/0ad7a436-9a7d-4391-bf3a-ba1a400d6218_fuzcla.mp4",
  },
  {
    id: "cinematic-flow",
    tag: "Cinematic",
    title: "Turn Ideas Into\nCinematic Stories",
    subtitle:
      "Create fluid, professional AI visuals designed for modern storytelling.",
    cta: "Create",
    video:
      "https://res.cloudinary.com/dsak0vfdj/video/upload/v1779040853/hf_20260331_191037_04f72a6e-7458-4618-95c0-faf27fc34172_mzuihp.mp4",
    img:
      "https://res.cloudinary.com/dsak0vfdj/video/upload/v1779040853/hf_20260331_191037_04f72a6e-7458-4618-95c0-faf27fc34172_mzuihp.mp4",
  },
];

// ─── Single View Slider ─────────────────────────────────────────────────────
function SingleViewSlider({ items, isEmpty }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return;
    const duration = 5000;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, duration);
    return () => clearInterval(interval);
  }, [items.length]);

  const activeItem = items[currentIndex];
  const cardHeight = isEmpty ? 600 : 400;

  return (
    <div 
      className="relative w-full overflow-hidden rounded-[var(--r-xl)] border border-[var(--border-subtle)] transition-all duration-500 mb-10 bg-[var(--bg-root)]"
      style={{ height: cardHeight }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={activeItem.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full flex flex-col justify-end group select-none pointer-events-auto"
        >
          {/* Background Media */}
          <div className="absolute inset-0 z-0 bg-[var(--bg-root)]">
            <VideoWithFallback src={activeItem.video} poster={activeItem.img} />
          </div>

          {/* Overlays */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Content */}
          <div className="relative z-20 p-6 flex flex-col items-start gap-3">
            <h2 className="text-4xl md:text-[44px] font-display font-medium text-[var(--text-primary)] m-0 tracking-tight leading-[1.1] whitespace-pre-line">
              {activeItem.title}
            </h2>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function MarqueeTicker({ isEmpty }) {
  return (
    <div className="flex flex-col w-full overflow-hidden">
      <SingleViewSlider items={ITEMS} isEmpty={isEmpty} />
    </div>
  )
}

export default MarqueeTicker
