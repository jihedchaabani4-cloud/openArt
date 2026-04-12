"use client"
import React from "react";
import { BaseSelector } from "./BaseSelector";

const DEFAULT_VARIATIONS = [1, 2, 3, 4];

export const VariationSelector = React.memo(({ value, onChange, className }) => {
  const options = React.useMemo(() => DEFAULT_VARIATIONS.map(v => ({
    value: v,
    label: `x${v}`
  })), []);

  return (
    <BaseSelector
      value={value}
      onChange={onChange}
      options={options}
      className={className}
    />
  );
});
