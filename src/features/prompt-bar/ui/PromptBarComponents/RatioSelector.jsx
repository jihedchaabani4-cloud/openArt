"use client"
import React from "react"
import { BaseSelect, RatioIcon, useSelectLogic } from "./SelectorBase";

// 1. Function bch n7awlou "16:9" l-ra9em (1.77) bch najmou n9arnou binat-hom
const getRatioValue = (ratioStr) => {
  const [w, h] = ratioStr.split(':').map(Number);
  return w / h;
};

const DEFAULT_RATIOS = [
  "21:9", "16:9", "3:2", "4:3", "1:1", "5:4", "4:5", "3:4", "2:3", "9:16"
];

export function RatioSelector({ value, onChange, options }) {
  // 2. Na3mlou tri lél-items (mél-asgher lél-akber kima fl-image: 9:16 -> 21:9)
  const items = React.useMemo(() => (options ? options.map(o => typeof o === "string" ? o : o.value) : DEFAULT_RATIOS)
    .sort((a, b) => getRatioValue(a) - getRatioValue(b)), [options]);

  const TrigIcon = React.useMemo(() => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="opacity-60">
       <rect x="1.5" y="4.5" width="13" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ), []);

  const groups = React.useMemo(() => [
    {
      items: items.map(ratio => ({
        value: ratio,
        label: ratio,
        icon: <RatioIcon ratio={ratio} isSelected={value === ratio} />
      }))
    }
  ], [items, value]);

  const logic = useSelectLogic(value, onChange);
  const currentItem = groups.flatMap(g => g.items).find(it => String(it.value) === String(value));
  const displayLabel = currentItem?.label ?? (typeof value === 'string' ? value : "Select...");

  return (
    <BaseSelect
      {...logic}
      value={value}
      displayLabel={displayLabel}
      triggerIcon={TrigIcon}
      groups={groups}
    />
  );
}