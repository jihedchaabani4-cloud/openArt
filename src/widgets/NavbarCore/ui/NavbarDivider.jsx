"use client";

import { cn } from "@/shared/lib/utils";

/**
 * NavbarDivider
 * Subtle vertical dividing line between navbar item groups.
 */
export function NavbarDivider({ className }) {
  return (
    <div
      className={cn("h-5 w-[1px] bg-white/10 mx-1 shrink-0 select-none", className)}
      aria-hidden="true"
    />
  );
}

export default NavbarDivider;
