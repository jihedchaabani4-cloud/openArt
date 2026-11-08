/**
 * Surface Primitive — OpenArt / Labveil Unified Design System
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRICT ARCHITECTURAL RULES:
 * 1. ZERO REACT CONTEXT: 100% Server Component safe, zero hydration penalty.
 * 2. RADIX DELEGATION: Supports asChild via radix-ui Slot.Root.
 * 3. CANONICAL UTILITIES: Uses cn from @/shared/lib/utils for token awareness.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as React from "react";
import { Slot } from "radix-ui";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

export const surfaceVariants = cva(
  "transition-colors duration-150 border",
  {
    variants: {
      tone: {
        base: "bg-surface text-on-surface border-outline-variant",
        panel: "bg-surface-container-low text-on-surface border-outline-variant",
        processing: "bg-surface-container-lowest text-on-surface border-outline-variant",
        card: "bg-surface-container text-on-surface border-outline-variant",
        elevated: "bg-surface-container-high text-on-surface border-outline-variant",
        highest: "bg-surface-container-highest text-on-surface border-outline",
        sunken: "bg-surface-container-lowest text-on-surface border-outline-variant",
        overlay: "bg-surface-container-high/90 text-on-surface border-outline-variant backdrop-blur-md",
        // Google Flow Material 3 surface ladder
        surface: "bg-surface text-on-surface border-outline-variant",
        "container-lowest": "bg-surface-container-lowest text-on-surface border-outline-variant",
        "container-low": "bg-surface-container-low text-on-surface border-outline-variant",
        container: "bg-surface-container text-on-surface border-outline-variant",
        "container-high": "bg-surface-container-high text-on-surface border-outline",
        "container-highest": "bg-surface-container-highest text-on-surface border-outline",
        bright: "bg-surface-bright text-on-surface border-outline",
      },
      radius: {
        none: "rounded-none",
        xxxs: "rounded-xxxs",
        xs: "rounded-xs",
        sm: "rounded-sm",
        md: "rounded-md",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      tone: "base",
      radius: "md",
    },
  }
);

export const Surface = React.forwardRef(function Surface(
  { className, tone, radius, asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      ref={ref}
      data-slot="surface"
      className={cn(surfaceVariants({ tone, radius }), className)}
      {...props}
    />
  );
});
Surface.displayName = "Surface";
