"use client"

import React from "react";
import { SelectorBase } from "./SelectorBase";

const RATIOS = [
  "21:9", "16:9", "3:2", "7:5", "4:3", "5:4",
  "1:1", "9:16", "2:3", "5:7", "3:4", "4:5"
];

export function RatioSelector({ value, onChange }) {
  const TrigIcon = (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="opacity-60">
       <rect x="1.5" y="4.5" width="13" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );

  return (
    <SelectorBase
      label="ASPECT RATIO"
      icon={TrigIcon}
      triggerValue={value}
      items={RATIOS}
      currentValue={value}
      onSelect={onChange}
      contentClassName="max-w-[340px]"
      listClassName="grid grid-cols-6 gap-y-5 gap-x-2"
      itemClassName="flex flex-col items-center gap-2 py-2 rounded-lg"
    />
  );
}
