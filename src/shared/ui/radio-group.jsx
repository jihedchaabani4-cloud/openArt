/**
 * Radio Group Primitive — OpenArt / Labveil Unified Design System
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * STRICT ARCHITECTURAL RULES:
 * 1. ZERO CALL-SITE RESTYLING: Never add ad-hoc background or indicator styling.
 * 2. USE CANONICAL VARIANTS: `variant="default" | "neon"`.
 * 3. USE CANONICAL SIZES: `size="default" | "lg"`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/utils";

const RadioGroup = React.forwardRef(({
  className,
  ...props
}, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      data-slot="radio-group"
      className={cn("grid gap-2.5", className)}
      {...props}
    />
  );
});
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  ...props
}, ref) => {
  const isLg = size === "lg";
  const isNeon = variant === "neon";

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      data-slot="radio-group-item"
      data-variant={variant}
      data-size={size}
      className={cn(
        // Base geometry
        "peer aspect-square shrink-0 cursor-pointer rounded-full border border-white/20 bg-white/5 transition-colors outline-none",
        "hover:border-white/40 hover:bg-white/10",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isLg ? "size-5" : "size-4",
        // Checked border
        isNeon
          ? "data-[state=checked]:border-lime-400"
          : "data-[state=checked]:border-white",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center"
      >
        <span
          className={cn(
            "rounded-full transition-transform scale-100",
            isLg ? "size-2.5" : "size-2",
            isNeon ? "bg-lime-400" : "bg-white"
          )}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
