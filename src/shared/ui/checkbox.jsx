/**
 * Checkbox Primitive — OpenArt / Labveil Unified Design System
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRICT ARCHITECTURAL RULES:
 * 1. ZERO CALL-SITE RESTYLING: Never add ad-hoc background, border, or corner classes.
 * 2. USE CANONICAL VARIANTS: `variant="default" | "neon"`.
 * 3. USE CANONICAL SIZES: `size="default" | "lg"`.
 * 4. `className` IS EXCLUSIVELY FOR LAYOUT (e.g. `shrink-0`, `self-center`).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";

const Checkbox = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  ...props
}, ref) => {
  const isLg = size === "lg";
  const isNeon = variant === "neon";

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      data-slot="checkbox"
      data-variant={variant}
      data-size={size}
      className={cn(
        // Base structure & geometry
        "peer shrink-0 cursor-pointer rounded-sm border transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isLg ? "size-5" : "size-4",
        // Resting border and background
        "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10",
        // Checked state
        isNeon
          ? "data-[state=checked]:bg-lime-400 data-[state=checked]:border-lime-400 data-[state=checked]:text-black"
          : "data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-black",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <GoogleIcon iconName="check" className={cn(isLg ? "text-sm font-bold" : "text-xs font-bold")} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
