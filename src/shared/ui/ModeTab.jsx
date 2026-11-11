import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * ModeTab (Image | Video) — design-system.md §3.8
 * - Rail: width 72px, padding 4, radius 24px (--r-3xl), bg #1C1E20, shadow --sh-rail
 * - Tab: 64px wide, ~52px high, radius 20px (--r-2xl), column, gap 4, padding 6px 12px
 * - Icon 16px + label 10/12 700
 * - Rest: #898A8B, Selected: #FFFFFF
 * - Sliding indicator: radius 20px, bg rgba(255,255,255,.05)
 */
export const ModeTab = ({
  options = [
    { id: "image", label: "IMAGE", icon: null },
    { id: "video", label: "VIDEO", icon: null },
  ],
  value,
  onChange,
  className,
}) => {
  const activeIndex = options.findIndex((o) => o.id === value);

  return (
    <div
      className={cn(
        "relative flex flex-col w-[72px] p-1 rounded-[var(--r-3xl)] bg-[var(--bg-surface)] shadow-[var(--sh-rail)] isolate",
        className
      )}
    >
      {/* Sliding indicator */}
      {activeIndex >= 0 && (
        <div
          className="absolute left-1 w-[64px] h-[52px] rounded-[var(--r-2xl)] bg-[var(--overlay-5)] transition-transform duration-200 pointer-events-none -z-1"
          style={{ transform: `translateY(${activeIndex * 56}px)` }}
        />
      )}

      {options.map((opt) => {
        const isSelected = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange?.(opt.id)}
            className={cn(
              "flex flex-col items-center justify-center w-[64px] h-[52px] rounded-[var(--r-2xl)] p-[6px_12px] gap-1 cursor-pointer transition-colors outline-none",
              isSelected
                ? "text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {opt.icon && <span className="size-4 shrink-0">{opt.icon}</span>}
            <span className="text-[10px] leading-[12px] font-bold tracking-wider">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ModeTab;
