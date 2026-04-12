"use client"
import React from "react";
import { BaseSelector } from "./BaseSelector";
import { RatioIcon } from "./DropdownEngine";

const DEFAULT_RATIOS = [
  "21:9", "16:9", "3:2", "4:3", "1:1", "5:4", "4:5", "3:4", "2:3", "9:16"
];

const getRatioValue = (ratioStr) => {
  const [w, h] = ratioStr.split(':').map(Number);
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