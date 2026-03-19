"use client"

import React from "react";
import { SelectorBase } from "./SelectorBase";
import { Clock } from "lucide-react";

const DURATION_OPTIONS = ["5s", "10s", "12s"];

export function DurationSelector({ value, onChange }) {
  return (
    <SelectorBase
      label="Duration"
      icon={Clock}
      triggerValue={value}
      items={DURATION_OPTIONS}
      currentValue={value}
      onSelect={onChange}
      contentClassName="min-w-[120px]"
    />
  );
}
