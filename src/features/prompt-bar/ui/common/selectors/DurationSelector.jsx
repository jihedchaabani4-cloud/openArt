"use client"
import React from "react"
import { BaseSelector } from "./BaseSelector";
import { Slider } from "@/shared/ui/slider";

const DEFAULT_DURATIONS = ["5s", "10s", "15s"];

export const DurationSelector = React.memo(({ value, onChange, options, className }) => {
  // Build items list
  const items = React.useMemo(() => (options
    ? buildDurationItems(options)
    : DEFAULT_DURATIONS).map(v => ({ value: v, label: v })), [options]);

  // Parse min, max, step, unit from options or parsed items
  const { min, max, step, unit } = React.useMemo(() => {
    if (options && typeof options === 'object' && 'min' in options && 'max' in options) {
      return {
        min: Number(options.min),
        max: Number(options.max),
        step: Number(options.step ?? 1),
        unit: options.unit ?? "s"
      };
    }
    
    const numericValues = items.map(item => parseInt(item.value, 10)).filter(n => !isNaN(n));
    if (numericValues.length > 0) {
      const parsedMin = Math.min(...numericValues);
      const parsedMax = Math.max(...numericValues);
      let parsedStep = 1;
      if (numericValues.length > 1) {
        parsedStep = numericValues[1] - numericValues[0];
      }
      return {
        min: parsedMin,
        max: parsedMax,
        step: parsedStep,
        unit: "s"
      };
    }

    return { min: 4, max: 15, step: 1, unit: "s" };
  }, [options, items]);

  // Parse the current value (e.g. "11s" -> 11)
  const numericValue = React.useMemo(() => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return min;
    // Clamp between min and max
    return Math.max(min, Math.min(max, num));
  }, [value, min, max]);

  // Fallback to normal select dropdown if there are fewer than 3 items
  if (items.length < 3) {
    return (
      <BaseSelector
        value={value}
        onChange={onChange}
        options={items}
        className={className}
      />
    );
  }

  // Otherwise, use the canonical slider primitive
  return (
    <div role="group" aria-label="Duration" className={`w-full p-1.5 bg-white/5 rounded-lg ${className || ""}`}>
      <div className="relative w-full h-8 flex items-center">
        <Slider
          variant="bar"
          min={min}
          max={max}
          step={step}
          value={[numericValue]}
          onValueChange={([val]) => onChange(`${val}${unit}`)}
          className="h-8 rounded-sm overflow-hidden"
        />
        <output className="text-white text-[13px] font-semibold text-left absolute left-3 z-10 pointer-events-none select-none">
          {numericValue}{unit}
        </output>
      </div>
    </div>
  );
});

// ── Helper — builds list from min/max/step ───────────────────────────────────
function buildDurationItems({ min, max, step = 1, unit = "s", allowAuto = false }) {
    const items = [];
    if (allowAuto) {
        items.push(`-1${unit}`); 
    }
    for (let i = min; i <= max; i += step) {
        items.push(`${i}${unit}`);
    }
    return items;
}
