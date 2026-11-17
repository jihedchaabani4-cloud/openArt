"use client"
import React from "react";
import { BaseSelector } from "./BaseSelector";

const DEFAULT_RESOLUTIONS = ["1K", "2K", "4K"];

export const QualitySelector = React.memo(({ value, onChange, options, className }) => {
  const items = React.useMemo(() => (options
    ? options.map(o => typeof o === "string" ? o : o.value)
    : DEFAULT_RESOLUTIONS).map(v => ({ value: v, label: v })), [options]);

  return (
    <BaseSelector
      value={value}
      onChange={onChange}
      options={items}
      className={className}
    />
  );
});
