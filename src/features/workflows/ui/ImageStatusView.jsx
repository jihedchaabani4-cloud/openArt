"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export function ImageStatusView({
  status,
  src,
  alt = "",
  aspect = "9/16",
  className,
  rounded = "rounded-sm",
  error,
  children,
}) {
  const [isMediaLoaded, setIsMediaLoaded] = React.useState(false)
  const [isInView, setIsInView] = React.useState(false)
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    setIsMediaLoaded(false)
    setIsInView(false)
  }, [src])

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
  const isProcessing = ["processing", "pending", "uploading"].includes(status)
  const isFailed = ["failed", "error"].includes(status)
  const isRejected = status === "rejected"

  const containerStyle = {
    aspectRatio: aspect,
    ...(isProcessing ? { backgroundColor: "#0f1012" } : {}),
  }

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
      <style jsx>{`
        @keyframes waveDriftA {
          0% { transform: translate(-14%, -8%) scale(1); }
          50% { transform: translate(6%, 2%) scale(1.08); }
          100% { transform: translate(14%, 10%) scale(1.16); }
        }
        @keyframes waveDriftB {
          0% { transform: translate(10%, 12%) scale(1.02); }
          50% { transform: translate(-6%, 4%) scale(1.1); }
          100% { transform: translate(-14%, -6%) scale(1.18); }
        }
        @keyframes fogPulse {
          0% { opacity: 0.22; }
          50% { opacity: 0.4; }
          100% { opacity: 0.22; }
        }
      `}</style>

      {isCompleted && src ? (
        <div className="w-full h-full relative flex items-center justify-center">
          {(!isInView || !isMediaLoaded) && (
            <div className="absolute inset-0 z-0 bg-white/5 animate-pulse flex items-center justify-center">
              {isInView && (
                <div className="w-1/3 aspect-square rounded-full border-2 border-white/5 border-t-white/20 animate-spin" />
              )}
            </div>
          )}

          {isInView && (
            <div className={cn(
              "w-full h-full transition-opacity duration-500 relative flex items-center justify-center",
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
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}
        </div>
      ) : isProcessing ? (
        <div className="w-full h-full relative overflow-hidden bg-[#0f1012]">
          {/* Gradient Background */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(130deg, #0b111d 0%, #2a3340 42%, #505965 70%, #182231 100%)",
            }}
          />

          <div
            className="absolute -inset-[38%] pointer-events-none rounded-[48%]"
            style={{
              filter: "blur(22px)",
              background:
                "radial-gradient(circle at 28% 30%, rgba(220,230,245,0.24) 0%, rgba(170,190,220,0.12) 24%, rgba(170,190,220,0) 60%)",
              animation: "waveDriftA 1.4s linear infinite alternate",
            }}
          />
          <div
            className="absolute -inset-[38%] pointer-events-none rounded-[48%]"
            style={{
              filter: "blur(24px)",
              background:
                "radial-gradient(circle at 72% 72%, rgba(200,214,235,0.2) 0%, rgba(160,182,210,0.1) 26%, rgba(160,182,210,0) 62%)",
              animation: "waveDriftB 1.8s linear infinite alternate",
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 46% 56%, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0) 64%)",
              animation: "fogPulse 0.8s linear infinite",
            }}
          />
          <div className="absolute inset-0 bg-black/18" />
        </div>
      ) : isFailed || isRejected ? (
        <div className="w-full h-full relative overflow-hidden bg-[#0f1012] p-4 text-center">
          <div className="absolute inset-0 bg-white/3" />
          <div className="relative z-10 w-full h-full flex flex-col items-start justify-start gap-3 text-left">
            <div className="size-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center">
              {isRejected ? (
                <AlertTriangle className="size-6 text-white/70" />
              ) : (
                <AlertCircle className="size-6 text-white/70" />
              )}
            </div>
            <div className="flex flex-col items-start gap-1 max-w-[90%]">
              <span className="text-[13px] font-semibold text-white/90">
                {isRejected ? "Blocked" : "Failed"}
              </span>
              <span className="text-[11px] font-medium text-white/70 leading-tight wrap-break-word">
                {error ||
                  (isRejected ? (
                    <>
                      This generation might violate our{" "}
                      <a
                        href="https://support.google.com/flow"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 decoration-white/40 hover:decoration-white/70"
                      >
                        policies
                      </a>
                      . Please try a different prompt or send feedback.
                    </>
                  ) : (
                    "Something went wrong while generating this media."
                  ))}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full bg-white/5" />
      )}
    </div>
  )
}
