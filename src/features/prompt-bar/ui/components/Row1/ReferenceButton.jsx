import React from "react";
import { Plus, X, Film } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export function ReferenceButton({ onClick, label, isCompact = false, icon: Icon, media, onRemove }) {
  const displayIcon = Icon ? <Icon size={18} strokeWidth={1.5} /> : <Plus size={18} strokeWidth={1.5} />;
  const hasMedia = !!media;

  return (
    <div
      className={cn(
        "relative shrink-0 flex flex-col items-center justify-center",
        "w-[80px] h-[80px] rounded-[12px] border cursor-pointer group overflow-hidden",
        "bg-white/3 backdrop-blur-md hover:bg-white/8",
        "border-white/8 hover:border-white/20",
        "text-white/50 hover:text-white/90",
        "transition-all duration-200"
      )}
      onClick={!hasMedia ? onClick : undefined}
    >
      {hasMedia ? (
        <>
          {/* Media Content */}
          <div className="absolute inset-0 z-0">
            {media.type === 'video' ? (
              <video
                src={media.url}
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={media.url}
                alt="ref"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
          </div>

          {/* Role Badge */}
          {label && (
            <div className="absolute top-0 right-0 bg-black/60 backdrop-blur-md px-1.5 py-1 rounded-bl-[8px] text-[10px] font-bold text-white z-10 border-l border-b border-white/5 uppercase tracking-wide">
              {label}
            </div>
          )}

          {/* Remove Overlay */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/65 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
          >
            <div className="size-6 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
              <X size={12} className="text-white" strokeWidth={2.5} />
            </div>
          </button>
          
          {/* Type indicator (Video) */}
          {media.type === 'video' && (
            <div className="absolute top-1 left-1 bg-black/50 backdrop-blur-md rounded-[4px] p-0.5 z-10">
              <Film size={10} className="text-white" />
            </div>
          )}
        </>
      ) : (
        <>
          {/* Icon */}
          <div
            className={cn(
              "transform-gpu transition-all duration-250 z-10",
              "ease-[cubic-bezier(0.22,1,0.36,1)]",
              !isCompact && label && "group-hover:-translate-y-[6px]"
            )}
          >
            {isCompact ? <Plus size={16} strokeWidth={2} /> : displayIcon}
          </div>

          {/* Label (Empty state tooltip/label) */}
          {!isCompact && label && (
            <span
              className={cn(
                "absolute bottom-[8px] text-[10px] font-medium uppercase z-10",
                "tracking-wide text-center leading-tight px-1",
                "opacity-0 translate-y-[4px]",
                "transform-gpu transition-all duration-250",
                "ease-[cubic-bezier(0.22,1,0.36,1)]",
                "group-hover:opacity-100 group-hover:translate-y-0"
              )}
            >
              {label}
            </span>
          )}
        </>
      )}
    </div>
  );
}