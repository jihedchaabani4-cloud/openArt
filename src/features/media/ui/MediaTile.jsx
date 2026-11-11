"use client";

import React from "react";
import { MediaRenderer } from "./MediaRenderer";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

/**
 * MediaTile - Compact selectable tile for sidebars, pickers, and asset trays.
 * Built on top of the canonical Card primitive with M3 design tokens.
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
      <Card
        ref={ref}
        radius="xxxs"
        tone="card"
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
          "group relative overflow-hidden transition-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-none",
          isSelected
            ? "ring-2 ring-primary border-transparent shadow-none"
            : "hover:border-[var(--border-strong)]",
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
      </Card>
    );
  })
);
MediaTile.displayName = "MediaTile";

export default MediaTile;
