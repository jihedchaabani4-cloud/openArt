"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui/button";
import { LoginDialog } from "@/components/LoginDialog";
import { useAuthSession } from "@/shared/api/auth";
import { Loader2 } from "lucide-react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Level Labs";

const showcaseVideos = [
  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1778928775/hf_20260331_191130_a9d02a6e-1e68-4109-99aa-e0cda5a44dfb_rhhq_mtfii8.mp4",
  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1778936591/76b88693-695f-45fe-99a8-1f460ff04fb3_oom74v.mp4",
  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1779040861/b4543834-64ab-412b-95a7-5af00e39d591_qasyj0.mp4",
  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1779040876/original-80071a533bd3c78d18f93bf70c273d1a_zmzwwy.mp4",
  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1779040853/hf_20260331_191037_04f72a6e-7458-4618-95c0-faf27fc34172_mzuihp.mp4",
  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1779040843/0ad7a436-9a7d-4391-bf3a-ba1a400d6218_fuzcla.mp4",
  "https://res.cloudinary.com/dsak0vfdj/video/upload/q_auto:low,f_auto,w_360/v1779040859/hf_20260331_185422_f1d47845-13f3-4f21-b3a5-f06a5b70e09a_sepayv.mp4",
];

const MEDIA_ITEMS = Array.from({ length: 24 }).map((_, i) => ({
  id: i + 1,
  isVideo: true,
  url: showcaseVideos[i % showcaseVideos.length],
}));

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
  { key: "realtime-canvas", src: "realtime-canvas", width: 200, height: 150 },
  { key: "lipsync", src: "lipsync", width: 200, height: 150 },
];

const SHOWCASE_MODELS = [
  { name: "Veo 3.1", icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a7 7 0 1 0 10 10" /><circle cx="12" cy="12" r="3" /></svg>
  )},
  { name: "Ideogram", icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" /><path d="M12 2v20M2 12h20" /></svg>
  )},
  { name: "Runway", icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /><path d="M12 6v12M9 9h6" /></svg>
  )},
  { name: "Luma", icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
  )},
  { name: "Flux", icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" /></svg>
  )},
  { name: "Gemini", icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z" /></svg>
  )},
  { name: "Krea 1", icon: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="currentColor" /></svg>
  )}
];

const DUPLICATED_MODELS = [...SHOWCASE_MODELS, ...SHOWCASE_MODELS, ...SHOWCASE_MODELS];

const WORDS = ["Image", "Video", "3D", "Creative", "AI", "Generative"];

export default function HomePage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const router = useRouter();
  const { data: user, isLoading: authLoading } = useAuthSession();
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prevIndex) => (prevIndex + 1) % WORDS.length);
    }, 10800);
    return () => clearInterval(interval);
  }, []);

  const renderBentoPhoto = (_, { photo, width, height }) => (
    <div
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
          className="w-full h-full rounded-[24px] overflow-hidden relative border border-white/10 bg-[#0d0d0d] group shadow-2xl flex items-center justify-center"
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
          className="w-full h-full rounded-[24px] overflow-hidden relative border border-white/5 bg-[#ffffff] p-5 flex flex-col items-center justify-center text-black shadow-2xl"
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
          className="w-full h-full rounded-[24px] overflow-hidden relative border border-white/5 bg-[#ffffff] p-5 flex flex-col items-center justify-center text-black shadow-2xl"
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
          <div className="relative h-[48%] rounded-[24px] overflow-hidden border border-white/10 bg-[#0d0d0d] group shadow-2xl flex flex-col items-center justify-center text-white">
            <img src="https://s.krea.ai/eye-macro.webp" className="absolute z-0 h-full w-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-700 pointer-events-none" loading="lazy" alt="" />
            <div className="absolute inset-0 bg-black/15 z-10 pointer-events-none" />
            <span className="relative z-20 text-3xl font-extrabold tracking-tight leading-none">4K</span>
            <span className="relative z-20 text-[9px] font-semibold text-white/80 mt-0.5 text-center leading-none">Native image generation</span>
          </div>

          {/* Bottom: Minimalist UI */}
          <div className="relative h-[48%] rounded-[24px] overflow-hidden border border-white/10 bg-[#0a0a0a] group flex items-center justify-center p-3 shadow-2xl">
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
          className="w-full h-full rounded-[24px] overflow-hidden relative border border-white/10 bg-[#0d0d0d] group shadow-2xl flex flex-col items-center justify-center text-white"
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
          <div className="relative h-[48%] rounded-[24px] overflow-hidden border border-white/5 bg-[#ffffff] p-3 flex flex-col items-center justify-center text-black shadow-2xl">
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-br from-neutral-950 to-neutral-600 bg-clip-text text-transparent">Do not train</span>
            <span className="text-[9px] font-bold text-black/50 mt-0.5 text-center leading-tight">Safely generate proprietary data</span>
          </div>

          {/* Bottom: 64+ Models */}
          <div className="relative h-[48%] rounded-[24px] overflow-hidden border border-white/5 bg-[#ffffff] p-3 flex flex-col items-center justify-center text-black shadow-2xl">
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
          className="w-full h-full rounded-[24px] overflow-hidden relative border border-white/10 bg-[#0d0d0d] group shadow-2xl flex flex-col justify-between"
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
          className="w-full h-full rounded-[24px] overflow-hidden relative border border-white/5 bg-[#ffffff] shadow-2xl flex flex-col items-center justify-between text-black p-4"
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
            {/* Moving Hands */}
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
          className="w-full h-full rounded-[24px] overflow-hidden relative border border-white/10 bg-[#0d0d0d] group shadow-2xl flex flex-col justify-between"
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
          className="w-full h-full rounded-[24px] overflow-hidden relative border border-white/10 bg-[#0d0d0d] group shadow-2xl flex flex-col justify-between"
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
          className="w-full h-full rounded-[24px] overflow-hidden relative border border-white/5 bg-[#ffffff] shadow-2xl flex flex-col justify-between text-black p-4"
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

      {photo.key === "realtime-canvas" && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full h-full rounded-[24px] overflow-hidden relative border border-white/10 bg-[#0d0d0d] shadow-2xl flex flex-col justify-between p-1 gap-1"
        >
          <div className="relative h-[48%] rounded-2xl overflow-hidden bg-black group border border-white/5">
            <img src="https://s.krea.ai/realtimeBase.webp" className="absolute top-0 left-0 z-0 h-full w-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 pointer-events-none" loading="lazy" alt="" />
            <img src="https://www.krea.ai/_app/48bb267943e0aab3/immutable/assets/realtimeOverlay.Dw-O4V0Z.png" className="absolute top-0 left-0 z-10 h-full w-full object-cover pointer-events-none" loading="lazy" alt="" />
            <div className="absolute inset-0 bg-black/15 z-20 pointer-events-none" />
            <span className="relative z-30 mx-auto text-center text-[10px] font-bold text-white pt-2 block tracking-tight">Realtime Canvas</span>
          </div>

          <div className="relative h-[50%] rounded-2xl overflow-hidden bg-[#ffffff] p-2 flex flex-col items-center justify-between text-black border border-white/5 shadow-inner">
            <span className="text-[10px] font-bold tracking-tight bg-gradient-to-br from-neutral-950 to-neutral-600 bg-clip-text text-transparent">Text to 3D</span>
            <div className="relative w-8 h-8 my-0.5" style={{ perspective: "100px" }}>
              <div className="w-full h-full relative flex items-center justify-center animate-[spin_8s_linear_infinite]" style={{ transformStyle: "preserve-3d" }}>
                <div className="absolute inset-0 border border-neutral-300 bg-neutral-100 rounded-sm" style={{ transform: "rotateY(0deg) translateZ(16px)", opacity: 0.9 }} />
                <div className="absolute inset-0 border border-neutral-300 bg-neutral-200 rounded-sm" style={{ transform: "rotateY(90deg) translateZ(16px)", opacity: 0.95 }} />
                <div className="absolute inset-0 border border-neutral-300 bg-neutral-100 rounded-sm" style={{ transform: "rotateX(90deg) translateZ(16px)", opacity: 0.9 }} />
              </div>
            </div>
            <span className="text-[7.5px] text-neutral-500 font-bold tracking-tight">Generate mesh</span>
          </div>
        </motion.div>
      )}
    </div>
  );

  useEffect(() => {
    if (user) {
      router.replace("/cinema-studio");
    }
  }, [user, router]);

  const handleCTA = () => {
    if (user) {
      router.push("/cinema-studio");
    } else {
      setLoginOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] overflow-x-hidden font-sans scroll-smooth text-white">

      {/* ─── Hero Section ─── */}
      <section className="relative h-screen overflow-hidden">

        {/* ─── Background Masonry Gallery ─── */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{
            transform: "translateY(15px)",
            maskImage: "linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.08) 5%, rgba(0, 0, 0, 0.2) 10%, rgba(0, 0, 0, 0.95) 25%, rgba(0, 0, 0, 0.95) 55%, rgba(0, 0, 0, 0.3) 80%, rgba(0, 0, 0, 0) 100%)",
            WebkitMaskImage: "linear-gradient(rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.08) 5%, rgba(0, 0, 0, 0.2) 10%, rgba(0, 0, 0, 0.95) 25%, rgba(0, 0, 0, 0.95) 55%, rgba(0, 0, 0, 0.3) 80%, rgba(0, 0, 0, 0) 100%)",
          }}
        >
          <motion.div
            animate={{ y: [0, -40, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="columns-3 sm:columns-3 md:columns-3 xl:columns-4 gap-4 lg:gap-5 p-4 lg:p-6 opacity-70"
          >
            {MEDIA_ITEMS.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 80, scale: 0.9, rotateX: 8 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                transition={{ duration: 1.4, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.03, y: -6, transition: { duration: 0.4, ease: "easeOut" } }}
                className="group break-inside-avoid mb-3 lg:mb-4 rounded-[24px] overflow-hidden relative"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0 bg-black/10 z-10 pointer-events-none" />
                <motion.div
                  animate={{ x: ["-120%", "120%"] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: index * 0.2 }}
                  className="absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                />
                <motion.video
                  src={item.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto block object-cover will-change-transform"
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 rounded-[24px] ring-1 ring-white/10 group-hover:ring-white/20 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ─── Foreground Overlay ─── */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_20%,rgba(0,0,0,0)_80%,rgba(0,0,0,0.5)_100%)] z-10" />

          <div className="relative z-20 flex flex-col items-center text-center mt-[-10vh]">
            <div className="relative flex justify-center items-center">
              <div className="absolute w-[110%] h-[70%] bg-white/20 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute w-[80%] h-[50%] bg-white/30 blur-[120px] rounded-full pointer-events-none" />
              <h1 className="text-[100px] md:text-[140px] lg:text-[200px] font-medium text-white tracking-tighter leading-none m-0 drop-shadow-lg relative z-10 cursor-default flex items-center justify-center pointer-events-auto">
                {appName}
              </h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-2 text-xl md:text-[28px] font-medium text-white/90 max-w-2xl px-6 leading-tight"
            >
              Where the next wave of storytelling happens
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pointer-events-auto"
            >
              <Button
                onClick={!authLoading ? handleCTA : undefined}
                disabled={authLoading}
                className="mt-8 px-8 py-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl text-white text-[17px] font-semibold transition-all hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-60 disabled:cursor-default disabled:scale-100 flex items-center gap-2"
              >
                {authLoading ? (
                  <><Loader2 className="size-5 animate-spin" /> Connexion...</>
                ) : user ? (
                  "Cinema Studio"
                ) : (
                  "Se connecter"
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Intermediate Models Showcase Section ─── */}
      <section className="relative py-28 z-30 w-full bg-[#050505] flex flex-col items-center justify-center text-center overflow-hidden">
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
              transition={{ type: "spring", stiffness: 50, damping: 18 }}
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
              animate={{ x: ["0%", "-33.33%"] }} // Déplacement d'un tiers puisque nous avons triplé la liste
              transition={{
                ease: "linear",
                duration: 25, // Ajustez la vitesse ici (plus le chiffre est grand, plus c'est lent)
                repeat: Infinity,
              }}
            >
              {DUPLICATED_MODELS.map((model, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2.5 group cursor-default text-white/45 hover:text-white transition-colors duration-300 shrink-0"
                >
                  <div className="text-white/45 group-hover:text-white transition-colors duration-300">
                    {model.icon}
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

      {/* ─── Bento Grid Section ─── */}
      <section
        className="relative pb-32 px-6 md:px-12 lg:px-24 z-30 w-full"
        style={{ background: "#050505" }}
      >
        {/* Absolute Masked Background Image */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-55"
          style={{
            maskImage: "radial-gradient(circle, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0) 300%)",
            WebkitMaskImage: "radial-gradient(circle, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0) 300%)",
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

        <div className="max-w-6xl mx-auto pt-64 relative z-10">
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

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}