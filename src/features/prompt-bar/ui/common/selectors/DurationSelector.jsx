"use client"
import React from "react"
import { BaseSelector } from "./BaseSelector";

const DEFAULT_DURATIONS = ["5s", "10s", "15s"];

export const DurationSelector = React.memo(({ value, onChange, options, className }) => {
  const items = React.useMemo(() => (options
    ? buildDurationItems(options)
    : DEFAULT_DURATIONS).map(v => ({ value: v, label: v })), [options]);

  return (
    <BaseSelector
      value={value}
      onChange={onChange}
      options={items}
      className={className}
    />
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
