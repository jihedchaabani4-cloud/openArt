"use client"
import React from "react"
import { BaseSelector } from "./BaseSelector";

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

  // Calculate percentage
  const percentage = React.useMemo(() => {
    if (max === min) return 0;
    return ((numericValue - min) / (max - min)) * 100;
  }, [numericValue, min, max]);

  const handleSliderChange = (e) => {
    const newVal = e.target.value;
    onChange(`${newVal}${unit}`);
  };

  // Fallback to normal select dropdown if there are fewer than 3 items
  // (We declare this conditionally AFTER all hooks have been declared unconditionally!)
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

  // Otherwise, use the custom slider selector
  return (
    <div role="group" aria-label="Duration" className={`w-full p-1.5 bg-white/5 rounded-2xl ${className || ""}`} data-rac="" data-orientation="horizontal">
      <div className="group relative w-full h-8 rounded-xl overflow-hidden  transition-colors" data-rac="" data-orientation="horizontal" style={{ position: "relative", touchAction: "none" }}>
        {/* Invisible Input on top to capture clicks/drags natively */}
        <input 
          tabIndex={0} 
          id="duration-range-input" 
          aria-labelledby="duration-range-input" 
          min={min} 
          max={max} 
          step={step} 
          aria-orientation="horizontal" 
          aria-valuetext={`${numericValue}${unit}`} 
          type="range" 
          value={numericValue}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
        />

        {/* Output Text Value */}
        <output htmlFor="duration-range-input" aria-live="off" className="text-white text-[13px] font-semibold text-left absolute top-1/2 -translate-y-1/2 left-3 z-10 pointer-events-none select-none">
          {numericValue}{unit}
        </output>

        {/* Left Track Fill */}
        <div className="absolute h-full inset-0 bg-white/15 pointer-events-none" style={{ width: `${percentage}%` }}></div>

        {/* Thumb Indicator */}
        <div className="h-full top-1/2 bg-transparent w-1 border-transparent border border-solid outline-hidden pointer-events-none" data-rac="" style={{ position: "absolute", left: `${percentage}%`, transform: "translate(-50%, -50%)" }}>
          <div className="thumb w-[3px] h-[55%] rounded-full bg-white absolute top-1/2 -translate-y-1/2"></div>
        </div>
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
