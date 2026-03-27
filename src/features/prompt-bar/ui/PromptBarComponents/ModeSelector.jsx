// src/features/prompt-bar/ui/PromptBarComponents/ModeSelector.jsx
// ✅ Cleaned up version
"use client";
import React from "react";
import { BaseSelect, useSelectLogic } from "./SelectorBase";
import { Image, Film, Wand2, Layers } from "lucide-react";

export const MODES = [
  { id: "image",          label: "Image",     fullLabel: "Generate Image",  icon: <Image size={14} /> },
  { id: "keyframe",       label: "Keyframe",  fullLabel: "Keyframe Video",  icon: <Film  size={14} /> },
  { id: "multiref",       label: "Multi Ref", fullLabel: "Multi Ref Video", icon: <Layers size={14} /> },
  { id: "motion-control", label: "Control",   fullLabel: "Motion Control",  icon: <Wand2 size={14} /> },
];

export function ModeSelector({ value, onChange }) {
  const currentMode = MODES.find((m) => m.id === value) ?? MODES[0];
  
  const groups = React.useMemo(() => [
    {
      items: MODES.map(m => ({
        value: m.id,
        label: m.fullLabel,
        icon: m.icon
      }))
    }
  ], []);

  const triggerIcon = React.useMemo(() => currentMode.icon, [currentMode.icon]);

  const logic = useSelectLogic(value, onChange);
  const currentItem = groups.flatMap(g => g.items).find(it => String(it.value) === String(value));
  const displayLabel = currentItem?.label ?? currentMode.label;

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
