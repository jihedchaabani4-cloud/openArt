"use client"

import * as React from "react"
import { Loader2, AlertCircle, Image as ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ImageStatusView({
  status,
  src,
  alt = "",
  label,
  aspect = "9/16",
  className,
  rounded = "rounded-md",
  showOverlay = true,
  onCancel,
}) {
  const isCompleted = status === "completed"
  const isProcessing = status === "processing"
  const isFailed = status === "failed" || status === "error"
  const containerStyle = Object.assign(
    { aspectRatio: aspect },
    isProcessing ? { backgroundColor: "#1C1E207A" } : {}
  )

  return (
    <div
      className={cn(
        "relative overflow-hidden border transition-all duration-300",
        isCompleted ? "border-white/5 bg-white/5 hover:border-white/20" : "",
        isProcessing ? "border-[#1C1E207A]" : "",
        isFailed ? "border-red-500/20 bg-red-500/5" : "",
        rounded,
        className
      )}
      style={containerStyle}
    >
      {isCompleted && src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-700"
        />
      ) : isProcessing ? (
        <div className="w-full h-full relative">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="relative w-full h-full animate-pulse">
              <div
                className="absolute top-0 left-1/2 -translate-y-[85%] -translate-x-1/2 h-2/3 w-full bg-white"
                style={{ borderRadius: "100%", opacity: 0.1, filter: "blur(38px)" }}
              />
            </div>
          </div>

          <section className="absolute inset-0 flex flex-col justify-between gap-4 p-4 z-10">
            <header className="flex justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 py-1.5 px-2.5 min-w-9 min-h-9 rounded-full ring ring-inset ring-white/10 bg-white/5 text-white">
                  <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                  <span className="text-[12px] font-medium tracking-wide">Processing</span>
                </div>
              </div>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex items-center gap-2 py-1.5 px-2.5 min-w-9 min-h-9 rounded-full ring ring-inset ring-white/10 bg-white/5 text-white hover:bg-white/10 transition-opacity"
                >
                  <X className="w-4 h-4" />
                  <span className="text-[12px] font-medium">Cancel</span>
                </button>
              )}
            </header>

          </section>
        </div>
      ) : isFailed ? (
        <>
          <div 
            className="absolute inset-0 z-10 flex flex-col items-center justify-start gap-3 p-4 text-center"
            style={{ backgroundColor: "#e6483d99" }}
          >
            <p className="text-[12px] sm:text-[14px] md:text-[16px] uppercase font-bold tracking-wider text-white leading-snug">
              Error while generating
            </p>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3">
          <ImageIcon className="w-6 h-6 text-white/30" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Idle
          </span>
        </div>
      )}



      {showOverlay && isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
      )}

      {label && (
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-mono tracking-wider uppercase text-white/70">
              {label}
            </span>
            {isFailed && (
              <span className="px-2 py-1 rounded-lg bg-red-500/20 backdrop-blur-md border border-red-500/20 text-[9px] font-mono tracking-wider uppercase text-red-400">
                Error
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
