"use client"
import React from "react";
import { BaseSelector } from "./BaseSelector";

const DEFAULT_RESOLUTIONS = [
  { value: "720p",  label: "720p"       },
  { value: "1080p", label: "1080p"  },
  { value: "4K",    label: "4K"    },
];

export const VideoResolutionSelector = React.memo(({ value, onChange, options, className }) => {
  const items = React.useMemo(() => (options
    ? options.map(o => typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label })
    : DEFAULT_RESOLUTIONS), [options]);

  return (
    <BaseSelector
      value={value}
      onChange={onChange}
      options={items}
      className={className}
    />
  );
});
