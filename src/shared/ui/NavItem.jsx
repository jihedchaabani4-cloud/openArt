"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * NavItem Primitive — design-system 03-chips-navigation.md §7
 * Mobile navigation item: 64x52, icon 20 + label
 */
export const NavItem = React.forwardRef(function NavItem(
  {
    icon: IconComp,
    label,
    active = false,
    className,
    disabled = false,
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-current={active ? "page" : undefined}
      disabled={disabled}
      className={cn("nav-m", className)}
      {...props}
    >
      {IconComp && <span className="shrink-0">{IconComp}</span>}
      {label && <span>{label}</span>}
      {children}
    </button>
  );
});

NavItem.displayName = "NavItem";
export default NavItem;
