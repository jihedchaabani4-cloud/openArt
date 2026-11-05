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
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-sans antialiased shadow-none transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "h-8 px-3.5 rounded-sm font-semibold text-xs bg-white text-black hover:bg-white/90 active:scale-[0.98] border-none",
        secondary:
          "h-8 px-3.5 rounded-sm font-medium text-xs bg-[var(--mat-sys-surface-container-high,#282a2c)] text-[var(--mat-sys-on-surface,#e3e3e3)] hover:text-white hover:bg-[var(--foreground-state-15)] active:bg-[var(--foreground-state-25)] border-none",
        outline:
          "h-8 px-3.5 rounded-sm font-semibold text-xs border border-[var(--mat-sys-outline-variant,#444746)] bg-transparent text-[var(--mat-sys-on-surface,#e3e3e3)] hover:text-white hover:bg-[var(--foreground-state-10)] active:bg-[var(--foreground-state-15)]",
        ghost:
          "h-8 px-3.5 rounded-sm font-medium text-xs bg-transparent hover:bg-[var(--foreground-state-10,rgba(218,220,224,0.1))] text-[var(--mat-sys-on-surface,#e3e3e3)] hover:text-white border-none",
        danger:
          "h-8 px-3.5 rounded-sm font-medium text-xs bg-transparent text-[var(--foreground-color-danger,#fe6e6e)] hover:text-[var(--foreground-color-danger)] hover:bg-[var(--foreground-state-10)] active:bg-[var(--foreground-state-25)] border-none [&_svg]:text-[var(--foreground-color-danger)] [&_mat-icon]:text-[var(--foreground-color-danger)] [&_.google-symbols]:text-[var(--foreground-color-danger)]",
        link:
          "p-0 h-auto bg-transparent text-[var(--mat-sys-link,#a8c7fa)] underline-offset-4 hover:underline font-medium text-xs cursor-pointer border-none",
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
