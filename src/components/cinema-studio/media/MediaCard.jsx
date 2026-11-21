"use client";

import React from "react";
import { MediaRenderer } from "./MediaRenderer";
import { SectionCard } from "@/components/base/section-card";
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
      width,
      height,
      style,
      className,
      onClick,
      onDoubleClick,
      ...rendererProps
    },
    ref
  ) {
  const cardStyle = width && height ? { width, height, ...style } : style;

  return (
    <SectionCard
      ref={ref}
      data-testid="media-card"
      data-selected={String(isSelected)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={cardStyle}
      className={cn(
        "shrink-0 group relative overflow-hidden flex flex-col transition-none hover:border-line-interactive shadow-none",
        isSelected && "border border-text-primary/65 shadow-none",
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
        <div className="relative z-10 p-3 bg-surface-panel border-t border-line-subtle">
          {footerSlot}
        </div>
      )}
    </SectionCard>
  );
})
);
MediaCard.displayName = "MediaCard";

export default MediaCard;
