"use client";

import React, { useMemo } from "react";
import { BaseSelect, useSelectLogic } from "../ui/common/selectors/DropdownEngine.jsx";
import { Badge } from "@/shared/ui/badge";
import { usePromptBarStore } from "../store/usePromptBarStore.js";
import { resolveModelIcon } from "../core/modelManagement.js";

/**
 * ModelSelectorPlatform
 * Prompt Bar Platform — Model selector built with the production DropdownEngine (BaseSelect).
 *
 * Reuses the existing ready-made production dropdown engine:
 * - Portal-rendered (immune to container overflow clipping)
 * - Click-to-toggle (no hover opening)
 * - Outside-click detection and smart dropup/dropdown positioning
 * - Production avatars, badges, and checkmarks
 *
 * Props:
 *   supportedDomains: string[] — domain filter (from composition type)
 *   disabled: boolean (optional)
 */
export function ModelSelectorPlatform({ models: explicitModels, supportedDomains = [], disabled = false }) {
  const modelsMap   = usePromptBarStore((s) => s.modelsMap);
  const selectedId  = usePromptBarStore((s) => s.selectedModelId);
  const selectModel = usePromptBarStore((s) => s.selectModel);

  const models = useMemo(() => {
    if (explicitModels && Array.isArray(explicitModels)) {
      return explicitModels;
    }
    const all = Object.values(modelsMap);
    if (!supportedDomains.length) return all;
    return all.filter((m) => supportedDomains.includes(m.domain));
  }, [explicitModels, modelsMap, supportedDomains]);

  const selected = useMemo(() => {
    if (modelsMap[selectedId]) return modelsMap[selectedId];
    if (models.length > 0) {
      return models.find((m) => m.id === selectedId || m.key === selectedId) || models[0];
    }
    return null;
  }, [modelsMap, selectedId, models]);

  const groups = useMemo(() => [
    {
      label: models.length === 0 ? "No models available" : "Available Models",
      items: models.map((m) => ({
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
        image: resolveModelIcon(m),
        subtitle: m.description,
      })),
    },
  ], [models]);

  const selectedIcon = useMemo(() => resolveModelIcon(selected), [selected]);

  const triggerIcon = useMemo(() => {
    if (selectedIcon) {
      return (
        <img
          src={selectedIcon}
          alt={selected?.name || "Model icon"}
          className="size-[18px] rounded-[3px] object-contain brightness-0 invert shrink-0"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      );
    }
    return (
      <span className="size-[18px] rounded-[3px] bg-white/10 text-[10px] text-white/60 flex items-center justify-center font-medium shrink-0">
        {selected?.name?.charAt(0).toUpperCase() || "M"}
      </span>
    );
  }, [selectedIcon, selected?.name]);

  const logic = useSelectLogic(selectedId, selectModel);

  if (models.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-[12px]">
        <span>No models</span>
      </div>
    );
  }

  return (
    <BaseSelect
      {...logic}
      value={selectedId}
      displayLabel={selected?.name ?? "Select model"}
      triggerIcon={triggerIcon}
      groups={groups}
      iconVariant="square"
      variant="flow"
    />
  );
}
