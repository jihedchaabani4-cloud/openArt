"use client";

import React from "react";
import { MediaRenderer } from "./MediaRenderer";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";

/**
 * MediaChip - Compact pill badge for Prompt Bar references.
 */
export const MediaChip = React.forwardRef(function MediaChip(
  {
    item,
    label,
    onRemove,
    onClick,
    className,
    ...props
  },
  ref
) {
  const displayLabel = label || item?.name || item?.id || "Reference";

  return (
    <div
      ref={ref}
      data-testid="media-chip"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full bg-neutral-800/90 hover:bg-neutral-750 border border-neutral-700/60 text-xs text-neutral-200 transition-colors select-none",
        onClick && "cursor-pointer",
        className
      )}
      {...props}
    >
      <div className="relative w-5 h-5 overflow-hidden rounded-full shrink-0 bg-neutral-900 border border-neutral-700">
        <MediaRenderer
          item={item}
          aspectRatio="1/1"
          objectFit="cover"
          className="w-full h-full"
        />
      </div>

      <span className="font-medium truncate max-w-[140px]">{displayLabel}</span>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item, e);
          }}
          aria-label={`Remove ${displayLabel}`}
          className="ml-0.5 p-0.5 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <GoogleIcon name="close" className="text-[14px]" />
        </button>
      )}
    </div>
  );
});

export default MediaChip;
