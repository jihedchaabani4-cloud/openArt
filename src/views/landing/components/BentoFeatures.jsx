"use client";
import React from "react";
import { motion } from "framer-motion";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";

const bentoRow1 = [
  { key: "speed", src: "speed", width: 500, height: 180 },
  { key: "pixels", src: "pixels", width: 300, height: 180 },
  { key: "train", src: "train", width: 400, height: 180 },
];

const bentoRow2 = [
  { key: "left-stack", src: "left-stack", width: 280, height: 260 },
  { key: "flagship", src: "flagship", width: 560, height: 260 },
  { key: "right-stack", src: "right-stack", width: 280, height: 260 },
];

const bentoRow3 = [
  { key: "asset-manager", src: "asset-manager", width: 200, height: 150 },
  { key: "bleeding-edge", src: "bleeding-edge", width: 200, height: 150 },
  { key: "1000-styles", src: "1000-styles", width: 200, height: 150 },
  { key: "image-editor", src: "image-editor", width: 200, height: 150 },
  { key: "lipsync", src: "lipsync", width: 200, height: 150 },
];

export function BentoFeatures() {
  const renderBentoPhoto = (_, { photo, width, height }) => (
    <div
      key={photo.key}
      className="react-photo-album--photo"
      style={{
        width,
        height,
        "--react-photo-album--photo-width": width,
        "--react-photo-album--photo-height": height,
      }}
    >
      {photo.key === "speed" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full h-full rounded-card overflow-hidden relative border border-white/10 bg-[#0d0d0d] group shadow-2xl flex items-center justify-center"
        >
          <img src="https://s.krea.ai/light-streak.webp" className="absolute z-0 h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 pointer-events-none" loading="lazy" alt="" />
          <div className="absolute inset-0 bg-black/25 z-10 pointer-events-none" />
          <span className="relative z-20 text-center text-xl md:text-2xl font-bold leading-tight tracking-tight text-white px-4">
            Industry-leading<br />inference speed
          </span>
        </motion.div>
      )}

      {photo.key === "pixels" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="w-full h-full rounded-card overflow-hidden relative border border-white/5 bg-[#ffffff] p-5 flex flex-col items-center justify-center text-black shadow-2xl"
        >
          <span className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-neutral-950 to-neutral-600 bg-clip-text text-transparent">22K</span>
          <span className="text-[11px] font-bold text-black/50 mt-1 text-center">Pixels upscaling</span>
        </motion.div>
      )}

      {photo.key === "train" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full h-full rounded-card overflow-hidden relative border border-white/5 bg-[#ffffff] p-5 flex flex-col items-center justify-center text-black shadow-2xl"
        >
          <span className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-neutral-950 to-neutral-600 bg-clip-text text-transparent">Train</span>
          <span className="text-[10px] font-bold text-black/45 mt-1 text-center leading-snug px-1">Fine-tune models with your own data</span>
        </motion.div>
      )}

      {photo.key === "left-stack" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full h-full flex flex-col justify-between gap-2 pointer-events-auto"
        >
          {/* Top: 4K Native generation */}
          <div className="relative h-[48%] rounded-card overflow-hidden border border-white/10 bg-[#0d0d0d] group shadow-2xl flex flex-col items-center justify-center text-white">
            <img src="https://s.krea.ai/eye-macro.webp" className="absolute z-0 h-full w-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700 pointer-events-none" loading="lazy" alt="" />
            <div className="absolute inset-0 bg-black/15 z-10 pointer-events-none" />
            <span className="relative z-20 text-3xl font-extrabold tracking-tight leading-none">4K</span>
            <span className="relative z-20 text-[9px] font-semibold text-white/80 mt-0.5 text-center leading-none">Native image generation</span>
          </div>

          {/* Bottom: Minimalist UI */}
          <div className="relative h-[48%] rounded-card overflow-hidden border border-white/10 bg-[#0a0a0a] group flex items-center justify-center p-3 shadow-2xl">
            <img src="https://s.krea.ai/minimalistBase.webp" className="absolute z-0 h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 pointer-events-none" loading="lazy" alt="" />
            <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none" />
            <div className="relative z-20 text-center text-lg font-bold text-white tracking-tight">
              Minimalist UI
              <div
                className="absolute -bottom-full left-0 right-0 -scale-y-100 text-lg font-bold opacity-30 blur-[2.5px] pointer-events-none select-none"
                aria-hidden="true"
                style={{
                  background: "linear-gradient(to top, white 0%, transparent 80%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Minimalist UI
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {photo.key === "flagship" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="w-full h-full rounded-card overflow-hidden relative border border-white/10 bg-[#0d0d0d] group shadow-2xl flex flex-col items-center justify-center text-white"
        >
          <img src="https://s.krea.ai/krea1-example.webp" className="absolute z-0 h-full w-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700 pointer-events-none" loading="lazy" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent z-10 pointer-events-none" />
          <span className="relative z-20 text-5xl md:text-6xl font-extrabold tracking-tight mb-1 leading-none">Level 1</span>
          <span className="relative z-20 text-[10px] font-bold text-white/70 leading-none">Ultra-realistic flagship model</span>
        </motion.div>
      )}

      {photo.key === "right-stack" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full h-full flex flex-col justify-between gap-2 pointer-events-auto"
        >
          {/* Top: Do not train */}
          <div className="relative h-[48%] rounded-card overflow-hidden border border-white/5 bg-[#ffffff] p-3 flex flex-col items-center justify-center text-black shadow-2xl">
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-br from-neutral-950 to-neutral-600 bg-clip-text text-transparent">Do not train</span>
            <span className="text-[9px] font-bold text-black/50 mt-0.5 text-center leading-tight">Safely generate proprietary data</span>
          </div>

          {/* Bottom: 64+ Models */}
          <div className="relative h-[48%] rounded-card overflow-hidden border border-white/5 bg-[#ffffff] p-3 flex flex-col items-center justify-center text-black shadow-2xl">
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-neutral-950 to-neutral-600 bg-clip-text text-transparent">64+</span>
            <span className="text-[10px] font-bold text-black/50 mt-0.5">Models</span>
          </div>
        </motion.div>
      )}

      {photo.key === "asset-manager" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full h-full rounded-card overflow-hidden relative border border-white/10 bg-[#0d0d0d] group shadow-2xl flex flex-col justify-between"
        >
          <img src="https://s.krea.ai/asset-manager.webp" className="absolute z-0 h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 pointer-events-none" loading="lazy" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/20 to-transparent z-10 pointer-events-none" />
          <span className="relative z-20 text-[11px] md:text-xs font-bold text-white tracking-tight p-4">
            Full-fledged asset manager
          </span>
        </motion.div>
      )}

      {photo.key === "bleeding-edge" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="w-full h-full rounded-card overflow-hidden relative border border-white/5 bg-[#ffffff] shadow-2xl flex flex-col items-center justify-between text-black p-4"
        >
          <span className="text-[11px] md:text-xs font-bold tracking-tight">Bleeding Edge</span>
          <svg viewBox="0 0 200 200" className="block select-none w-[68px] h-[68px]" width="68" height="68">
            <defs>
              <filter id="shadow-blur" x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox">
                <feGaussianBlur stdDeviation="2"></feGaussianBlur>
              </filter>
              <filter id="clock-shadow" filterUnits="objectBoundingBox">
                <feGaussianBlur stdDeviation="1"></feGaussianBlur>
              </filter>
            </defs>
            <circle cx="101" cy="102" r="97" fill="#000" filter="url(#clock-shadow)" opacity="0.1"></circle>
            <circle cx="100" cy="100" r="95" className="fill-neutral-50 stroke-neutral-200" strokeWidth="1"></circle>
            <text textAnchor="middle" dominantBaseline="middle" className="fill-black font-bold" fontSize="13" x="100" y="24">12</text>
            <text textAnchor="middle" dominantBaseline="middle" className="fill-black/35 font-semibold" fontSize="12" x="180" y="101">3</text>
            <text textAnchor="middle" dominantBaseline="middle" className="fill-black/35 font-semibold" fontSize="12" x="100" y="178">6</text>
            <text textAnchor="middle" dominantBaseline="middle" className="fill-black/35 font-semibold" fontSize="12" x="22" y="101">9</text>
            <g transform="rotate(87, 100, 100)">
              <line x1="100" y1="100" x2="100" y2="50" className="stroke-neutral-800" strokeWidth="6" strokeLinecap="round"></line>
            </g>
            <g transform="rotate(326, 100, 100)">
              <line x1="100" y1="100" x2="100" y2="35" className="stroke-neutral-800" strokeWidth="4" strokeLinecap="round"></line>
            </g>
            <g className="animate-[spin_60s_linear_infinite]" style={{ transformOrigin: "100px 100px" }}>
              <line x1="100" y1="100" x2="100" y2="28" stroke="#FFC32F" strokeWidth="1.5" strokeLinecap="round"></line>
            </g>
            <circle cx="100" cy="100" r="5" fill="#FFC32F"></circle>
          </svg>
          <span className="text-[8px] text-black/55 font-bold tracking-tight text-center leading-none mb-0.5">
            Access latest models on release day
          </span>
        </motion.div>
      )}

      {photo.key === "1000-styles" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full h-full rounded-card overflow-hidden relative border border-white/10 bg-[#0d0d0d] group shadow-2xl flex flex-col justify-between"
        >
          <img src="https://s.krea.ai/isometricPromptStyles.webp" className="absolute z-0 h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 pointer-events-none" loading="lazy" alt="" />
          <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />
          <span className="relative z-20 text-[11px] md:text-xs font-bold text-white tracking-tight p-4">
            1000+ styles
          </span>
        </motion.div>
      )}

      {photo.key === "image-editor" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="w-full h-full rounded-card overflow-hidden relative border border-white/10 bg-[#0d0d0d] group shadow-2xl flex flex-col justify-between"
        >
          <img src="https://s.krea.ai/isometricEditExample.webp" className="absolute z-0 h-full w-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 pointer-events-none" loading="lazy" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/10 to-transparent z-10 pointer-events-none" />
          <span className="relative z-20 text-[11px] md:text-xs font-bold text-white tracking-tight p-4">
            Image Editor
          </span>
        </motion.div>
      )}

      {photo.key === "lipsync" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="w-full h-full rounded-card overflow-hidden relative border border-white/5 bg-[#ffffff] shadow-2xl flex flex-col justify-between text-black p-4"
        >
          <span className="text-[11px] md:text-xs font-bold tracking-tight">Lipsync</span>
          <div className="flex justify-center items-center gap-1.5 h-12 my-0.5">
            <div className="w-1 bg-neutral-900 rounded-full h-6 animate-[bounce_0.8s_infinite]" />
            <div className="w-1 bg-neutral-700 rounded-full h-10 animate-[bounce_0.6s_infinite_0.1s]" />
            <div className="w-1 bg-neutral-900 rounded-full h-8 animate-[bounce_0.7s_infinite_0.2s]" />
            <div className="w-1 bg-neutral-800 rounded-full h-5 animate-[bounce_0.9s_infinite_0.15s]" />
            <div className="w-1 bg-neutral-950 rounded-full h-9 animate-[bounce_0.5s_infinite_0.05s]" />
            <div className="w-1 bg-neutral-600 rounded-full h-6 animate-[bounce_0.8s_infinite_0.25s]" />
          </div>
          <span className="text-[8px] text-black/55 font-bold tracking-tight text-center leading-none">
            Synchronized audio
          </span>
        </motion.div>
      )}
    </div>
  );

  return (
    <section
      className="relative py-40 px-6 md:px-12 lg:px-24 z-30 w-full min-h-[150vh] flex flex-col items-center justify-center"
      style={{
        transform: "translateY(15px)",
        background: "linear-gradient(to bottom, #181819 0%, #000000 100%)",
      }}
    >
      {/* Absolute Masked Background Image */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-55"
        style={{
          maskImage: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 15%, rgba(0, 0, 0, 1) 85%, rgba(0, 0, 0, 0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 15%, rgba(0, 0, 0, 1) 85%, rgba(0, 0, 0, 0) 100%)",
        }}
      >
        <img
          src="https://storage.googleapis.com/pinhole-about-assets-prod-us/video-section/background.webp"
          alt="Background for section"
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Smooth transition overlay at the top of Section 2 */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-10"
        style={{
          height: "280px",
          background: "linear-gradient(to bottom, #050505 0%, rgba(5, 5, 5, 0) 100%)",
        }}
      />

      {/* Subtle radial glow — very faint, just enough depth */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 70%, rgba(120, 95, 65, 0.15) 0%, rgba(65, 48, 32, 0.05) 60%, transparent 100%)",
        }}
      />

      <div className="max-w-6xl w-full flex flex-col items-center justify-center mx-auto pt-8 relative z-10">
        <div className="mb-10 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold tracking-tighter text-white mb-2"
          >
            Designed for Creators
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base text-white/50 max-w-xl mx-auto font-medium"
          >
            Experience next-generation tools built with industrial-grade AI and elegant design.
          </motion.p>
        </div>

        <div className="w-full space-y-2">
          {/* Row 1 */}
          <RowsPhotoAlbum
            photos={bentoRow1}
            targetRowHeight={175}
            spacing={8}
            rowConstraints={{ singleRowMaxHeight: 280 }}
            render={{ photo: renderBentoPhoto }}
          />
          {/* Row 2 */}
          <RowsPhotoAlbum
            photos={bentoRow2}
            targetRowHeight={250}
            spacing={8}
            rowConstraints={{ singleRowMaxHeight: 320 }}
            render={{ photo: renderBentoPhoto }}
          />
          {/* Row 3 */}
          <RowsPhotoAlbum
            photos={bentoRow3}
            targetRowHeight={140}
            spacing={8}
            rowConstraints={{ singleRowMaxHeight: 280 }}
            render={{ photo: renderBentoPhoto }}
          />
        </div>
      </div>
    </section>
  );
}
