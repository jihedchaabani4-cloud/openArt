"use client";

import { Button } from "@/components/base/button";
import { cn } from "@/shared/lib/utils";

/**
 * AssetListItem
 * Pure Google Flow asset list item:
 * - Uses canonical Button variants (secondary for active, flow-ghost for idle)
 * - Exact Google Flow typography and rounded thumbnail
 */
export function AssetListItem({
  item: _item,
  itemUrl,
  title = "Sans titre",
  isVideo = false,
  isActive = false,
  isDisabled = false,
  onClick,
  onDoubleClick,
  className,
}) {
  return (
    <Button
      variant="ghost"
      type="button"
      role="option"
      aria-selected={isActive}
      aria-disabled={isDisabled}
      onClick={onClick}
      onDoubleClick={(e) => {
        if (!isDisabled) {
          onDoubleClick?.(e);
        }
      }}
      className={cn(
        "ds-pop-press !h-10 w-full !justify-start gap-2.5 p-1 pr-2.5 rounded-subtle text-left select-none",
        isActive
          ? "animate-button-pop !bg-white/[0.16] hover:!bg-white/20 text-white"
          : "text-white/80 hover:!bg-white/10 hover:text-white",
        isDisabled && "opacity-50",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="size-8 rounded-subtle overflow-hidden bg-white/5 shrink-0 relative flex items-center justify-center">
        {isVideo ? (
          <video src={itemUrl} className="w-full h-full object-cover" muted />
        ) : (
          <img src={itemUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        )}
      </div>

      {/* Asset Title */}
      <span
        className={cn(
          "flex-1 min-w-0 truncate antialiased",
          isActive ? "ds-type-caption-label" : "ds-type-small"
        )}
      >
        {title}
      </span>
    </Button>
  );
}

export default AssetListItem;
