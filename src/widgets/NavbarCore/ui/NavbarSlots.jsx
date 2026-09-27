"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * NavbarLeft
 * Left aligned slot for back button, title, and contextual selectors.
 */
export function NavbarLeft({ children, className }) {
  return (
    <div className={cn("flex items-center gap-1.5 shrink-0 min-w-0", className)}>
      {children}
    </div>
  );
}

/**
 * NavbarCenter
 * Centered slot for search, filters, or entity mode pickers.
 */
export function NavbarCenter({ children, className }) {
  return (
    <div className={cn("flex-1 flex items-center justify-center min-w-0 px-4", className)}>
      {children}
    </div>
  );
}

/**
 * NavbarRight
 * Right aligned slot for actions, status indicators, and user menu.
 */
export function NavbarRight({ children, className }) {
  return (
    <div className={cn("ml-auto flex items-center gap-2 shrink-0", className)}>
      {children}
    </div>
  );
}
