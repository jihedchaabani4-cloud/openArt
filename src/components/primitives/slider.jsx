/**
 * Slider Primitive — OpenArt / Labveil Unified Design System
 *
 * STRICT ARCHITECTURAL RULES:
 * 1. ZERO CALL-SITE RESTYLING: Never add ad-hoc background, border, or thumb colors.
 * 2. USE CANONICAL VARIANTS: `variant="default" | "bar" | "stepped"`.
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
  minSelectable,
  showTicks = true,
  disabled = false,
  ...props
}, ref) => {
  const isSm = size === "sm";
  const isBar = variant === "bar";
  const isStepped = variant === "stepped";

  // Normalize single number to array for Radix Slider
  const normalizedValue = React.useMemo(() => {
    if (value === undefined) return undefined;
    return Array.isArray(value) ? value : [Number(value) || 0];
  }, [value]);

  const normalizedDefaultValue = React.useMemo(() => {
    if (defaultValue === undefined) return undefined;
    return Array.isArray(defaultValue) ? defaultValue : [Number(defaultValue) || 0];
  }, [defaultValue]);

  const handleValueChange = React.useCallback(
    (nextValues) => {
      if (!onValueChange) return;
      if (minSelectable !== undefined && Array.isArray(nextValues)) {
        const clamped = nextValues.map((v) => Math.max(minSelectable, v));
        onValueChange(clamped);
        return;
      }
      onValueChange(nextValues);
    },
    [onValueChange, minSelectable]
  );

  // Compute interior tick percentages (e.g., for min=0, max=5, step=1 -> 20%, 40%, 60%, 80%)
  const tickPercentages = React.useMemo(() => {
    if (!isStepped || !showTicks || step <= 0 || max <= min) return [];
    const totalSteps = Math.round((max - min) / step);
    if (totalSteps <= 1 || totalSteps > 20) return [];
    const ticks = [];
    for (let i = 1; i < totalSteps; i += 1) {
      ticks.push((i / totalSteps) * 100);
    }
    return ticks;
  }, [isStepped, showTicks, min, max, step]);

  const currentNumeric =
    normalizedValue?.[0] ?? normalizedDefaultValue?.[0] ?? min;
  const isFull = currentNumeric >= max;

  if (isStepped) {
    return (
      <SliderPrimitive.Root
        ref={ref}
        data-slot="slider"
        data-variant="stepped"
        data-size={size}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={normalizedValue}
        defaultValue={normalizedDefaultValue}
        onValueChange={handleValueChange}
        className={cn(
          "ds-slider-stepped",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="ds-slider-stepped-track"
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            data-full={isFull ? "true" : undefined}
            className="ds-slider-stepped-range"
          />
          {tickPercentages.map((pct) => (
            <span
              key={pct}
              data-slot="slider-tick"
              aria-hidden="true"
              className="ds-slider-stepped-tick"
              style={{ left: `${pct}%` }}
            />
          ))}
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          aria-label={props["aria-label"]}
          className="ds-slider-stepped-thumb"
        />
      </SliderPrimitive.Root>
    );
  }

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
      onValueChange={handleValueChange}
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
