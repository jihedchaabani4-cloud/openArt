"use client";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

/**
 * AssetListItem
 * Pure Google Flow asset list item:
 * - Clicking activates preview in hero pane.
 * - Exact Google Flow typography, rounded thumbnail, no extraneous buttons.
 * - Frosted blur feedback on active click identical to Button nav-tab.
 */
export function AssetListItem({
  item: _item,
  itemUrl,
  title = "Sans titre",
  typeLabel = "Image",
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
        "group w-full h-12 rounded-sm pl-1 pr-4 py-0 flex items-center gap-3 justify-start text-left border-none select-none relative cursor-pointer",
        isActive
          ? "bg-[#444746] text-white shadow-none"
          : "bg-transparent hover:bg-white/5 text-white/90",
        isDisabled && "opacity-40",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-xxxs overflow-hidden bg-black/40 shrink-0 relative flex items-center justify-center">
        {isVideo ? (
          <video src={itemUrl} className="w-full h-full object-cover" muted />
        ) : (
          <img src={itemUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        )}
      </div>

      {/* Asset Text: Title and Uniform Type Subtitle */}
      <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
        <span className="text-[13px] font-medium text-[#e3e3e3] truncate leading-tight font-sans antialiased">
          {title}
        </span>
        <span className="text-[11px] font-normal text-[#c4c7c5] truncate font-sans antialiased mt-0.5">
          {typeLabel}
        </span>
      </div>
    </Button>
  );
}
