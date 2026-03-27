"use client"
import React from "react"
import { BaseSelect, useSelectLogic } from "./SelectorBase";

const DEFAULT_RESOLUTIONS = [
  { value: "720p",  label: "720p (HD)"       },
  { value: "1080p", label: "1080p (Full HD)"  },
  { value: "4K",    label: "4K (Ultra HD)"    },
];

export function VideoResolutionSelector({ value, onChange, options }) {
  const items = React.useMemo(() => options
    ? options.map(o => typeof o === "string" ? { value: o, label: o } : { value: o.value, label: o.label })
    : DEFAULT_RESOLUTIONS, [options]);

  const groups = React.useMemo(() => [
    {
      items: items.map(item => ({
        value: item.value,
        label: item.label
      }))
    }
  ], [items]);

  const logic = useSelectLogic(value, onChange);
  const currentItem = groups.flatMap(g => g.items).find(it => String(it.value) === String(value));
  const displayLabel = currentItem?.label ?? String(value);

  return (
    <BaseSelect
      {...logic}
      value={value}
      displayLabel={displayLabel}
      groups={groups}
    />
  );
}
