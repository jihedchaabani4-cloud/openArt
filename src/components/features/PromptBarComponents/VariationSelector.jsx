"use client"

import React from "react";
import { SelectorBase } from "./SelectorBase";
import { Layers } from "lucide-react";

const VARIATION_OPTIONS = [1, 3, 6, 9, 12];

export function VariationSelector({ value, onChange }) {
  return (
    <SelectorBase
      label="VARIATIONS"
      icon={Layers}
      triggerValue={value}
      items={VARIATION_OPTIONS}
      currentValue={value}
      onSelect={onChange}
      contentClassName="min-w-[120px]"
    />
  );
}
