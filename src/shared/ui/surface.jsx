import * as React from "react";
import { Slot } from "radix-ui";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/lib/utils";

/**
 * Surface Primitive — Higgsfield Cinema Studio Design System
 * Single Source of Truth: design-system.md §1 & §10
 */
export const surfaceVariants = cva(
  "transition-colors duration-150 border text-[var(--text-body)]",
  {
    variants: {
      tone: {
        base: "bg-[var(--bg-page)] border-[var(--border-subtle)] text-[var(--text-body)]",
        panel: "bg-[var(--bg-page)] border-[var(--border-subtle)] text-[var(--text-body)]",
        card: "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]",
        elevated: "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]",
        highest: "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]",
        sunken: "bg-[var(--bg-root)] border-[var(--border-subtle)] text-[var(--text-body)]",
        overlay: "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)] backdrop-blur-md",
        tertiary: "bg-[var(--bg-root)] border-[var(--border-subtle)] text-[var(--text-body)]",
        brand: "bg-[var(--brand)] text-[var(--text-on-brand)] border-transparent",
        surface: "bg-[var(--bg-page)] border-[var(--border-subtle)] text-[var(--text-body)]",
        "container-lowest": "bg-[var(--bg-root)] border-[var(--border-subtle)] text-[var(--text-body)]",
        "container-low": "bg-[var(--bg-page)] border-[var(--border-subtle)] text-[var(--text-body)]",
        container: "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)]",
        "container-high": "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]",
        "container-highest": "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]",
        bright: "bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-primary)]",
      },
      radius: {
        none: "rounded-none",
        xxxs: "rounded-[var(--r-xs)]",
        xs: "rounded-[var(--r-xs)]",
        sm: "rounded-[var(--r-sm)]",
        md: "rounded-[var(--r-md)]",
        lg: "rounded-[var(--r-lg)]",
        xl: "rounded-[var(--r-xl)]",
        "2xl": "rounded-[var(--r-2xl)]",
        "3xl": "rounded-[var(--r-3xl)]",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      tone: "base",
      radius: "lg",
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
export default Surface;
