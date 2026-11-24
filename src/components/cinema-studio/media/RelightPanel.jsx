"use client";

import * as React from "react";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Slider } from "@/components/primitives/slider";
import { RelightSphere } from "@/components/cinema-studio/media/RelightSphere";
import { normalizeRelightHexColor } from "@/features/workflows/api/mutations/useImageRelightEdit";
import { cn } from "@/shared/lib/utils";

export const RELIGHT_RANGES = Object.freeze({
  brightness: Object.freeze({ min: 0, max: 100, step: 1 }),
  size: Object.freeze({ min: 0, max: 100, step: 1 }),
  rotation: Object.freeze({ min: -180, max: 180, step: 1 }),
  tilt: Object.freeze({ min: -90, max: 90, step: 1 }),
  distance: Object.freeze({ min: 0, max: 100, step: 1 }),
});

export const RELIGHT_DEFAULT_SETTINGS = Object.freeze({
  light_type: "soft",
  brightness: 50,
  color: "#FFFFFF",
  size: 50,
  rotation: 0,
  tilt: 0,
  distance: 50,
});

export const RELIGHT_COLOR_SWATCHES = Object.freeze([
  Object.freeze({ label: "Neutral White", hex: "#FFFFFF" }),
  Object.freeze({ label: "Warm Daylight", hex: "#FFF1D6" }),
  Object.freeze({ label: "Tungsten", hex: "#FFD4A3" }),
  Object.freeze({ label: "Golden Sunset", hex: "#FFA95C" }),
  Object.freeze({ label: "Ember Red", hex: "#FF6B4A" }),
  Object.freeze({ label: "Neon Pink", hex: "#FF4FA3" }),
  Object.freeze({ label: "Ultraviolet", hex: "#9B7BFF" }),
  Object.freeze({ label: "Cyber Cyan", hex: "#38E8FF" }),
  Object.freeze({ label: "Moonlight Blue", hex: "#8EC5FF" }),
]);

export const RELIGHT_DEFAULT_RESOLUTION = "1k";
export const RELIGHT_DEFAULT_CREDIT_COST = 12;

/**
 * RelightPanel
 * Prop-driven In-Place Image Edit panel for single-light Relighting (`POST /api/images/relight`).
 * Reuses the canonical Grid Size stepped Slider (`variant="stepped"`) and DESIGN.md tokens exclusively.
 *
 * Props:
 * - `previewUrl`: string | null — active workflow Primary Media preview URL
 * - `isSubmitting`: boolean — true while POST /api/images/relight is in flight
 * - `isPrimaryProcessing`: boolean — true while workflow Primary Media is still processing
 * - `creditCost`: number — credit cost displayed on the Relight CTA (default 13 for 1k)
 * - `onGenerate`: ({ light_type, brightness, color, size, rotation, tilt, distance, parameters }) => void
 * - `onBack`: () => void — invoked on `<` back button (defaults to `onClose`)
 * - `onClose`: () => void — invoked on `×` close button
 * - `className`: string — layout positioning only
 */
export function RelightPanel({
  previewUrl = null,
  isSubmitting = false,
  isPrimaryProcessing = false,
  creditCost = RELIGHT_DEFAULT_CREDIT_COST,
  onGenerate,
  onBack,
  onClose,
  className,
}) {
  const [settings, setSettings] = React.useState(RELIGHT_DEFAULT_SETTINGS);
  const colorInputRef = React.useRef(null);

  const isBusy = isSubmitting || isPrimaryProcessing;
  const isDefault =
    settings.light_type === RELIGHT_DEFAULT_SETTINGS.light_type &&
    settings.brightness === RELIGHT_DEFAULT_SETTINGS.brightness &&
    settings.color === RELIGHT_DEFAULT_SETTINGS.color &&
    settings.size === RELIGHT_DEFAULT_SETTINGS.size &&
    settings.rotation === RELIGHT_DEFAULT_SETTINGS.rotation &&
    settings.tilt === RELIGHT_DEFAULT_SETTINGS.tilt &&
    settings.distance === RELIGHT_DEFAULT_SETTINGS.distance;

  const updateNumeric = React.useCallback((key, value) => {
    const { min, max } = RELIGHT_RANGES[key];
    const clamped = Math.min(max, Math.max(min, Math.round(Number(value) || 0)));
    setSettings((prev) => (prev[key] === clamped ? prev : { ...prev, [key]: clamped }));
  }, []);

  const handleSphereChange = React.useCallback(({ rotation, tilt, distance }) => {
    setSettings((prev) => ({ ...prev, rotation, tilt, distance }));
  }, []);

  const handleReset = React.useCallback(() => {
    setSettings(RELIGHT_DEFAULT_SETTINGS);
  }, []);

  const handleColorChange = React.useCallback((rawColor) => {
    const normalized = normalizeRelightHexColor(rawColor, "#FFFFFF");
    setSettings((prev) => (prev.color === normalized ? prev : { ...prev, color: normalized }));
  }, []);

  const handleSubmit = React.useCallback(() => {
    if (isBusy || !onGenerate) return;
    onGenerate({
      light_type: settings.light_type,
      brightness: settings.brightness,
      color: normalizeRelightHexColor(settings.color, "#FFFFFF"),
      size: settings.size,
      rotation: settings.rotation,
      tilt: settings.tilt,
      distance: settings.distance,
      parameters: { resolution: RELIGHT_DEFAULT_RESOLUTION },
    });
  }, [isBusy, onGenerate, settings]);

  return (
    <section
      aria-label="Relight lighting editor"
      data-slot="relight-panel"
      className={cn(
        "flex flex-col h-full w-full sm:w-[320px] rounded-2xl bg-omni-bg border border-border-subtle overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <header className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border-subtle shrink-0">
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

          <h2 className="ds-text-caption-l font-semibold text-text-primary truncate">
            Relight
          </h2>
        </div>

        <IconButton
          type="button"
          variant="tonal"
          size="sm"
          aria-label="Close Relight"
          onClick={onClose}
        >
          <HugeIcon name="cancel-01" size="sm" />
        </IconButton>
      </header>

      {/* Body: 3D Light Sphere + Templates + Light Type + Color + Stepped Sliders */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
        <RelightSphere
          rotation={settings.rotation}
          tilt={settings.tilt}
          distance={settings.distance}
          size={settings.size}
          brightness={settings.brightness}
          color={settings.color}
          lightType={settings.light_type}
          previewUrl={previewUrl}
          onChange={handleSphereChange}
          onReset={handleReset}
          disabled={isSubmitting}
        />

        {/* Light Type: Soft vs Hard */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="ds-text-caption-s font-semibold uppercase tracking-wide text-text-secondary">
              Light Type
            </span>
            {!isDefault && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={isSubmitting}
                onClick={handleReset}
              >
                Reset
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Light type">
            {[
              { value: "soft", label: "Soft Light", hint: "Wide · Diffused" },
              { value: "hard", label: "Hard Light", hint: "Sharp · Focused" },
            ].map((opt) => {
              const active = settings.light_type === opt.value;
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={active ? "primary" : "pill"}
                  aria-pressed={active}
                  disabled={isSubmitting}
                  onClick={() => setSettings((prev) => ({ ...prev, light_type: opt.value }))}
                  className="w-full h-auto py-2 px-2.5 flex-col items-start gap-0.5 text-left"
                >
                  <span className="ds-text-caption-m font-semibold">{opt.label}</span>
                  <span className={cn("ds-text-caption-s", active ? "opacity-70" : "text-text-secondary")}>
                    {opt.hint}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Light Color Swatches + Custom Color Picker (strict 6-digit #RRGGBB) */}
        <div className="flex flex-col gap-1.5" data-slot="relight-color-picker">
          <div className="flex items-center justify-between px-0.5">
            <span className="ds-text-caption-s font-semibold uppercase tracking-wide text-text-secondary">
              Light Color
            </span>
            <span
              data-slot="relight-color-hex"
              className="ds-text-caption-s font-mono tabular-nums text-text-primary"
            >
              {settings.color}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-surface-card border border-border-subtle">
            {RELIGHT_COLOR_SWATCHES.map((swatch) => {
              const active = settings.color === swatch.hex;
              return (
                <button
                  key={swatch.hex}
                  type="button"
                  disabled={isSubmitting}
                  aria-label={`Light color ${swatch.label} (${swatch.hex})`}
                  aria-pressed={active}
                  onClick={() => handleColorChange(swatch.hex)}
                  className={cn(
                    "size-6 rounded-full cursor-pointer transition-transform focus-workspace border",
                    active
                      ? "scale-110 ring-2 ring-white ring-offset-1 ring-offset-omni-bg border-white"
                      : "border-border-subtle hover:scale-105"
                  )}
                  style={{ backgroundColor: swatch.hex }}
                />
              );
            })}

            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={isSubmitting}
              onClick={() => colorInputRef.current?.click()}
              aria-label="Pick custom light color"
              className="ml-auto"
            >
              Custom
            </Button>
            <input
              ref={colorInputRef}
              type="color"
              aria-label="Custom light hex color"
              value={settings.color}
              disabled={isSubmitting}
              onChange={(e) => handleColorChange(e.target.value)}
              className="sr-only"
            />
          </div>
        </div>

        {/* Stepped Sliders (exact Grid Size Slider primitive) */}
        <div className="flex flex-col gap-2">
          <Slider
            variant="stepped"
            showTicks={false}
            min={RELIGHT_RANGES.brightness.min}
            max={RELIGHT_RANGES.brightness.max}
            step={RELIGHT_RANGES.brightness.step}
            value={[settings.brightness]}
            onValueChange={([v]) => updateNumeric("brightness", v)}
            onDoubleClick={() => updateNumeric("brightness", RELIGHT_DEFAULT_SETTINGS.brightness)}
            label="Brightness"
            valueLabel={`${settings.brightness}%`}
            aria-label="Brightness"
            title="Double-click to reset Brightness"
            disabled={isSubmitting}
          />

          <Slider
            variant="stepped"
            showTicks={false}
            min={RELIGHT_RANGES.size.min}
            max={RELIGHT_RANGES.size.max}
            step={RELIGHT_RANGES.size.step}
            value={[settings.size]}
            onValueChange={([v]) => updateNumeric("size", v)}
            onDoubleClick={() => updateNumeric("size", RELIGHT_DEFAULT_SETTINGS.size)}
            label="Size"
            valueLabel={`${settings.size}`}
            aria-label="Size"
            title="Double-click to reset Size"
            disabled={isSubmitting}
          />

          <Slider
            variant="stepped"
            showTicks={false}
            min={RELIGHT_RANGES.rotation.min}
            max={RELIGHT_RANGES.rotation.max}
            step={RELIGHT_RANGES.rotation.step}
            value={[settings.rotation]}
            onValueChange={([v]) => updateNumeric("rotation", v)}
            onDoubleClick={() => updateNumeric("rotation", RELIGHT_DEFAULT_SETTINGS.rotation)}
            label="Rotation"
            valueLabel={`${settings.rotation}°`}
            aria-label="Rotation"
            title="Double-click to reset Rotation"
            disabled={isSubmitting}
          />

          <Slider
            variant="stepped"
            showTicks={false}
            min={RELIGHT_RANGES.tilt.min}
            max={RELIGHT_RANGES.tilt.max}
            step={RELIGHT_RANGES.tilt.step}
            value={[settings.tilt]}
            onValueChange={([v]) => updateNumeric("tilt", v)}
            onDoubleClick={() => updateNumeric("tilt", RELIGHT_DEFAULT_SETTINGS.tilt)}
            label="Tilt"
            valueLabel={`${settings.tilt}°`}
            aria-label="Tilt"
            title="Double-click to reset Tilt"
            disabled={isSubmitting}
          />

          <Slider
            variant="stepped"
            showTicks={false}
            min={RELIGHT_RANGES.distance.min}
            max={RELIGHT_RANGES.distance.max}
            step={RELIGHT_RANGES.distance.step}
            value={[settings.distance]}
            onValueChange={([v]) => updateNumeric("distance", v)}
            onDoubleClick={() => updateNumeric("distance", RELIGHT_DEFAULT_SETTINGS.distance)}
            label="Distance"
            valueLabel={`${settings.distance}`}
            aria-label="Distance"
            title="Double-click to reset Distance"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Footer CTA (DESIGN.md pure white Primary CTA) */}
      <footer className="p-3 border-t border-border-subtle shrink-0">
        <Button
          type="button"
          variant="cta-lg"
          disabled={isBusy}
          onClick={handleSubmit}
          className="w-full"
        >
          {isBusy ? (
            <span>{isSubmitting ? "Starting…" : "Processing…"}</span>
          ) : (
            <>
              <span>Relight</span>
              <span className="font-mono tabular-nums opacity-75">{creditCost}</span>
            </>
          )}
        </Button>
      </footer>
    </section>
  );
}

export default RelightPanel;
