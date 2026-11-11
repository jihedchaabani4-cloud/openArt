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
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative w-full grow overflow-hidden transition-colors",
          isBar
            ? "h-full rounded-[var(--r-sm)] bg-transparent"
            : cn("rounded-full bg-[var(--overlay-20)] hover:bg-[var(--overlay-10)]", isSm ? "h-1" : "h-1.5")
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute h-full transition-all",
            isBar ? "bg-[var(--overlay-10)]" : "bg-[var(--brand)]"
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        data-slot="slider-thumb"
        className={cn(
          "block transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-border-on)] disabled:pointer-events-none cursor-pointer",
          isBar
            ? "w-1.5 h-5 rounded-full bg-[var(--text-primary)] shadow-none"
            : cn("rounded-full bg-[var(--text-primary)] hover:scale-110", isSm ? "size-3" : "size-4")
        )}
      />
    </SliderPrimitive.Root>
  );
});

Slider.displayName = "Slider";

export { Slider };
export default Slider;
