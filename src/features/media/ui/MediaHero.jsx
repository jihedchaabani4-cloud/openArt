"use client";

import React from "react";
import { MediaRenderer } from "./MediaRenderer";
import { cn } from "@/shared/lib/utils";

/**
 * MediaHero - Uncropped full-bleed detail view for edit and asset inspection pages.
 */
export const MediaHero = React.memo(
  React.forwardRef(function MediaHero(
    {
      item,
      className,
      objectFit = "contain",
      controls = true,
      autoPlay = false,
      ...rendererProps
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        data-testid="media-hero"
        className={cn(
          "relative flex items-center justify-center w-full h-full min-h-[300px] overflow-hidden rounded-2xl bg-neutral-950/80 border border-neutral-800/80 p-4",
          className
        )}
      >
        <MediaRenderer
          item={item}
          objectFit={objectFit}
          controls={controls}
          autoPlay={autoPlay}
          className="max-h-full max-w-full rounded-lg shadow-none"
          {...rendererProps}
        />
      </div>
    );
  })
);
MediaHero.displayName = "MediaHero";

export default MediaHero;
