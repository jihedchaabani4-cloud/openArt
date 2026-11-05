/**
 * Skeleton Primitive — OpenArt / Labveil Unified Design System
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRICT ARCHITECTURAL RULES:
 * 1. ZERO CALL-SITE RESTYLING: Loading shimmer and opacity pulses are standard.
 * 2. USE CANONICAL SHAPES: `shape="default" | "card" | "circle" | "badge"`.
 * 3. `className` IS EXCLUSIVELY FOR SIZING/LAYOUT (e.g. `w-full h-8`).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as React from "react";
import { cn } from "@/shared/lib/utils";

function Skeleton({
  className,
  variant = "pulse",
  shape = "default",
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      data-shape={shape}
      className={cn(
        "bg-white/5 pointer-events-none",
        variant === "pulse" && "animate-pulse",
        variant === "shimmer" && "animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5",
        shape === "default" && "rounded-button",
        shape === "card" && "rounded-card",
        shape === "circle" && "rounded-full",
        shape === "badge" && "rounded-badge",
        shape === "pill" && "rounded-full",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
