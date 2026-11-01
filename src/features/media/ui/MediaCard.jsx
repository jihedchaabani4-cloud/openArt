"use client";

import React from "react";
import { MediaRenderer } from "./MediaRenderer";
import { cn } from "@/shared/lib/utils";

/**
 * MediaCard - Standard card container for feed and studio views.
 * Wraps MediaRenderer with header, action, overlay, and footer projection slots.
 */
export const MediaCard = React.memo(
  React.forwardRef(function MediaCard(
    {
      item,
      headerSlot,
      actionSlot,
      overlaySlot,
      footerSlot,
      isSelected = false,
      className,
      onClick,
      onDoubleClick,
      ...rendererProps
    },
    ref
  ) {
  return (
    <div
      ref={ref}
      data-testid="media-card"
      data-selected={String(isSelected)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card bg-neutral-900 border border-neutral-800/80 transition-all duration-200 hover:border-neutral-700/80 hover:shadow-lg",
        isSelected && "ring-2 ring-primary border-transparent shadow-primary/20 shadow-md",
        className
      )}
    >
      {/* Top Header Slot (e.g. status badge, role badge) */}
      {headerSlot && (
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          {headerSlot}
        </div>
      )}

      {/* Top Action Slot (e.g. menu button, select checkbox) */}
      {actionSlot && (
        <div className="absolute top-3 right-3 z-20 transition-opacity duration-150">
          {actionSlot}
        </div>
      )}

      {/* Main Media Renderer */}
      <div className="relative w-full h-full overflow-hidden">
        <MediaRenderer
          item={item}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          {...rendererProps}
        />

        {/* Hover / Context Overlay Slot */}
        {overlaySlot && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
            {overlaySlot}
          </div>
        )}
      </div>

      {/* Bottom Footer Slot (e.g. title, metadata) */}
      {footerSlot && (
        <div className="relative z-10 p-3 bg-neutral-900/90 backdrop-blur-sm border-t border-neutral-800/60">
          {footerSlot}
        </div>
      )}
    </div>
  );
})
);
MediaCard.displayName = "MediaCard";

export default MediaCard;
