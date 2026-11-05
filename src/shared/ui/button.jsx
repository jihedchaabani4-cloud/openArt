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
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-sans text-sm font-semibold antialiased shadow-none transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "h-8 px-3.5 rounded-sm bg-white text-black hover:bg-white/90 active:scale-[0.98] border-none",
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
      },
    },
    defaultVariants: {
      variant: "ghost",
    },
  }
);

const Button = React.forwardRef(function Button(
  {
    className,
    variant = "ghost",
    asChild = false,
    ...props
  },
  ref
) {
  const Comp = asChild ? Slot.Root : "button";
  const resolvedVariant = variant === "default" || !variant ? "ghost" : variant;

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={resolvedVariant}
      className={cn(buttonVariants({ variant: resolvedVariant }), className)}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
