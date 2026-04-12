"use client"

import React, { useState, useEffect } from "react"
import { BaseSelect, useSelectLogic } from "./DropdownEngine"
import { Badge } from "@/shared/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar"

// ─── Icons ────────────────────────────────────────────────────────────────────
const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.7368 2.60967C12.6694 2.25593 12.3601 2 12 2C11.6399 2 11.3306 2.25593 11.2632 2.60967C10.7844 5.12353 9.83969 7.03715 8.43842 8.43842C7.03715 9.83969 5.12353 10.7844 2.60967 11.2632C2.25593 11.3306 2 11.6399 2 12C2 12.3601 2.25593 12.6694 2.60967 12.7368C5.12353 13.2156 7.03715 14.1603 8.43842 15.5616C9.83969 16.9629 10.7844 18.8765 11.2632 21.3903C11.3306 21.7441 11.6399 22 12 22C12.3601 22 12.6694 21.7441 12.7368 21.3903C13.2156 18.8765 14.1603 16.9629 15.5616 15.5616C16.9629 14.1603 18.8765 13.2156 21.3903 12.7368C21.7441 12.6694 22 12.3601 22 12C22 11.6399 21.3903 11.2632C18.8765 10.7844 16.9629 9.83969 15.5616 8.43842C14.1603 7.03715 13.2156 5.12353 12.7368 2.60967Z" />
  </svg>
)

// ─── Model Avatar ─────────────────────────────────────────────────────────────
const ModelAvatar = ({ src, label }) => {
  return (
    <Avatar className="size-6 bg-transparent gap-1 shrink-0 border-none">
      <AvatarImage 
        src={src} 
        alt={label} 
        className="object-contain brightness-0 invert" 
      />
      <AvatarFallback className="text-[10px] text-white/40 flex items-center justify-center">
        {label?.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────────
// Families are now provided by the backend via dynamicFamilies

export function ModelSelector({ type = "video", defaultId, onChange, dynamicModels, dynamicFamilies, loading }) {
  // Normalize type (e.g., motion-control -> motion)
  const normalizedType = type?.includes("motion") ? "motion" : type

  const mergedModels = React.useMemo(() => {
    return (dynamicModels || []).map(apiModel => {
      let badge = null;
      if (apiModel.requiresPro) {
        badge = "PREMIUM";
      } else if (apiModel.tags?.length > 0) {
        badge = apiModel.tags[0].toUpperCase();
      }

      return {
        id: apiModel.key,
        name: apiModel.displayName || apiModel.key,
        badge,
        subtext: apiModel.tags?.join(" • ") || "",
        type: apiModel.category || "image",
        value: apiModel.key,
        label: apiModel.displayName || apiModel.key,
        image: apiModel.icon, // Use image prop for BaseSelect
        supportedModes: apiModel.supportedModes || [],
        supportsCamera: apiModel.supportsCamera,
      };
    });
  }, [dynamicModels]);

  const filteredAllModels = React.useMemo(() => mergedModels.filter(m => {
    if (normalizedType === "motion") {
      return m.supportedModes.includes("motion") || m.type === "motion" || m.supportsCamera === true;
    }
    if (normalizedType === "keyframe") {
      return m.supportedModes.includes("i2v_se") || m.supportedModes.includes("i2v");
    }
    if (normalizedType === "multiref") {
      return m.supportedModes.includes("r2v");
    }
    return m.type === normalizedType;
  }), [mergedModels, normalizedType]);

  const initialId = defaultId || (filteredAllModels.length > 0 ? filteredAllModels[0].id : null)
  const [selectedId, setSelectedId] = useState(initialId)

  useEffect(() => {
    if (defaultId) {
      setSelectedId(defaultId)
    }
  }, [defaultId])

  useEffect(() => {
    if (selectedId && !filteredAllModels.some(m => m.id === selectedId)) {
      if (filteredAllModels.length > 0) setSelectedId(filteredAllModels[0].id)
    }
  }, [type, filteredAllModels])

  // Always a defined object — never null — avoids early return breaking hooks order
  const selectedModel = filteredAllModels.find(v => v.id === selectedId) || filteredAllModels[0] || {}

  const handleSelect = (value) => {
    const model = filteredAllModels.find(m => m.id === value)
    setSelectedId(value)
    onChange?.(model)
  }

  const groups = React.useMemo(() => [
    { 
      label: filteredAllModels.length === 0 ? `No models for "${type}"` : "All models",
      items: filteredAllModels.length === 0 
        ? [{ value: "__empty__", label: `No models found for this mode`, disabled: true }]
        : filteredAllModels.map(m => ({
            value: m.id,
            label: m.name,
            badge: m.badge && (
              <Badge 
                variant={m.badge === "PREMIUM" ? "premium" : "studio"} 
                className="shrink-0 text-[9px] h-3.5"
              >
                {m.badge}
              </Badge>
            ),
            image: m.image,
            subtitle: m.subtext
          }))
    }
  ], [filteredAllModels, type]);

  const triggerIcon = React.useMemo(() => (
    <ModelAvatar src={selectedModel?.image} label={selectedModel?.name} />
  ), [selectedModel?.image, selectedModel?.name]);

  const triggerPlaceholder = loading 
    ? "Loading..." 
    : filteredAllModels.length === 0 
      ? `No models for "${type}"`
      : (selectedModel?.name ?? "Select model");

  const logic = useSelectLogic(selectedId, handleSelect);
  const currentItem = groups.flatMap(g => g.items).find(it => String(it.value) === String(selectedId));
  const displayLabel = currentItem?.label ?? triggerPlaceholder;

  return (
    <BaseSelect
      {...logic}
      value={selectedId}
      displayLabel={displayLabel}
      triggerIcon={triggerIcon}
      groups={groups}
      iconVariant="square"
    />
  );
}