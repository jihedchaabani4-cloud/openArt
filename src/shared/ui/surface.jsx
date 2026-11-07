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
        base: "bg-surface-base text-content-base border-line-subtle",
        panel: "bg-surface-panel text-content-base border-line-default",
        processing: "bg-surface-processing text-content-base border-line-subtle",
        card: "bg-surface-card text-content-base border-line-subtle",
        elevated: "bg-surface-elevated text-content-base border-line-default",
        highest: "bg-surface-highest text-content-base border-line-default",
        sunken: "bg-surface-sunken text-content-base border-line-subtle",
        overlay: "bg-surface-overlay text-content-base border-line-default backdrop-blur-md",
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
