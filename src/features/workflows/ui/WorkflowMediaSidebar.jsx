import React from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { getItemMetadata } from "@/shared/lib/generationUtils";

/**
 * A standalone sidebar component that displays a list of workflow media as thumbnails.
 * 
 * @param {Array} items - List of media items within the workflow
 * @param {Object} activeItem - Currently selected media item
 * @param {Function} onSelect - Callback when an item is selected
 * @param {String} className - Additional CSS classes
 */
export function WorkflowMediaSidebar({
  items = [],
  activeItem = null,
  onSelect = () => {},
  className,
  variant = "list", // "list" (default) or "grid"
}) {
  if (!items || items.length < 2) return null;

  const isGrid = variant === "grid";

  return (
    <div className={cn(
      "h-full bg-black/40 backdrop-blur-xl py-6 px-6 overflow-y-auto scrollbar-none transition-all duration-500",
      isGrid ? "grid grid-cols-2 sm:grid-cols-3 gap-4 auto-rows-min" : "flex flex-col gap-4 items-center",
      className
    )}>
      {items.map((item) => {
        const meta = getItemMetadata(item);
        const isActive = activeItem && (item.id === activeItem.id || item.name === activeItem.name);
        const iUrl = meta.url;
        const iVideo = meta.isVideo;
        
        return (
          <button
            key={item.id || item.name}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item);
            }}
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden border transition-all duration-300",
              "shrink-0 group transform active:scale-95 hover:scale-[1.03]",
              isGrid ? "w-full" : "w-full max-w-[200px]",
              isActive ? "border-[#D4FF00] ring-1 ring-[#D4FF00]/30 shadow-lg scale-[1.03]" : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/30"
            )}
          >
            {iUrl ? (
              <img src={iUrl} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5">
                {iVideo ? <GoogleIcon iconName="movie" className="text-[14px] text-white/40" /> : <GoogleIcon iconName="image" className="text-[14px] text-white/40" />}
              </div>
            )}
            
            {/* Micro-indicator for video on thumbnail */}
            {iVideo && (
              <div className="absolute top-1 right-1 p-0.5 bg-black/40 backdrop-blur-sm rounded-sm flex items-center justify-center">
                <GoogleIcon iconName="play_arrow" fill className="text-[10px] text-white" />
              </div>
            )}
            
            {/* Active Glow Overlay */}
            <div className={cn(
              "absolute inset-0 bg-[#D4FF00]/10 transition-opacity duration-300 pointer-events-none",
              isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )} />
          </button>
        );
      })}
    </div>
  );
}
