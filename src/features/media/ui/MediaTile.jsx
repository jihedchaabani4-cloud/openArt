"use client";

import React from "react";
import { MediaRenderer } from "./MediaRenderer";
import { cn } from "@/shared/lib/utils";

/**
 * MediaTile - Compact selectable tile for sidebars, pickers, and asset trays.
 */
export const MediaTile = React.memo(
  React.forwardRef(function MediaTile(
    {
      item,
      isSelected = false,
      badge,
      onSelect,
      onClick,
      aspectRatio = "1/1",
      className,
      ...rendererProps
    },
    ref
  ) {
  const handleClick = (e) => {
    if (onSelect) {
      onSelect(item, e);
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      ref={ref}
      data-testid="media-tile"
      data-selected={String(isSelected)}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e);
        }
      }}
      className={cn(
        "group relative overflow-hidden rounded-lg bg-neutral-900 border border-neutral-800 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-none",
        isSelected
          ? "ring-2 ring-primary border-transparent shadow-none"
          : "hover:border-neutral-700",
        className
      )}
    >
      <MediaRenderer
        item={item}
        aspectRatio={aspectRatio}
        className="w-full h-full object-cover"
        {...rendererProps}
      />

      {badge && (
        <div className="absolute top-1.5 right-1.5 z-10 pointer-events-none">
          {badge}
        </div>
      )}
    </div>
  );
})
);
MediaTile.displayName = "MediaTile";

export default MediaTile;
