"use client"
import React from "react"
import { BaseSelect, useSelectLogic } from "./SelectorBase";
import { Layers } from "lucide-react";

const VARIATION_OPTIONS = [1, 3, 6, 9, 12];

export function VariationSelector({ value, onChange }) {
  const groups = React.useMemo(() => [
    {
      items: VARIATION_OPTIONS.map(v => ({ value: v, label: String(v) }))
    }
  ], []);

  const triggerIcon = React.useMemo(() => <Layers size={13} />, []);

  const logic = useSelectLogic(value, onChange);
  const currentItem = groups.flatMap(g => g.items).find(it => String(it.value) === String(value));
  const displayLabel = currentItem?.label ?? String(value);

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
