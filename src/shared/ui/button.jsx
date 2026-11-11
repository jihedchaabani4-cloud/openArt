/**
 * Button Primitive — OpenArt / Labveil Unified Design System
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * SIMPLIFIED BUTTON API ARCHITECTURE:
 * 1. SIX CORE SEMANTIC VARIANTS ONLY:
 *    - primary: High-contrast call to action (white on dark background)
 *    - secondary: Standard surface container action button
 *    - outline: Bordered surface action button
 *    - ghost: Transparent background subtle button (default)
 *    - danger: Destructive / danger action button
 *    - link: Inline text action button
 * 2. STYLING & SIZING VIA className:
 *    Feature call sites combine core variants with standard Tailwind utility classes:
 *    - Sizing: e.g. `h-10 px-6 text-sm`, `h-6 px-2 text-xs`
 *    - Shapes: e.g. `rounded-full`
 *    - Icons: e.g. `size-8 p-0`, `size-9 p-0`
 *    - Positioning & Layout: e.g. `w-full`, `shrink-0`
 * 3. TAILWIND-MERGE ENCAPSULATION:
 *    `className` automatically and predictably overrides the variant defaults
 *    via `cn(buttonVariants({ variant }), className)`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-sans text-sm font-semibold antialiased shadow-none transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 max-h-full min-h-0 outline-none focus-visible:ring-2 focus-visible:ring-white/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "h-8 px-3.5 rounded-sm bg-white text-black hover:bg-white/90 active:scale-95 border-none",
        secondary:
          "h-8 px-3.5 rounded-sm bg-surface-elevated text-white hover:bg-white/10 active:bg-white/20 border-none",
        outline:
          "h-8 px-3.5 rounded-sm border border-white/10 bg-transparent text-white hover:bg-white/5 active:bg-white/10",
        ghost:
          "h-8 px-3.5 rounded-sm bg-transparent text-white/90 hover:bg-white/10 hover:text-white border-none",
        danger:
          "h-8 px-3.5 rounded-sm bg-transparent text-danger hover:text-danger hover:bg-danger/10 active:bg-danger/20 border-none",
        link:
          "p-0 h-auto bg-transparent text-accent-blue underline-offset-4 hover:underline font-medium cursor-pointer border-none",
        brand:
          "h-9 px-4 rounded-full btn-generate-tactile border-none",
        pill:
          "h-8 px-3.5 rounded-full bg-[#131416] text-font-primary border border-white/5 hover:opacity-90 active:scale-95",
        chip:
          "h-9 px-3 rounded-xl bg-neutral-primary-reverted/5 text-font-primary hover:bg-neutral-primary-reverted/10 border-none",
        tactile:
          "h-9 px-4 rounded-full btn-generate-tactile border-none font-semibold",
        hf:
          "h-8 px-3.5 rounded-lg bg-white/5 text-font-primary hover:bg-white/10 active:scale-95 border border-white/5 font-medium",
        "hf-brand":
          "h-9 px-4 rounded-full btn-generate-tactile border-none font-semibold text-[#131517]",
        "hf-secondary":
          "h-8 px-3.5 rounded-lg bg-[#1c1e20] text-white hover:bg-white/10 active:bg-white/15 border border-white/5 font-medium",
        "flow-primary":
          "h-8 px-3.5 rounded-sm bg-primary text-on-primary font-medium hover:bg-primary/90 active:scale-95 border-none",
        "flow-chip":
          "h-7 px-2.5 rounded-sm bg-white/5 text-on-surface-variant text-xs font-medium hover:bg-white/10 hover:text-on-surface border-none",
        "flow-generate":
          "rounded-full btn-generate-tactile disabled:opacity-40 disabled:pointer-events-none border-none",
        "flow-ghost":
          "h-8 px-2 rounded-sm bg-transparent text-on-surface-variant hover:bg-white/[0.08] hover:text-on-surface border-none",
        "sidebar-back":
          "group/back flex min-w-0 flex-1 items-center gap-2 rounded-xl p-1.5 text-left transition-colors duration-150 hover:bg-qc-overlay-hover hover:transition-none border-none text-qc-text-primary bg-transparent font-medium",
        "qc-back":
          "group/back flex min-w-0 flex-1 items-center gap-2 rounded-xl p-1.5 text-left transition-colors duration-150 hover:bg-qc-overlay-hover hover:transition-none border-none text-qc-text-primary bg-transparent font-medium",
        "sidebar-item":
          "w-full justify-start p-0 gap-0 rounded-lg transition-colors duration-100 select-none outline-none overflow-hidden font-sans font-medium text-sm leading-5 antialiased text-on-surface-variant hover:text-on-surface hover:bg-white/[0.06] border-none bg-transparent",
        "sidebar-item-active":
          "w-full justify-start p-0 gap-0 rounded-lg transition-colors duration-100 select-none outline-none overflow-hidden font-sans font-medium text-sm leading-5 antialiased bg-surface-elevated text-on-surface shadow-none hover:bg-surface-elevated hover:text-on-surface border-none",
      },
      size: {
        s: "h-button-s",
        m: "h-button-m",
        l: "h-button-l",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "m",
    },
  }
);

const Button = React.forwardRef(function Button(
  {
    className,
    variant = "ghost",
    size = "m",
    asChild = false,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot.Root : "button";
  const resolvedVariant = variant === "default" || !variant ? "ghost" : variant;
  const resolvedSize = size ? String(size).toLowerCase() : "m";

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={resolvedVariant}
      className={cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize }), className)}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
