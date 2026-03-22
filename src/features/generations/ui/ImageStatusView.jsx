"use client"

import * as React from "react"
import { Loader2, AlertCircle, AlertTriangle, Image as ImageIcon, X, RefreshCw, Trash2 } from "lucide-react"
import { cn } from "@/shared/lib/utils"

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
  onRetry,
  error,
  children,
}) {
  const isCompleted = status === "completed"
  const isProcessing = status === "processing" || status === "pending"
  const isFailed = status === "failed" || status === "error"
  const isRejected = status === "rejected"
  const containerStyle = Object.assign(
    { aspectRatio: aspect },
    isProcessing ? { backgroundColor: "#1C1E207A" } : {}
  )

  return (
    <div
      className={cn(
        "relative overflow-hidden border transition-all duration-300",
        isCompleted ? "border-white/5 bg-white/5" : "",
        isProcessing ? "border-[#1C1E207A]" : "",
        isFailed ? "border-red-500/20 bg-red-500/5" : "",
        isRejected ? "border-white/10 bg-[#0F1113]" : "",
        rounded,
        className
      )}
      style={containerStyle}
    >
      {isCompleted && src ? (
        <div className="w-full h-full relative">
          {children ? children : (
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover transition-transform duration-700"
            />
          )}
        </div>
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
      ) : isRejected ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-6 text-center bg-[#0F1113]">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-semibold text-lg">Prompt Rejected</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Your prompt was flagged by our safety filters for containing sensitive or inappropriate content.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            className="button button-md button-primary bg-[#FFFFFF1F] hover:bg-[#FFFFFF2F] transition-colors flex items-center gap-2 px-4 py-2 rounded-lg text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
            Delete
          </button>
        </div>
      ) : isFailed ? (
        <div 
          className="absolute inset-0 z-10 flex flex-col justify-between p-5 text-left bg-[#141414]"
        >
          {/* Top section */}
          <div className="flex flex-col items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-white/80" />
            <div>
              <p className="text-[14px] font-semibold text-white mb-1">
                Failed
              </p>
              <p className="text-[12px] text-white/60 leading-snug pe-4">
                {error?.message || "Generation failed. Please try again or send feedback."}
              </p>
            </div>
          </div>

          {/* Bottom Right Actions */}
          <div className="flex items-center justify-end gap-2 mt-auto">
            {onCancel && (
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div 
          className="w-full h-full flex flex-col items-center justify-center gap-3 p-4 text-center"
          style={{ backgroundColor: "#e6483d99" }}
        >
          <p className="text-caption-l uppercase font-semibold font-grotesk text-white">
            Error while loading<br/>the media...
          </p>
        </div>
      )}



      {showOverlay && isCompleted && (
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
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
