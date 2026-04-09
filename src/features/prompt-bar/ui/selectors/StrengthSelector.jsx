"use client"
import React from "react"
import { BaseSelect, useSelectLogic } from "./SelectorBase";
import { Image as ImageIcon } from "lucide-react";

export function StrengthSelector({ value, onChange }) {
  const options = React.useMemo(() => ["25%", "50%", "75%", "90%"], []);
  
  const groups = React.useMemo(() => [
    {
      items: options.map(opt => ({
        value: opt,
        label: opt,
        icon: <ImageIcon size={14} className="opacity-60" />
      }))
    }
  ], [options]);

  const triggerIcon = React.useMemo(() => <ImageIcon size={14} className="opacity-60" />, []);

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
