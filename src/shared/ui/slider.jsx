/**
 * Slider Primitive — OpenArt / Labveil Unified Design System
 * 
 * STRICT ARCHITECTURAL RULES:
 * 1. ZERO CALL-SITE RESTYLING: Never add ad-hoc background, border, or thumb colors.
 * 2. USE CANONICAL VARIANTS: `variant="default" | "bar"`.
 * 3. USE CANONICAL SIZES: `size="default" | "sm"`.
 * 4. `className` IS EXCLUSIVELY FOR LAYOUT (e.g. `w-full`, `py-1`).
 */

"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/utils";

const Slider = React.forwardRef(({
  className,
  variant = "default",
  size = "default",
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  ...props
}, ref) => {
  const isSm = size === "sm";
  const isBar = variant === "bar";

  // Normalize single number to array for Radix Slider
  const normalizedValue = React.useMemo(() => {
    if (value === undefined) return undefined;
    return Array.isArray(value) ? value : [Number(value) || 0];
  }, [value]);

  const normalizedDefaultValue = React.useMemo(() => {
    if (defaultValue === undefined) return undefined;
    return Array.isArray(defaultValue) ? defaultValue : [Number(defaultValue) || 0];
  }, [defaultValue]);

  return (
    <SliderPrimitive.Root
      ref={ref}
      data-slot="slider"
      data-variant={variant}
      data-size={size}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={normalizedValue}
      defaultValue={normalizedDefaultValue}
      onValueChange={onValueChange}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        isBar ? "h-8" : isSm ? "h-3" : "h-5",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative w-full grow overflow-hidden transition-colors",
          isBar
            ? "h-full rounded-sm bg-transparent"
            : cn("rounded-full bg-white/20 hover:bg-white/30", isSm ? "h-1" : "h-1.5")
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute h-full transition-all",
            isBar ? "bg-white/15" : "bg-white"
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className={cn(
          "block transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none cursor-pointer",
          isBar
            ? "w-1 h-5 rounded-full bg-white shadow-none"
            : cn("rounded-full bg-white hover:scale-110", isSm ? "size-3" : "size-4")
        )}
      />
    </SliderPrimitive.Root>
  );
});

Slider.displayName = "Slider";

export { Slider };
