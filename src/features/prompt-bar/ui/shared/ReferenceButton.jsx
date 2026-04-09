import React from "react";
import { Plus, X, Film } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * ── ReferenceButton ──
 * Empty / Add state
 */
export function ReferenceButton({
  onClick,
  label,
  icon: Icon,
  disabled = false,
  className,
}) {
  const displayIcon = Icon ? (
    <Icon size={18} strokeWidth={1.5} />
  ) : (
    <Plus size={18} strokeWidth={1.5} />
  );

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "group relative shrink-0",
        "w-[60px] h-[60px] rounded-md",
        "flex flex-col items-center justify-center",
        "overflow-hidden",
        "bg-white/5 backdrop-blur-md",
        "border border-white/10",
        "transition-all duration-300 ease-out",
        "hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex items-center justify-center",
          "text-white/80",
          "transition-all duration-300 transform-gpu",
          label ? "group-hover:-translate-y-1.5" : ""
        )}
      >
        {displayIcon}
      </div>

      {/* Label (collapsible) */}
      {label && (
        <div
          className={cn(
            "flex items-center justify-center px-1",
            "overflow-hidden",
            "h-0 opacity-0",
            "group-hover:h-auto group-hover:opacity-100",
            "transition-all duration-300 ease-in-out"
          )}
        >
          <span className="text-[9px] uppercase tracking-wider text-white/80 text-center leading-[1.1]">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}


/**
 * ── ViewReference ──
 * Filled / Preview state
 */
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
        "w-[60px] h-[60px] rounded-md",
        "overflow-hidden",
        "bg-white/5 backdrop-blur-md",
        "border border-white/10",
        "transition-all duration-300 ease-out",
        "hover:border-white/20",
        "hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
        className
      )}
    >
      {/* Media */}
      <div className="absolute inset-0 z-0">
        {media.type === "video" ? (
          <video
            src={media.url}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={media.url}
            alt="reference"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
      </div>

      {/* Remove Overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all"
        >
          <X size={14} className="text-white" />
        </button>
      </div>

      {/* Video badge */}
      {media.type === "video" && (
        <div className="absolute top-1 left-1 z-10 bg-black/60 p-1 rounded">
          <Film size={10} className="text-white" />
        </div>
      )}

      {/* Bottom label (collapsible) */}
      {label && (
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0",
            "flex items-center justify-center",
            "bg-black/60 backdrop-blur-md",
            "overflow-hidden",
            "h-0",
            "group-hover:h-[18px]",
            "transition-all duration-300 ease-in-out"
          )}
        >
          <span className="text-[10px] text-center uppercase text-white tracking-wide">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}