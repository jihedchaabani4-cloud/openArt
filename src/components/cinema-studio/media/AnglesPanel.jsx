"use client";

import * as React from "react";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import { Label } from "@/components/base/label";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Slider } from "@/components/primitives/slider";
import { CameraAngleSphere } from "@/components/cinema-studio/media/CameraAngleSphere";
import { cn } from "@/shared/lib/utils";

export const ANGLES_RANGES = Object.freeze({
  rotation: Object.freeze({ min: -180, max: 180, step: 1 }),
  tilt: Object.freeze({ min: -90, max: 90, step: 1 }),
  zoom: Object.freeze({ min: 0, max: 10, step: 1 }),
});

export const ANGLES_DEFAULT_POSE = Object.freeze({
  rotation: 0,
  tilt: 0,
  zoom: 0,
});

export const ANGLES_PRESETS = Object.freeze([
  Object.freeze({ id: "three-quarter-left", label: "3/4 Left", rotation: -45, tilt: 0, zoom: 0 }),
  Object.freeze({ id: "three-quarter-right", label: "3/4 Right", rotation: 45, tilt: 0, zoom: 0 }),
  Object.freeze({ id: "back-view", label: "Back View", rotation: 180, tilt: 0, zoom: 0 }),
  Object.freeze({ id: "side-left", label: "Side Left", rotation: -90, tilt: 0, zoom: 0 }),
  Object.freeze({ id: "side-right", label: "Side Right", rotation: 90, tilt: 0, zoom: 0 }),
  Object.freeze({ id: "close-up", label: "Close-Up", rotation: 0, tilt: 0, zoom: 6 }),
  Object.freeze({ id: "low-angle", label: "Low Angle", rotation: 0, tilt: -30, zoom: 1 }),
  Object.freeze({ id: "high-angle", label: "High Angle", rotation: 0, tilt: 35, zoom: 0 }),
  Object.freeze({ id: "top-down", label: "Top-Down", rotation: 0, tilt: 80, zoom: 0 }),
]);

export const ANGLES_DEFAULT_RESOLUTION = "1k";
export const ANGLES_DEFAULT_CREDIT_COST = 12;

/**
 * AnglesPanel
 * Prop-driven In-Place Image Edit panel for virtual Camera Pose (`rotation`, `tilt`, `zoom`).
 * Reuses the canonical Grid Size stepped Slider (`variant="stepped"`) and DESIGN.md tokens exclusively.
 *
 * Props:
 * - `previewUrl`: string | null — active workflow Primary Media preview URL
 * - `isSubmitting`: boolean — true while POST /api/images/angles is in flight
 * - `isPrimaryProcessing`: boolean — true while workflow Primary Media is still processing
 * - `creditCost`: number — credit cost displayed on the Generate CTA (default 13 for 1k)
 * - `onGenerate`: ({ rotation, tilt, zoom, parameters }) => void
 * - `onBack`: () => void — invoked on `<` back button (defaults to `onClose`)
 * - `onClose`: () => void — invoked on `×` close button
 * - `className`: string — layout positioning only
 */
export function AnglesPanel({
  previewUrl = null,
  isSubmitting = false,
  isPrimaryProcessing = false,
  creditCost = ANGLES_DEFAULT_CREDIT_COST,
  onGenerate,
  onBack,
  onClose,
  className,
}) {
  const [pose, setPose] = React.useState(ANGLES_DEFAULT_POSE);

  const isNoOp = pose.rotation === 0 && pose.tilt === 0 && pose.zoom === 0;
  const isBusy = isSubmitting || isPrimaryProcessing;
  const isGenerateDisabled = isNoOp || isBusy;

  const updateAxis = React.useCallback((axis, value) => {
    const { min, max } = ANGLES_RANGES[axis];
    const clamped = Math.min(max, Math.max(min, Math.round(Number(value) || 0)));
    setPose((prev) => (prev[axis] === clamped ? prev : { ...prev, [axis]: clamped }));
  }, []);

  const handleReset = React.useCallback(() => {
    setPose(ANGLES_DEFAULT_POSE);
  }, []);

  const applyPreset = React.useCallback((preset) => {
    setPose({
      rotation: preset.rotation,
      tilt: preset.tilt,
      zoom: preset.zoom,
    });
  }, []);

  const handleSubmit = React.useCallback(() => {
    if (isGenerateDisabled || !onGenerate) return;
    onGenerate({
      rotation: pose.rotation,
      tilt: pose.tilt,
      zoom: pose.zoom,
      parameters: { resolution: ANGLES_DEFAULT_RESOLUTION },
    });
  }, [isGenerateDisabled, onGenerate, pose]);

  return (
    <section
      aria-label="Angles camera pose editor"
      data-slot="angles-panel"
      className={cn(
        "flex flex-col h-full ds-edit-sidebar-rail rounded-comfortable bg-omni-bg border border-border-subtle overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <IconButton
            type="button"
            variant="tonal"
            size="sm"
            aria-label="Back"
            onClick={onBack || onClose}
          >
            <HugeIcon name="arrow-left-01" size="sm" />
          </IconButton>

          <h2 className="ds-type-caption-label text-text-primary truncate">
            Angles
          </h2>
        </div>

        <IconButton
          type="button"
          variant="tonal"
          size="sm"
          aria-label="Close Angles"
          onClick={onClose}
        >
          <HugeIcon name="cancel-01" size="sm" />
        </IconButton>
      </header>

      {/* Body: 3D Sphere + Stepped Sliders */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-2.5">
        <CameraAngleSphere
          rotation={pose.rotation}
          tilt={pose.tilt}
          zoom={pose.zoom}
          previewUrl={previewUrl}
          onChange={setPose}
          onReset={handleReset}
          disabled={isSubmitting}
        />

        {/* Quick Camera Angle Templates */}
        <div className="flex flex-col gap-1.5" data-slot="angles-presets">
          <div className="flex items-center justify-between px-0.5">
            <Label as="span">Templates</Label>
            {!isNoOp && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={isSubmitting}
                onClick={handleReset}
                className="ds-type-small"
              >
                Reset
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {ANGLES_PRESETS.map((preset) => {
              const isActive =
                pose.rotation === preset.rotation &&
                pose.tilt === preset.tilt &&
                pose.zoom === preset.zoom;
              return (
                <Button
                  key={preset.id}
                  type="button"
                  variant={isActive ? "primary" : "tonal"}
                  size="s"
                  aria-pressed={isActive}
                  disabled={isSubmitting}
                  onClick={() => applyPreset(preset)}
                  className="w-full justify-center px-1.5 ds-type-micro-tag"
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Slider
            variant="stepped"
            showTicks={false}
            min={ANGLES_RANGES.rotation.min}
            max={ANGLES_RANGES.rotation.max}
            step={ANGLES_RANGES.rotation.step}
            value={[pose.rotation]}
            onValueChange={([v]) => updateAxis("rotation", v)}
            onDoubleClick={() => updateAxis("rotation", 0)}
            label="Rotation"
            valueLabel={`${pose.rotation}°`}
            aria-label="Rotation"
            title="Double-click to reset Rotation"
            disabled={isSubmitting}
          />

          <Slider
            variant="stepped"
            showTicks={false}
            min={ANGLES_RANGES.tilt.min}
            max={ANGLES_RANGES.tilt.max}
            step={ANGLES_RANGES.tilt.step}
            value={[pose.tilt]}
            onValueChange={([v]) => updateAxis("tilt", v)}
            onDoubleClick={() => updateAxis("tilt", 0)}
            label="Tilt"
            valueLabel={`${pose.tilt}°`}
            aria-label="Tilt"
            title="Double-click to reset Tilt"
            disabled={isSubmitting}
          />

          <Slider
            variant="stepped"
            showTicks={false}
            min={ANGLES_RANGES.zoom.min}
            max={ANGLES_RANGES.zoom.max}
            step={ANGLES_RANGES.zoom.step}
            value={[pose.zoom]}
            onValueChange={([v]) => updateAxis("zoom", v)}
            onDoubleClick={() => updateAxis("zoom", 0)}
            label="Zoom"
            valueLabel={`${pose.zoom}`}
            aria-label="Zoom"
            title="Double-click to reset Zoom"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Footer CTA (DESIGN.md pure white Primary CTA) */}
      <footer className="p-3 border-t border-border-subtle shrink-0">
        <Button
          type="button"
          variant="cta-lg"
          disabled={isGenerateDisabled}
          onClick={handleSubmit}
          className="w-full h-9 ds-type-button"
        >
          {isBusy ? (
            <span>{isSubmitting ? "Starting…" : "Processing…"}</span>
          ) : (
            <>
              <span>Generate</span>
              <span className="font-mono tabular-nums opacity-75">{creditCost}</span>
            </>
          )}
        </Button>
      </footer>
    </section>
  );
}

export default AnglesPanel;
