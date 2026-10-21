"use client";

/**
 * [FSD Layer: components/cinema-studio/common]
 * Skiper91 – Video Player 002 (faithful hand-crafted implementation).
 *
 * Public API:
 *   <Skiper91 src={string | null} />
 *
 * Features:
 *   - Click-to-play / pause directly on the video canvas
 *   - Spring-animated play/pause overlay (framer-motion)
 *   - Hover-reveal control bar (spring fade + slide)
 *   - Stretchable scrubber: expands on hover via Tailwind group
 *   - Hover-time timestamp tooltip over the progress track
 *   - Mute toggle
 *   - No console.* — structured logger is the caller's concern
 */

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

// ─── helpers ───────────────────────────────────────────────────────────────

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Skiper91 ──────────────────────────────────────────────────────────────

/**
 * @param {{ src: string | null, className?: string }} props
 */
export function Skiper91VideoPlayer({ src, className }) {
  const videoRef = useRef(null);
  const trackRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0); // 0–100
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Hover-time tooltip
  const [hoverTime, setHoverTime] = useState(null); // seconds | null
  const [hoverX, setHoverX] = useState(0); // px offset within track

  // ── playback ──────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    if (isPlaying) {
      v.pause();
    } else {
      v.play();
    }
    setIsPlaying((p) => !p);
  }, [isPlaying, src]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  }, []);

  const handleEnded = useCallback(() => setIsPlaying(false), []);

  // ── scrubber ──────────────────────────────────────────────────────────
  const handleSeek = useCallback((e) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const val = Number(e.target.value);
    v.currentTime = (val / 100) * v.duration;
    setProgress(val);
  }, []);

  const handleTrackMouseMove = useCallback(
    (e) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect || !duration) return;
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setHoverTime(ratio * duration);
      setHoverX(e.clientX - rect.left);
    },
    [duration]
  );

  // ── mute ──────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted((m) => !m);
  }, [isMuted]);

  // ── fullscreen ────────────────────────────────────────────────────────
  const handleFullscreen = useCallback(() => {
    videoRef.current?.requestFullscreen?.();
  }, []);

  // ─── render ───────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-black select-none",
        "aspect-video",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setHoverTime(null);
      }}
    >
      {/* ── video element ─────────────────────────────────────────── */}
      {src ? (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain cursor-pointer"
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onClick={togglePlay}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
          No video source
        </div>
      )}

      {/* ── center play/pause overlay ─────────────────────────────── */}
      <AnimatePresence>
        {!isPlaying && src && (
          <motion.div
            key="play-overlay"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-full border border-white/20">
              <Play className="size-9 fill-white text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── control bar ───────────────────────────────────────────── */}
      <motion.div
        initial={false}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 12,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10
                   bg-gradient-to-t from-black/85 via-black/40 to-transparent
                   flex flex-col gap-2 pointer-events-auto"
      >
        {/* scrubber */}
        <div
          ref={trackRef}
          className="relative flex items-center w-full group/slider cursor-pointer"
          style={{ height: "20px" }}
          onMouseMove={handleTrackMouseMove}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* hover-time tooltip */}
          <AnimatePresence>
            {hoverTime !== null && (
              <motion.span
                key="hover-time"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                className="absolute -top-7 text-[11px] text-white bg-black/70
                           px-1.5 py-0.5 rounded pointer-events-none"
                style={{ left: Math.max(0, hoverX - 16) }}
              >
                {formatTime(hoverTime)}
              </motion.span>
            )}
          </AnimatePresence>

          {/* invisible range input for a11y + interaction */}
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={handleSeek}
            aria-label="video progress"
            className="absolute inset-0 w-full opacity-0 z-10 cursor-pointer"
          />

          {/* visual track — stretchable on hover */}
          <div
            className="w-full rounded-full bg-white/20 overflow-hidden
                       transition-all duration-200
                       h-[5px] group-hover/slider:h-[9px]"
          >
            <motion.div
              className="h-full bg-white rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ type: "tween", duration: 0.05 }}
            />
          </div>
        </div>

        {/* buttons row */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-1">
            {/* play/pause */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="p-2 rounded-full hover:bg-white/15 transition-colors"
            >
              {isPlaying
                ? <Pause className="size-4 fill-white text-white" />
                : <Play className="size-4 fill-white text-white" />}
            </button>

            {/* mute */}
            <button
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="p-2 rounded-full hover:bg-white/15 transition-colors"
            >
              {isMuted
                ? <VolumeX className="size-4" />
                : <Volume2 className="size-4" />}
            </button>

            {/* time */}
            <span className="text-[11px] text-white/70 tabular-nums ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* fullscreen */}
          <button
            onClick={handleFullscreen}
            aria-label="Fullscreen"
            className="p-2 rounded-full hover:bg-white/15 transition-colors"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
