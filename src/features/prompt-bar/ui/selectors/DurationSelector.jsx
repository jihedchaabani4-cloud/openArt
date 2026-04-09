"use client"
import React from "react"
import { BaseSelect, useSelectLogic } from "./SelectorBase";
import { Clock } from "lucide-react";

const DEFAULT_DURATIONS = ["5s", "10s", "15s"];

export function DurationSelector({ value, onChange, options }) {
  // options comes from selectedModel.support.duration
  // e.g. { min: 3, max: 15, default: 5, step: 1, unit: "s" }
  const items = React.useMemo(() => options
    ? buildDurationItems(options)
    : DEFAULT_DURATIONS, [options]);

  const groups = React.useMemo(() => [
    {
      items: items.map(v => ({ value: v, label: v }))
    }
  ], [items]);

  const triggerIcon = React.useMemo(() => <Clock size={13} />, []);

  const logic = useSelectLogic(value, onChange);
  const currentItem = groups.flatMap(g => g.items).find(it => String(it.value) === String(value));
  const displayLabel = currentItem?.label ?? (typeof value === 'string' ? value : "Select...");

  return (
    <BaseSelect
      {...logic}
      value={value}
      displayLabel={displayLabel}
      triggerIcon={triggerIcon}
      groups={groups}
    />
  );
}

// ── Helper — builds list from min/max/step ───────────────────────────────────
function buildDurationItems({ min, max, step = 1, unit = "s", allowAuto = false }) {
    const items = [];
    if (allowAuto) {
        items.push(`-1${unit}`); // -1s will map to Auto in UI if needed, but value is '-1s'
    }
    for (let i = min; i <= max; i += step) {
        items.push(`${i}${unit}`);
    }
    return items;
}
