"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/shared/ui/button"
import { Progress } from "@/shared/ui/progress"

// ─── Data ────────────────────────────────────────────────────────────────────
const ITEMS = [
  {
    id: "nano-banana",
    tag: "Speed",
    title: "Nano Banana Pro\nHas Arrived!",
    subtitle: "Unlock improved precision editing and control, state of the art text rendering and more with Google's latest image model. Available in all paid plans.",
    cta: "See it in action.",
    video: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776521045/Man_tilting_head_202604181500_gttli5.mp4",
    img: "https://res.cloudinary.com/dsak0vfdj/video/upload/v1776521045/Man_tilting_head_202604181500_gttli5.mp4",
  },
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
    id: "motion-control",
    tag: "Feature",
    title: "Motion Control",
    subtitle: "Upload reference footage to guide exact motion.",
    cta: "Try it now",
    video: "https://cdn.app.ltx.studio/assets/motion-control-promo-qgPXV42o.webm",
    img: "https://cdn.app.ltx.studio/assets/motion-control-promo-fR1yqxDL.webp",
  },
]

// ─── Single View Slider ─────────────────────────────────────────────────────
function SingleViewSlider({ items, isEmpty }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progressValue, setProgressValue] = useState(0)

  // Auto-play logic
  useEffect(() => {
    if (items.length <= 1) return;
    
    setProgressValue(0);
    const duration = 5000;
    const start = Date.now();
    let animationFrameId;

    const tick = () => {
      const elapsed = Date.now() - start;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgressValue(newProgress);
      
      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };
    
    animationFrameId = requestAnimationFrame(tick);

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, duration);
    
    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentIndex, items.length]);

  const activeItem = items[currentIndex];
  const cardHeight = isEmpty ? 600 : 400;

  return (
    <div 
      className="relative w-full overflow-hidden rounded-[20px] transition-all duration-500 mb-10"
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
          <div className="absolute inset-0 z-0 bg-black">
            <img 
              src={activeItem.img} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700" 
            />
            <video
              src={activeItem.video}
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
          <div className="relative z-20 p-10 flex flex-col items-start gap-3">
            <h2 className="text-4xl md:text-[44px] font-medium text-white m-0 tracking-tight leading-[1.1] whitespace-pre-line">
              {activeItem.title}
            </h2>
            <p className="text-[15px] md:text-base text-white/90 m-0 max-w-[600px] leading-relaxed">
              {activeItem.subtitle}
            </p>
            <Button className="mt-4 px-5 py-2 h-auto rounded-full w-fit bg-white text-black text-[13px] font-medium cursor-pointer transition-all hover:bg-white/90 hover:scale-105 active:scale-95 flex items-center gap-2">
              {activeItem.cta}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-8 left-10 z-30 flex gap-2">
          {items.map((_, i) => (
            <div 
              key={i} 
              onClick={() => {
                if (i !== currentIndex) setCurrentIndex(i);
              }}
              className={`relative h-[3px] overflow-hidden rounded-full cursor-pointer transition-all duration-500 ${
                i === currentIndex ? 'w-16 bg-white/20' : 'w-16 bg-white/30 hover:bg-white/50'
              }`} 
            >
              {/* Completed state for previous slides */}
              {i < currentIndex && (
                <div className="absolute inset-0 bg-white" />
              )}
              
              {/* Animating state for current slide */}
              {i === currentIndex && (
                <Progress 
                  value={progressValue} 
                  className="h-full w-full bg-transparent [&>[data-slot=progress-indicator]]:bg-white" 
                />
              )}
            </div>
          ))}
        </div>
      )}
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
