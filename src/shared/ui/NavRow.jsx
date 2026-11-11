import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * NavRow Primitive — design-system.md §3.6
 * - Height: 36px, padding: 6px, gap: 8px, radius: 12px (--r-lg)
 * - Rest: transparent, text #FFF
 * - Hover: bg rgba(255,255,255,.05) (--overlay-5)
 * - Active: bg rgba(255,255,255,.05) already on
 */
export const NavRow = React.forwardRef(function NavRow(
  {
    children,
    icon: IconComp,
    trailing: TrailingComp,
    active = false,
    className,
    as: Component = "button",
    ...props
  },
  ref
) {
  return (
    <Component
      ref={ref}
      type={Component === "button" ? "button" : undefined}
      className={cn(
        "flex h-[36px] w-full items-center gap-2 p-[6px] rounded-[var(--r-lg)] text-left font-medium text-[14px] leading-[20px] transition-colors cursor-pointer select-none outline-none",
        active
          ? "bg-[var(--overlay-5)] text-[var(--text-primary)]"
          : "bg-transparent text-[var(--text-primary)] hover:bg-[var(--overlay-5)]",
        className
      )}
      {...props}
    >
      {IconComp && <span className="shrink-0">{IconComp}</span>}
      <span className="flex-1 truncate">{children}</span>
      {TrailingComp && <span className="shrink-0">{TrailingComp}</span>}
    </Component>
  );
});

NavRow.displayName = "NavRow";
export default NavRow;
