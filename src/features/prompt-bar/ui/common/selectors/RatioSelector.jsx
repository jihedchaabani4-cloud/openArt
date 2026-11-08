"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";
import { BaseSelector } from "./BaseSelector";

export const RatioIcon = ({ ratio, isSelected }) => {
  if (!ratio || typeof ratio !== "string" || !ratio.includes(":")) return null;
  const [w, h] = ratio.split(":").map(Number);
  if (isNaN(w) || isNaN(h) || w === 0 || h === 0) return null;
  const CW = 32, CH = 24, maxDim = Math.max(w, h), normW = w / maxDim, normH = h / maxDim;
  const PAD = 2, maxW = CW - PAD * 2, maxH = CH - PAD * 2;
  const scale = Math.min(maxW / normW, maxH / normH);
  const rw = Math.max(Math.round(normW * scale), 6), rh = Math.max(Math.round(normH * scale), 6);
  const x = (CW - rw) / 2, y = (CH - rh) / 2;
  return (
    <div className={cn("flex items-center justify-center rounded-sm w-8 h-6 text-on-surface")}>
      <svg width={CW} height={CH} viewBox={`0 0 ${CW} ${CH}`} fill="none">
        <rect x={x + 0.5} y={y + 0.5} width={rw - 1} height={rh - 1} rx="2" stroke="currentColor" strokeWidth={isSelected ? "2" : "1.4"} />
      </svg>
    </div>
  );
};

const DEFAULT_RATIOS = [
  "21:9", "16:9", "3:2", "4:3", "1:1", "5:4", "4:5", "3:4", "2:3", "9:16"
];

const getRatioValue = (ratioStr) => {
  const [w, h] = ratioStr.split(":").map(Number);
  return w / h;
};

export const RatioSelector = React.memo(({ value, onChange, options, className }) => {
  const items = React.useMemo(() => (options ? options.map(o => typeof o === "string" ? o : o.value) : DEFAULT_RATIOS)
    .sort((a, b) => getRatioValue(a) - getRatioValue(b))
    .map(ratio => ({
        value: ratio,
        label: ratio,
        icon: <RatioIcon ratio={ratio} />
    })), [options]);

  return (
    <BaseSelector
      value={value}
      onChange={onChange}
      options={items}
      className={className}
    />
  );
});