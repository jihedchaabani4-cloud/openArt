"use client"

import * as React from "react"
import { Loader2, AlertCircle, AlertTriangle, X, Trash2 } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export default function ImageStatusView({
  status,
  src,
  alt = "",
  label,
  aspect = "9/16",
  className,
  rounded = "rounded-sm",
  showOverlay = true,
  onCancel,
  error,
  children,
}) {
  const [isMediaLoaded, setIsMediaLoaded] = React.useState(false)
  const [isInView, setIsInView] = React.useState(false)
  const containerRef = React.useRef(null)
  
  // Reset loading/inView state if src changes
  React.useEffect(() => {
    setIsMediaLoaded(false)
    setIsInView(false)
  }, [src])

  // Lazy load: observe when element enters viewport
  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect() // Only need to trigger once
        }
      },
      { rootMargin: "200px" } // Pre-load 200px before entering viewport
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [src])

  const isCompleted = status === "completed"
  const isProcessing = status === "processing" || status === "pending" || status === "uploading"
  const isUploading = status === "uploading"
  const isFailed = status === "failed" || status === "error"
  const isRejected = status === "rejected"
  
  const containerStyle = Object.assign(
    { aspectRatio: aspect },
    isProcessing ? { backgroundColor: "#1C1E207A" } : {}
  )

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden  transition-all duration-300",
        rounded,
        className
      )}
      style={containerStyle}
    >
      {isCompleted && src ? (
        <div className="w-full h-full relative">
          {/* Media Skeleton Loader — shows while not in view OR while media is loading */}
          {(!isInView || !isMediaLoaded) && (
            <div className="absolute inset-0 z-0 bg-white/5 animate-pulse flex items-center justify-center">
              {isInView && (
                <div className="w-1/3 aspect-square rounded-full border-2 border-white/5 border-t-white/20 animate-spin" />
              )}
            </div>
          )}
          
          {/* Media — only rendered once in viewport */}
          {isInView && (
            <div className={cn(
              "w-full h-full transition-opacity duration-500",
              isMediaLoaded ? "opacity-100" : "opacity-0"
            )}>
              {children ? (
                // Clone children to inject loading handlers for videos/etc
                React.Children.map(children, child => {
                  if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                      onLoadedData: () => setIsMediaLoaded(true),
                      onLoad: () => setIsMediaLoaded(true),
                      onError: () => setIsMediaLoaded(true),
                    });
                  }
                  return child;
                })
              ) : (
                <img
                  src={src}
                  alt={alt}
                  onLoad={() => setIsMediaLoaded(true)}
                  onError={() => setIsMediaLoaded(true)}
                  className="w-full h-full object-cover transition-transform duration-700"
                />
              )}
            </div>
          )}
        </div>
      ) : isProcessing ? (
        <div className="w-full h-full relative bg-[#202124] shimmer-box overflow-hidden">
          <section className="absolute inset-0 flex flex-col justify-between gap-4 p-4 z-10">
            <header className="flex justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 py-1.5 px-2.5 min-w-9 min-h-9 rounded-full ring ring-inset ring-white/10 bg-white/5 text-white">
                  <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                  <span className="text-[12px] font-medium tracking-wide">
                    {isUploading ? 'Uploading...' : 'Processing'}
                  </span>
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
        <div 
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-6 text-center backdrop-blur-[80px]"
          style={{ 
            background: 'linear-gradient(rgba(28, 28, 28, 0.8) 0%, rgba(45, 45, 45, 0.8) 100%)',
            color: 'rgba(255, 255, 255, 0.9)'
          }}
        >
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
            className="button button-md button-primary bg-[#FFFFFF1F] hover:bg-[#FFFFFF2F] transition-colors flex items-center gap-2 px-4 py-2 rounded-md text-white"
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
          className="absolute inset-0 z-10 flex flex-col justify-between p-5 text-left backdrop-blur-[80px]"
          style={{ 
            background: 'linear-gradient(rgba(28, 28, 28, 0.8) 0%, rgba(45, 45, 45, 0.8) 100%)',
            color: 'rgba(255, 255, 255, 0.9)'
          }}
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
                className="flex items-center justify-center w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
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





      {label && (
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-mono tracking-wider uppercase text-white/70">
              {label}
            </span>
            {isFailed && (
              <span className="px-2 py-1 rounded-md bg-red-500/20 backdrop-blur-md border border-red-500/20 text-[9px] font-mono tracking-wider uppercase text-red-400">
                Error
              </span>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .shimmer-box {
          background-image: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 3s infinite linear;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
            
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  )
}
