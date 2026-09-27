"use client";

import React from "react";
import { SelectControl } from "./SelectControl.jsx";
import { NumberControl } from "./NumberControl.jsx";
import { ToggleControl } from "./ToggleControl.jsx";
import { TextControl } from "./TextControl.jsx";
import { ImageControl } from "./ImageControl.jsx";
import { VideoControl } from "./VideoControl.jsx";

// Directly reuse high-fidelity production UI selectors
import { RatioSelector } from "../ui/common/selectors/RatioSelector.jsx";
import { QualitySelector } from "../ui/common/selectors/QualitySelector.jsx";
import { VideoResolutionSelector } from "../ui/common/selectors/VideoResolutionSelector.jsx";
import { VariationSelector } from "../ui/common/selectors/VariationSelector.jsx";
import { DurationSelector } from "../ui/common/selectors/DurationSelector.jsx";

/**
 * ParameterControl
 * Prompt Bar Platform — Central control router.
 *
 * Dispatches parameters to specialized production UI selectors when matching semantic parameter names,
 * or falls back to the generic typed controls.
 *
 * Special Presenters:
 * - aspect_ratio / ratio  → RatioSelector (dynamic SVG aspect ratio icons)
 * - quality               → QualitySelector (1K, 2K, 4K segmented chips)
 * - video_resolution      → VideoResolutionSelector (720p, 1080p, 4K)
 * - duration              → DurationSelector (5s, 10s...)
 * - count / variations    → VariationSelector (x1, x2, x4)
 * - select                → SelectControl (powered by BaseSelector)
 */

/** @type {Record<string, React.ComponentType>} */
const CONTROL_REGISTRY = Object.freeze({
  select:  SelectControl,
  number:  NumberControl,
  boolean: ToggleControl,
  text:    TextControl,
  image:   ImageControl,
  video:   VideoControl,
  // "image[]" and "video[]" intentionally absent — handled by composition reference slots
});

/**
 * @param {{ definition: object, value: any, onChange: (v: any) => void, error?: string, disabled?: boolean }} props
 */
export function ParameterControl({ definition, value, onChange, error, disabled }) {
  if (!definition) return null;

  const { name, label, type } = definition;

  // 1. Specialized Semantic Route: Aspect Ratio
  if (name === "aspect_ratio" || name === "ratio") {
    return (
      <div className="flex flex-col gap-1 min-w-[140px]">
        {label && (
          <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">
            {label}
          </span>
        )}
        <RatioSelector
          value={value}
          onChange={onChange}
          options={definition.values}
        />
        {error && <span className="text-[10px] text-red-400">{error}</span>}
      </div>
    );
  }

  // 2. Specialized Semantic Route: Image Quality
  if (name === "quality") {
    return (
      <div className="flex flex-col gap-1 min-w-[120px]">
        {label && (
          <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">
            {label}
          </span>
        )}
        <QualitySelector
          value={value}
          onChange={onChange}
          options={definition.values}
        />
        {error && <span className="text-[10px] text-red-400">{error}</span>}
      </div>
    );
  }

  // 3. Specialized Semantic Route: Video Resolution
  const isVideoResolution =
    name === "video_resolution" ||
    (name === "resolution" &&
      Array.isArray(definition.values) &&
      definition.values.some((v) => String(v?.value || v).toLowerCase().endsWith("p")));

  if (isVideoResolution) {
    return (
      <div className="flex flex-col gap-1 min-w-[120px]">
        {label && (
          <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">
            {label}
          </span>
        )}
        <VideoResolutionSelector
          value={value}
          onChange={onChange}
          options={definition.values}
        />
        {error && <span className="text-[10px] text-red-400">{error}</span>}
      </div>
    );
  }

  // 4. Specialized Semantic Route: Duration
  if (name === "duration") {
    const durationOptions =
      definition.values ||
      (definition.min !== undefined && definition.max !== undefined
        ? { min: definition.min, max: definition.max, step: definition.step }
        : undefined);

    return (
      <div className="flex flex-col gap-1 min-w-[130px]">
        {label && (
          <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">
            {label}
          </span>
        )}
        <DurationSelector
          value={value}
          onChange={onChange}
          options={durationOptions}
        />
        {error && <span className="text-[10px] text-red-400">{error}</span>}
      </div>
    );
  }

  // 5. Specialized Semantic Route: Variations / Count
  if (name === "count" || name === "variations") {
    return (
      <div className="flex flex-col gap-1 min-w-[100px]">
        {label && (
          <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">
            {label}
          </span>
        )}
        <VariationSelector
          value={value}
          onChange={onChange}
        />
        {error && <span className="text-[10px] text-red-400">{error}</span>}
      </div>
    );
  }

  // 6. Generic Type Router
  const Control = CONTROL_REGISTRY[type];
  if (!Control) return null;

  return (
    <Control
      definition={definition}
      value={value}
      onChange={onChange}
      error={error}
      disabled={disabled}
    />
  );
}
