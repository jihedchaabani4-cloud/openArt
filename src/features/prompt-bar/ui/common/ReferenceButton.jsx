import React from "react";
import { X, Film, Play, Image, ArrowLeftRight, Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";

const VARIANTS = {
  start:  { word: "Start",  HoverContent: () => <span className="text-[10px] uppercase tracking-[0.08em] text-[rgba(218,220,224,0.5)]">pick</span> },
  end:    { word: "End",    HoverContent: () => <span className="text-[10px] uppercase tracking-[0.08em] text-[rgba(218,220,224,0.5)]">pick</span> },
  motion: { word: "Motion", HoverContent: () => <Play size={15} strokeWidth={1.5} className="text-[rgba(218,220,224,0.6)]" /> },
  ref:    { word: "Ref",    HoverContent: () => <Image size={15} strokeWidth={1.5} className="text-[rgba(218,220,224,0.6)]" /> },
  add:    { word: "Add",    HoverContent: () => <Plus size={15} strokeWidth={1.5} className="text-[rgba(218,220,224,0.6)]" /> },
};

export function ReferenceButton({
  variant,
  word,
  hoverContent,
  onClick,
  disabled = false,
  pulse = false,
  className,
}) {
  const preset = variant ? VARIANTS[variant] : null;
  const displayWord = word ?? preset?.word ?? null;
  const HoverContent = hoverContent ?? preset?.HoverContent ?? null;

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "group relative shrink-0",
        "w-[50px] h-[50px] rounded-[12px]",
        "flex items-center justify-center",
        "bg-white/[0.04]",
        "border border-[rgba(218,220,224,0.15)]",
        "transition-all duration-200 ease-out",
        "hover:bg-white/[0.07] hover:border-[rgba(218,220,224,0.28)]",
        "active:scale-95",
        pulse && "animate-pulse-border",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      {displayWord && (
        <span
          className={cn(
            "absolute pointer-events-none",
            "text-[13px] font-medium text-[rgba(218,220,224,0.75)]",
            "tracking-[0.01em] whitespace-nowrap",
            "transition-all duration-200 ease-out",
            "group-hover:-translate-y-2 group-hover:opacity-0"
          )}
        >
          {displayWord}
        </span>
      )}

      {HoverContent && (
        <div
          className={cn(
            "absolute pointer-events-none",
            "flex items-center justify-center",
            "translate-y-2 opacity-0",
            "transition-all duration-200 ease-out",
            "group-hover:translate-y-0 group-hover:opacity-100"
          )}
        >
          <HoverContent />
        </div>
      )}
    </div>
  );
}


export function SwapIcon({ className }) {
  return (
    <div className={cn("flex items-center justify-center text-white/40 shrink-0", className)}>
      <ArrowLeftRight size={18} strokeWidth={3} />
    </div>
  );
}


export function ViewReference({
  media,
  onRemove,
  label,
  className,
}) {
  if (!media) return null;

  return (
    <div
      className={cn(
        "group relative shrink-0",
        "w-[50px] h-[50px] rounded-[12px]",
        "overflow-hidden",
        "bg-white/[0.04]",
        "border border-[rgba(218,220,224,0.15)]",
        "transition-all duration-300 ease-out",
        "hover:border-[rgba(218,220,224,0.28)]",
        className
      )}
    >
      {/* Media — slides UP on hover */}
      <div className="absolute inset-0 z-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-1.5">
        {media.type === "video" ? (
          <video
            src={media.url}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={media.url}
            alt="reference"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Remove overlay — slides UP from bottom */}
      <div
        className="absolute overflow-hidden inset-0 z-20 flex items-center justify-center  bg-[#202122]   translate-y-full group-hover:translate-y-0 transition-transform duration-300  cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.();
        }}
      >
        <X size={16} strokeWidth={2} className="text-white" />
      </div>

      {/* Video badge */}
      {media.type === "video" && (
        <div className="absolute top-1 left-1 z-10 bg-black/60 p-1 rounded">
          <Film size={10} className="text-white" />
        </div>
      )}


    </div>
  );
}