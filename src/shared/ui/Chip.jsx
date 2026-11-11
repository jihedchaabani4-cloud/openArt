import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * Chip Button Primitive — design-system.md §3.7
 * - Height: 28px
 * - Radius: 8px (--r-sm)
 * - Padding: 4px 8px, gap 4px
 * - Bg: rgba(255,255,255,.05) (--overlay-5)
 * - Hover: --overlay-10
 * - Active: --overlay-20
 * - Text: 12px/18px 500 #FFF
 * - Highlight variant: text & icon #D1FE17 (--brand)
 */
export const Chip = React.forwardRef(function Chip(
  {
    children,
    highlight = false,
    active = false,
    icon: IconComp,
    trailingIcon: TrailingIconComp,
    className,
    disabled = false,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        "inline-flex h-[28px] items-center gap-1 rounded-[var(--r-sm)] px-2 text-[12px] leading-[18px] font-medium transition-colors select-none shrink-0 outline-none",
        active
          ? "bg-[var(--overlay-20)]"
          : "bg-[var(--overlay-5)] hover:bg-[var(--overlay-10)] active:bg-[var(--overlay-20)]",
        highlight
          ? "text-[var(--brand)] font-semibold"
          : "text-[var(--text-primary)]",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
        className
      )}
      {...props}
    >
      {IconComp && <span className="shrink-0">{IconComp}</span>}
      <span>{children}</span>
      {TrailingIconComp && <span className="shrink-0 text-[var(--text-secondary)]">{TrailingIconComp}</span>}
    </button>
  );
});

Chip.displayName = "Chip";
export default Chip;
