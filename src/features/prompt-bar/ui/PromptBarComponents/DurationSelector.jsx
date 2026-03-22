"use client"

import React from "react";
import { SelectorBase } from "./SelectorBase";
import { Clock } from "lucide-react";

const DEFAULT_DURATIONS = ["5s", "10s", "15s"];

export function DurationSelector({ value, onChange, options }) {
  // options comes from selectedModel.support.duration
  // e.g. { min: 3, max: 15, default: 5, step: 1, unit: "s" }
  const items = options
    ? buildDurationItems(options)
    : DEFAULT_DURATIONS;

  return (
    <SelectorBase
      label="Duration"
      icon={Clock}
      triggerValue={value}
      items={items}
      currentValue={value}
      onSelect={onChange}
      contentClassName="min-w-[120px]"
    />
  );
}

// ── Helper — builds list from min/max/step ───────────────────────────────────
function buildDurationItems({ min, max, step = 1, unit = "s" }) {
    const items = [];
    for (let i = min; i <= max; i += step) {
        items.push(`${i}${unit}`);
    }
    return items;
}
