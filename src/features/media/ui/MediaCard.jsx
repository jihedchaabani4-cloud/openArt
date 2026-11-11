"use client";

import React from "react";
import { MediaRenderer } from "./MediaRenderer";
import { Card } from "@/shared/ui/card";
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
    <Card
      ref={ref}
      radius="xxxs"
      tone="card"
      data-testid="media-card"
      data-selected={String(isSelected)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={cardStyle}
      className={cn(
        "group transition-none hover:border-[var(--border-strong)] shadow-none",
        isSelected && "ring-2 ring-primary border-transparent shadow-none",
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
      <Card.Canvas className="w-full h-full">
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
      </Card.Canvas>

      {/* Bottom Footer Slot (e.g. title, metadata) */}
      {footerSlot && (
        <div className="relative z-10 p-3 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)]">
          {footerSlot}
        </div>
      )}
    </Card>
  );
})
);
MediaCard.displayName = "MediaCard";

export default MediaCard;
