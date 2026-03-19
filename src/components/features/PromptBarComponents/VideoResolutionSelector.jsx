"use client"

import React from "react";
import { SelectorBase } from "./SelectorBase";
import { Monitor, Zap } from "lucide-react";

export function VideoResolutionSelector({ value, onChange }) {
  const RESOLUTIONS = [
    { value: "720p", label: "720p (HD)", icon: Zap },
    { value: "1080p", label: "1080p (Full HD)", icon: Monitor },
    { value: "4K", label: "4K (Ultra HD)", icon: Monitor },
  ];

  return (
    <SelectorBase
      label="Resolution"
      icon={Monitor}
      triggerValue={value}
      items={RESOLUTIONS}
      currentValue={value}
      onSelect={onChange}
      contentClassName="min-w-[180px]"
    />
  );
}
