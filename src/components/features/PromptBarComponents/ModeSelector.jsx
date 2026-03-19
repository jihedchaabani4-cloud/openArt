"use client"

import React from "react"
import { SelectorBase } from "./SelectorBase"
import { Image, Film, Video, Wand2 } from "lucide-react"

export const MODES = [
  { id: "image", label: "Image", fullLabel: "Generate Image", icon: Image },
  { id: "video", label: "Video", fullLabel: "Generate Video", icon: Film },
  { id: "motion", label: "Motion", fullLabel: "Generate Motion", icon: Video },
  { id: "motion-control", label: "Control", fullLabel: "Motion Control", icon: Wand2 },
]

export function ModeSelector({ value, onChange }) {
  const currentMode = MODES.find(m => m.id === value) || MODES[0]

  return (
    <SelectorBase
      icon={currentMode.icon}
      triggerValue={currentMode.label}
      items={MODES.map(m => ({ value: m.id, label: m.fullLabel, icon: m.icon }))}
      currentValue={value}
      onSelect={onChange}
    />
  )
}
