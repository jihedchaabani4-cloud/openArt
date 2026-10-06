"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils"
import { setCachedImageDimensions } from "@/shared/lib/displayUtils"
import { FlowErrorTile } from "@/shared/ui/FlowErrorTile"
import { ProcessingCard } from "@/shared/ui/ProcessingCard"

// Module-level cache: src → true once the image has loaded once.
// Survives component remounts (e.g. grid resize), so images never re-flash.
const MAX_LOADED_CACHE = 800;
const _loadedSrcCache = new Map();

function markSrcLoaded(src) {
  if (!src) return;
  if (_loadedSrcCache.size >= MAX_LOADED_CACHE) {
    const firstKey = _loadedSrcCache.keys().next().value;
    _loadedSrcCache.delete(firstKey);
  }
  _loadedSrcCache.set(src, true);
}

export const ImageStatusView = React.memo(function ImageStatusView({
  status,
  src,
  alt = "",
  aspect = "9/16",
  className,
  rounded = "rounded-sm",
  progress,
  isVideo = false,
  error,
  onRetry,
  onReusePrompt,
  onDelete,
  children,
}) {
  // Initialize immediately from cache so grid-resize remounts skip the fade-in
  const [isMediaLoaded, setIsMediaLoaded] = React.useState(
    () => !!(src && _loadedSrcCache.get(src))
  )

  React.useEffect(() => {
    if (src && _loadedSrcCache.get(src)) {
      setIsMediaLoaded(true)
    } else {
      setIsMediaLoaded(false)
    }
  }, [src])

  const isCompleted = status === "completed"
  const isProcessing = ["processing", "pending", "uploading"].includes(status)
  const isFailed = ["failed", "error"].includes(status)
  const isRejected = status === "rejected"

  const containerStyle = {
    aspectRatio: aspect,
    ...(isProcessing ? { backgroundColor: "#17181a" } : {}),
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white/[0.02]",
        rounded,
        className
      )}
      style={containerStyle}
    >
      <style jsx>{`
        @keyframes skeletonShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.55; }
        }
      `}</style>

      {isCompleted && src ? (
        <div className="w-full h-full relative flex items-center justify-center">
          {!isMediaLoaded && (
            <div className="absolute inset-0 z-0 bg-[#15161a] overflow-hidden pointer-events-none">
              <div 
                className="absolute inset-0 bg-[#1e2026]"
                style={{ animation: "skeletonPulse 2s ease-in-out infinite" }}
              />
              <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.04) 30%, rgba(255, 255, 255, 0.10) 50%, rgba(255, 255, 255, 0.04) 70%, transparent 100%)",
                  animation: "skeletonShimmer 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                }}
              />
            </div>
          )}

          <div className={cn(
            "w-full h-full transition-opacity duration-300 relative flex items-center justify-center",
            isMediaLoaded ? "opacity-100" : "opacity-0"
          )}>
            {children ? (
              // Clone children to inject loading handlers for videos/etc
              React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                  return React.cloneElement(child, {
                    onLoadedData: () => { markSrcLoaded(src); setIsMediaLoaded(true); },
                    onLoad: () => { markSrcLoaded(src); setIsMediaLoaded(true); },
                    onError: () => { markSrcLoaded(src); setIsMediaLoaded(true); },
                  });
                }
                return child;
              })
            ) : (
              <img
                src={src}
                alt={alt}
                loading="lazy"
                decoding="async"
                onLoad={(e) => {
                  markSrcLoaded(src);
                  setIsMediaLoaded(true);
                  if (e.currentTarget?.naturalWidth && e.currentTarget?.naturalHeight && src) {
                    setCachedImageDimensions(src, e.currentTarget.naturalWidth, e.currentTarget.naturalHeight);
                  }
                }}
                onError={() => { markSrcLoaded(src); setIsMediaLoaded(true); }}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      ) : isProcessing ? (
        <ProcessingCard
          progress={progress}
          isVideo={isVideo}
          showPlayIcon={isVideo}
          className="w-full h-full rounded-none"
        />
      ) : isFailed || isRejected ? (
        <FlowErrorTile
          error={error}
          onReusePrompt={onReusePrompt}
          onDelete={onDelete}
        />
      ) : (
        <div className="w-full h-full bg-white/5" />
      )}
    </div>
  )
})
