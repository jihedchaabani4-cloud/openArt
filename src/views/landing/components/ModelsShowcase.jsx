"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WORDS = ["Image", "Video", "3D", "Creative", "AI", "Generative"];

const ICONS = {
  nanobana:   "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/minimax.svg",
  google:     "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/google.svg",
  gpt:        "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/openai.svg",
  seedream:   "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/baichuan.svg",
  seedance:   "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/baichuan.svg",
  zimage:     "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/zhipu.svg",
  kling:      "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/kling.svg",
  runway:     "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/runway.svg",
  wan:        "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/runway.svg",
  hailuo:     "https://unpkg.com/@lobehub/icons-static-svg@latest/icons/minimax-color.svg",
};

const SHOWCASE_MODELS = [
  { name: "Nanobana", iconUrl: ICONS.nanobana },
  { name: "Google", iconUrl: ICONS.google },
  { name: "GPT", iconUrl: ICONS.gpt },
  { name: "Seedream", iconUrl: ICONS.seedream },
  { name: "Seedance", iconUrl: ICONS.seedance },
  { name: "ZImage", iconUrl: ICONS.zimage },
  { name: "Kling", iconUrl: ICONS.kling },
  { name: "Runway", iconUrl: ICONS.runway },
  { name: "Wan", iconUrl: ICONS.wan },
  { name: "Hailuo", iconUrl: ICONS.hailuo },
];

const DUPLICATED_MODELS = [...SHOWCASE_MODELS, ...SHOWCASE_MODELS, ...SHOWCASE_MODELS];

export function ModelsShowcase() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prevIndex) => (prevIndex + 1) % WORDS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-28 z-30 w-full flex flex-col items-center justify-center text-center overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12">
        {/* Headline Animé */}
        <motion.h2
          layout
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            layout: { type: "spring", stiffness: 50, damping: 18 },
            opacity: { duration: 0.8 },
            y: { duration: 0.8 },
          }}
          className="text-3xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight leading-[1.1] text-white mb-16 h-[2.2em] md:h-auto"
        >
          The industry's best{" "}
          <span className="inline-flex relative overflow-hidden align-middle h-[1.25em] text-left">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={WORDS[wordIndex]}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -24, opacity: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="block text-white"
              >
                {WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </span>{" "}
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 100, damping: 18 }}
            className="inline-block"
          >
            models.
          </motion.span>
          <br />
          <span className="text-white/40">In one subscription.</span>
        </motion.h2>

        {/* Container du Carrousel avec masques d'estompement (fade) sur les côtés */}
        <div className="relative w-full overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_10%,_black_90%,transparent_100%)]">
          <motion.div
            className="flex w-max gap-x-12 items-center"
            animate={{ x: ["0%", "-33.33%"] }}
            transition={{
              ease: "linear",
              duration: 25,
              repeat: Infinity,
            }}
          >
            {DUPLICATED_MODELS.map((model, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2.5 group cursor-default text-white/45 hover:text-white transition-colors duration-300 shrink-0"
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <img
                    src={model.iconUrl}
                    alt={model.name}
                    className="w-5 h-5 object-contain opacity-45 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 pointer-events-none invert brightness-200"
                  />
                </div>
                <span className="text-sm md:text-[15px] font-bold tracking-tight">
                  {model.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
