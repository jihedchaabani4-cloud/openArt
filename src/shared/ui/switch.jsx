/**
 * Switch Primitive — OpenArt / Labveil Unified Design System
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRICT ARCHITECTURAL RULES:
 * 1. ZERO CALL-SITE RESTYLING: Never add ad-hoc background, border, or thumb colors.
 * 2. USE CANONICAL VARIANTS: `variant="default" | "neon" | "primary"`.
 * 3. USE CANONICAL SIZES: `size="default" | "sm"`.
 * 4. `className` IS EXCLUSIVELY FOR LAYOUT (e.g. `shrink-0`, `self-center`).
 * ═══════════════════════════════════════════════════════════════════════════════
 */

"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/shared/lib/utils";

const Switch = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  ...props
}, ref) => {
  const isSm = size === "sm";
  const isNeon = variant === "neon";
  const isPrimary = variant === "primary";

  return (
    <SwitchPrimitive.Root
      ref={ref}
      data-slot="switch"
      data-variant={variant}
      data-size={size}
      className={cn(
        // Base track styling
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50",
        isSm ? "h-5 w-9" : "h-6 w-11",
        // Unchecked resting state
        "bg-white/20 hover:bg-white/30",
        // Checked state by variant
        isNeon
          ? "data-[state=checked]:bg-lime-400"
          : isPrimary
          ? "data-[state=checked]:bg-primary"
          : "data-[state=checked]:bg-white",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full ring-0 transition-transform duration-200 ease-in-out bg-white data-[state=checked]:bg-black",
          isSm
            ? "size-3.5 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5"
            : "size-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5"
        )}
      />
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = "Switch";

export { Switch };
