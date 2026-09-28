"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { resolveModelIcon } from "../../../core/modelManagement.js";

/**
 * Ratio icon mapping using official Google Symbols
 */
const RATIO_ICONS = {
  "16:9": "crop_16_9",
  "4:3": "crop_landscape",
  "1:1": "crop_square",
  "3:4": "crop_portrait",
  "9:16": "crop_9_16",
  "21:9": "crop_16_9",
  "9:21": "crop_9_16",
  "3:2": "crop_landscape",
  "2:3": "crop_portrait",
  "4:5": "crop_portrait",
  "5:4": "crop_landscape",
  "1:2": "crop_portrait",
  "2:1": "crop_16_9",
};

export function getRatioIcon(ratio) {
  if (RATIO_ICONS[ratio]) return RATIO_ICONS[ratio];
  if (typeof ratio === "string" && ratio.includes(":")) {
    const [w, h] = ratio.split(":").map(Number);
    if (!isNaN(w) && !isNaN(h)) {
      if (w > h) return "crop_landscape";
      if (w < h) return "crop_portrait";
      return "crop_square";
    }
  }
  return "crop_square";
}

const DEFAULT_RATIOS = ["16:9", "4:3", "1:1", "3:4", "9:16"];

/**
 * FlowPromptBoxSettings
 *
 * Exact replication of Google Flow's <flow-prompt-box-settings class="settings-content-overlay">:
 * - Container: width 17.5rem (280px), rounded 18px, padding 0.5rem (8px)
 * - Glassmorphism: backdrop-filter blur(40px), background rgba(22, 23, 24, 0.9), shadow 0 16px 32px -8px rgba(0,0,0,0.4)
 * - Toggle groups: rounded 14px, background rgba(218, 220, 224, 0.05), gap 1 (4px), padding 1 (4px)
 * - Toggle buttons: rounded 10px, active bg rgba(218, 220, 224, 0.25), text/icon white, inactive rgba(218, 220, 224, 0.75)
 * - Mode toggles: Image (image icon) and Video (videocam icon)
 * - Format toggles: 16:9, 4:3, 1:1, 3:4, 9:16 with content-layout-column
 * - Model selector trigger button: Banana / Model name with arrow_drop_down
 * - Outputs toggles: x1, x2, x3, x4
 * - Credit cost label: "La génération utilisera 0 crédits"
 */
export function FlowPromptBoxSettings({
  activeMode = "image",
  onModeChange,
  activeSubMode = "frames",
  onSubModeChange,
  availableModes = ["image", "video"],
  availableSubModes = ["frames", "reference"],
  hasModes = true,
  currentModel = null,
  models = [],
  onSelectModel,
  parameters = [],
  paramValues = {},
  onParamChange,
  _validationErrors = {},
  creditCost = 0,
  className,
}) {
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const modelMenuRef = useRef(null);

  // Close internal model menu on click outside
  useEffect(() => {
    if (!modelMenuOpen) return;
    const handleClick = (e) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target)) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [modelMenuOpen]);

  // Mode Options
  const modeOptions = useMemo(() => {
    const all = [
      { value: "image", label: "Image", icon: "image" },
      { value: "video", label: "Vidéo", icon: "videocam" },
    ];
    if (!availableModes || availableModes.length === 0) return all;
    const filtered = all.filter((m) => availableModes.includes(m.value));
    return filtered.length > 0 ? filtered : all;
  }, [availableModes]);

  // SubMode Options (Type de vidéo for Video)
  const subModeOptions = useMemo(() => {
    const all = [
      { value: "frames", label: "Frames", icon: "panorama_wide_angle" },
      { value: "reference", label: "Reference", icon: "extension" },
    ];
    if (!availableSubModes || availableSubModes.length === 0) return all;
    return all.filter((s) => availableSubModes.includes(s.value));
  }, [availableSubModes]);

  // Ratio Parameter detection (from parameters array or currentModel)
  const ratioParamEntry = useMemo(() => {
    const found = parameters.find(([k]) => k === "aspect_ratio" || k === "ratio");
    if (found) return found;
    if (currentModel?.parameters?.aspect_ratio) return ["aspect_ratio", currentModel.parameters.aspect_ratio];
    if (currentModel?.parameters?.ratio) return ["ratio", currentModel.parameters.ratio];
    return null;
  }, [parameters, currentModel]);

  const ratioOptions = useMemo(() => {
    if (!currentModel || models.length === 0) return [];
    const def = ratioParamEntry ? ratioParamEntry[1] : (currentModel?.parameters?.aspect_ratio || currentModel?.parameters?.ratio);
    const rawValues = def?.values;
    if (Array.isArray(rawValues) && rawValues.length > 0) {
      return rawValues.map((v) => (typeof v === "object" ? v.value : String(v)));
    }
    return DEFAULT_RATIOS;
  }, [ratioParamEntry, currentModel, models.length]);

  const currentRatio = useMemo(() => {
    if (ratioParamEntry && paramValues[ratioParamEntry[0]]) {
      return String(paramValues[ratioParamEntry[0]]);
    }
    if (paramValues.aspect_ratio) return String(paramValues.aspect_ratio);
    if (paramValues.ratio) return String(paramValues.ratio);
    return ratioOptions[0] || "16:9";
  }, [ratioParamEntry, paramValues, ratioOptions]);

  // Variation / Outputs detection (count or variations)
  const variationParamEntry = useMemo(() => {
    return parameters.find(([k]) => k === "count" || k === "variations");
  }, [parameters]);

  const currentCount = useMemo(() => {
    if (variationParamEntry) {
      return Number(paramValues[variationParamEntry[0]]) || 1;
    }
    return Number(paramValues.count || paramValues.variations) || 1;
  }, [variationParamEntry, paramValues]);

  // Other non-ratio non-count parameters (Quality, Duration, Sliders, etc.)
  const otherParams = useMemo(() => {
    if (!currentModel || models.length === 0) return [];
    return parameters.filter(([k]) => k !== "aspect_ratio" && k !== "ratio" && k !== "count" && k !== "variations");
  }, [parameters, currentModel, models.length]);

  // Current Model Icon
  const currentModelIcon = useMemo(() => {
    return resolveModelIcon(currentModel);
  }, [currentModel]);

  const handleRatioClick = (val) => {
    if (ratioParamEntry && onParamChange) {
      onParamChange(ratioParamEntry[0], val);
    } else if (onParamChange) {
      onParamChange("aspect_ratio", val);
    }
  };

  const handleCountClick = (cnt) => {
    if (variationParamEntry && onParamChange) {
      onParamChange(variationParamEntry[0], cnt);
    } else if (onParamChange) {
      onParamChange("count", cnt);
    }
  };

  return (
    <flow-prompt-box-settings
     
      className={cn(
        "settings-content-overlay flow-prompt-box-settings block w-[var(--prompt-box-settings-width,17.5rem)] rounded-[var(--mat-menu-container-shape,24px)] p-2",
        "bg-[rgba(22,23,24,0.6)] backdrop-blur-[100px]",
        "border-none",
        "shadow-[var(--mat-menu-container-elevation-shadow,var(--glass-raised-box-shadow))]",
        "text-white select-none font-['Google_Sans_Text',sans-serif]",
        className
      )}
      style={{
        display: "block",
        boxSizing: "border-box",
        width: "var(--prompt-box-settings-width, 17.5rem)",
        borderRadius: "var(--mat-menu-container-shape, 24px)",
        padding: "0.5rem",
        boxShadow: "var(--mat-menu-container-elevation-shadow, 0 16px 32px -8px rgba(0, 0, 0, 0.4))",
        backdropFilter: "blur(100px) saturate(190%) contrast(105%)",
        WebkitBackdropFilter: "blur(100px) saturate(190%) contrast(105%)",
        backgroundColor: "rgba(22, 23, 24, 0.6)",
        border: "none",
        colorScheme: "dark",
        pointerEvents: "auto",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div className="settings-content flex flex-col gap-2">
        {/* ── 1. MODE TOGGLES (flow-toggles aria-label="Mode" class="variant-emphasized") ── */}
        {hasModes && modeOptions.length > 0 && (
          <flow-toggles
            aria-label="Mode"
            className="variant-emphasized block w-full"
          >
            <mat-button-toggle-group
              className="mat-button-toggle-group toggle-group flex items-center gap-1 p-1 bg-[rgba(218,220,224,0.05)] rounded-[14px] w-full"
              role="radiogroup"
            >
              {modeOptions.map((opt) => {
                const isChecked = activeMode === opt.value;
                return (
                  <mat-button-toggle
                    key={opt.value}
                    role="presentation"
                    className={cn(
                      "mat-button-toggle toggle flex-toggle flex-1 flex h-8 rounded-[10px] transition-all",
                      isChecked && "mat-button-toggle-checked"
                    )}
                  >
                    <Button
                      type="button"
                      variant={isChecked ? "flow-toggle-active" : "flow-toggle"}
                      onClick={() => onModeChange?.(opt.value)}
                      role="radio"
                      aria-checked={isChecked}
                      className={cn(
                        "mat-button-toggle-button w-full h-8 text-white",
                        isChecked ? "font-semibold" : "font-medium"
                      )}
                    >
                      <span className="mat-button-toggle-label-content flex items-center justify-center gap-1.5 w-full">
                        <span className="toggle-label flex items-center justify-center gap-1.5">
                          <GoogleIcon
                            iconName={opt.icon}
                            className="text-[16px] leading-none text-white"
                          />
                          <span className={cn("toggle-text leading-none text-white", isChecked ? "font-semibold" : "font-medium")}>{opt.label}</span>
                        </span>
                      </span>
                    </Button>
                  </mat-button-toggle>
                );
              })}
            </mat-button-toggle-group>
          </flow-toggles>
        )}

        {/* ── SubMode: Type de vidéo (when Video mode is active) ── */}
        {hasModes && activeMode === "video" && subModeOptions.length > 1 && (
          <flow-toggles
            aria-label="Type de vidéo"
            className="variant-emphasized block w-full"
          >
            <mat-button-toggle-group
              className="mat-button-toggle-group toggle-group mat-button-toggle-group-appearance-standard flex items-center gap-1 p-1 bg-[rgba(218,220,224,0.05)] rounded-[14px] w-full"
              role="radiogroup"
            >
              {subModeOptions.map((opt) => {
                const isChecked = activeSubMode === opt.value;
                return (
                  <mat-button-toggle
                    key={opt.value}
                    role="presentation"
                    className={cn(
                      "mat-button-toggle toggle flex-toggle mat-button-toggle-appearance-standard mat-button-toggle-animations-enabled flex-1 flex h-8 rounded-[10px] transition-all",
                      isChecked && "mat-button-toggle-checked"
                    )}
                  >
                    <Button
                      type="button"
                      variant={isChecked ? "flow-toggle-active" : "flow-toggle"}
                      onClick={() => onSubModeChange?.(opt.value)}
                      role="radio"
                      aria-checked={isChecked}
                      className={cn(
                        "mat-button-toggle-button w-full h-8 text-white",
                        isChecked ? "font-semibold" : "font-medium"
                      )}
                    >
                      <span className="mat-button-toggle-label-content flex items-center justify-center gap-1.5 w-full">
                        <span className="toggle-label flex items-center justify-center gap-1.5">
                          <GoogleIcon
                            iconName={opt.icon}
                            className="text-[16px] leading-none text-white"
                          />
                          <span className={cn("toggle-text leading-none text-white", isChecked ? "font-semibold" : "font-medium")}>{opt.label}</span>
                        </span>
                      </span>
                    </Button>
                  </mat-button-toggle>
                );
              })}
            </mat-button-toggle-group>
          </flow-toggles>
        )}

        {/* ── 2. FORMAT / ASPECT RATIO TOGGLES (flow-toggles aria-label="Format") ── */}
        {/* ── 2. FORMAT / ASPECT RATIO TOGGLES (flow-toggles aria-label="Format") ── */}
        {ratioOptions.length > 0 && (
          <flow-toggles
            aria-label="Format"
            className="block w-full"
          >
            <mat-button-toggle-group
              className="mat-button-toggle-group toggle-group content-layout-column flex flex-wrap items-center gap-1 p-0.5 bg-[rgba(218,220,224,0.05)] rounded-[12px] w-full"
              role="radiogroup"
            >
              {ratioOptions.map((ratio) => {
                const isChecked = currentRatio === ratio;
                const iconName = getRatioIcon(ratio);

                return (
                  <mat-button-toggle
                    key={ratio}
                    role="presentation"
                    className={cn(
                      "mat-button-toggle toggle flex-toggle flex-1 min-w-[44px] h-[54px] rounded-[10px] transition-all",
                      isChecked && "mat-button-toggle-checked"
                    )}
                  >
                    <Button
                      type="button"
                      variant={isChecked ? "flow-ratio-active" : "flow-ratio"}
                      size="ratio"
                      onClick={() => handleRatioClick(ratio)}
                      role="radio"
                      aria-checked={isChecked}
                      className={cn(
                        "mat-button-toggle-button w-full h-full text-white",
                        isChecked ? "font-semibold" : "font-medium"
                      )}
                    >
                      <span className="mat-button-toggle-label-content flex flex-col items-center justify-center">
                        <span className="toggle-label flex flex-col items-center justify-center gap-1">
                          <GoogleIcon
                            iconName={iconName}
                            className="text-[18px] leading-none text-white"
                          />
                          <span className={cn("toggle-text text-[11px] leading-tight text-white", isChecked ? "font-semibold" : "font-medium")}>
                            {ratio}
                          </span>
                        </span>
                      </span>
                    </Button>
                  </mat-button-toggle>
                );
              })}
            </mat-button-toggle-group>
          </flow-toggles>
        )}

        {/* ── 3. DYNAMIC PARAMETERS (Quality, Video Resolution, Duration, etc.) ── */}
        {otherParams.length > 0 && (
          <div className="flex flex-col gap-1">
            {otherParams.map(([key, def]) => {
              const val = paramValues[key];

              // Render Select / Enums (e.g. Quality 1K/2K/4K or VideoResolution 720p/1080p)
              if (Array.isArray(def.values) && def.values.length > 0) {
                return (
                  <flow-toggles
                    key={key}
                    aria-label={def.label || key}
                    className="block w-full"
                  >
                    <mat-button-toggle-group
                      className="mat-button-toggle-group toggle-group flex items-center gap-0.5 p-0.5 bg-[rgba(218,220,224,0.05)] rounded-[12px] w-full"
                      role="radiogroup"
                    >
                      {def.values.map((item) => {
                        const itemVal = typeof item === "object" ? item.value : item;
                        let itemLabel = typeof item === "object" ? (item.label || item.value) : item;
                        if ((key === "duration" || def.label?.toLowerCase()?.includes("durée")) && typeof itemLabel === "string") {
                          if (itemLabel.endsWith("s") && !itemLabel.includes(" ")) {
                            itemLabel = itemLabel.replace("s", " s");
                          }
                        }
                        const isChecked = String(val) === String(itemVal);
                        const hasInfo = itemVal === "360p" || item?.info;
                        const infoText = item?.info || (itemVal === "360p" ? "La résolution 360p est générée plus rapidement, mais elle est plus faible" : "");

                        return (
                          <mat-button-toggle
                            key={String(itemVal)}
                            role="presentation"
                            aria-description={infoText || undefined}
                            className={cn(
                              "mat-button-toggle toggle flex-toggle mat-button-toggle-appearance-standard mat-button-toggle-animations-enabled flex-1 flex h-8 rounded-[10px] transition-all",
                              isChecked && "mat-button-toggle-checked"
                            )}
                          >
                            <Button
                              type="button"
                              variant={isChecked ? "flow-toggle-active" : "flow-toggle"}
                              onClick={() => onParamChange?.(key, itemVal)}
                              role="radio"
                              aria-checked={isChecked}
                              className={cn(
                                "mat-button-toggle-button w-full h-8 text-white",
                                isChecked ? "font-semibold" : "font-medium"
                              )}
                            >
                              <span className="mat-button-toggle-label-content flex items-center justify-center gap-1 truncate w-full text-center">
                                <span className="toggle-label flex items-center justify-center gap-1">
                                  <span className="toggle-text truncate text-white">{itemLabel}</span>
                                  {hasInfo && (
                                    <GoogleIcon
                                      iconName="info"
                                      role="img"
                                      aria-hidden={false}
                                      aria-label={infoText}
                                      className="mat-icon notranslate mat-mdc-tooltip-trigger flow-icon-m info-icon google-symbols mat-icon-no-color text-[14px] text-white hover:text-white"
                                    />
                                  )}
                                </span>
                              </span>
                            </Button>
                          </mat-button-toggle>
                        );
                      })}
                    </mat-button-toggle-group>
                  </flow-toggles>
                );
              }

              // Render Boolean Toggles (On / Off)
              if (def.type === "boolean") {
                const isChecked = Boolean(val);
                return (
                  <div key={key} className="flex items-center justify-between px-1">
                    <span className="text-[12px] text-white font-medium">
                      {def.label || key}
                    </span>
                    <div className="flex items-center gap-1 p-0.5 bg-[rgba(218,220,224,0.05)] rounded-[10px]">
                      <Button
                        type="button"
                        variant={!isChecked ? "flow-boolean-active" : "flow-boolean"}
                        onClick={() => onParamChange?.(key, false)}
                        className="text-white hover:text-white"
                      >
                        Off
                      </Button>
                      <Button
                        type="button"
                        variant={isChecked ? "flow-boolean-active" : "flow-boolean"}
                        onClick={() => onParamChange?.(key, true)}
                        className="text-white hover:text-white"
                      >
                        On
                      </Button>
                    </div>
                  </div>
                );
              }

              // Numeric Slider Control
              if (def.type === "number") {
                const min = def.min ?? 0;
                const max = def.max ?? 100;
                const step = def.step ?? 1;
                const numVal = val !== undefined && val !== null ? Number(val) : (def.default ?? min);

                return (
                  <div key={key} className="flex flex-col gap-1 p-1 bg-[rgba(218,220,224,0.05)] rounded-[14px] px-2.5 py-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white font-medium">{def.label || key}</span>
                      <span className="font-mono text-white font-semibold tabular-nums">{numVal}</span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={Number.isNaN(numVal) ? min : numVal}
                      onChange={(e) => onParamChange?.(key, Number(e.target.value))}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}

        {/* ── 4. DIVIDER & 5. MODEL SELECT TRIGGER (only when models exist) ── */}
        {models && models.length > 0 && currentModel && (
          <>
            <mat-divider
              role="separator"
              className="mat-divider mat-divider-horizontal block h-px bg-[rgba(218,220,224,0.15)] my-0.5 w-full"
            />

            <div className="relative w-full" ref={modelMenuRef}>
              <Button
                type="button"
                variant="flow-select-trigger"
                aria-label="Sélectionner une famille de modèles"
                onClick={() => setModelMenuOpen((v) => !v)}
                className="mdc-button mat-mdc-button-base mat-mdc-menu-trigger mdc-button--unelevated mat-mdc-unelevated-button mat-unthemed flow-button-primary flow-button-medium w-full h-9 px-3 rounded-[12px] bg-[rgba(218,220,224,0.06)] hover:bg-[rgba(218,220,224,0.12)] active:bg-[rgba(218,220,224,0.2)] text-white flex items-center justify-between transition-all cursor-pointer outline-none"
              >
                <span className="mdc-button__label flex items-center justify-between w-full">
                  <span className="model-select-trigger-content flex items-center gap-2 text-[13px] font-medium truncate text-white">
                    {currentModelIcon ? (
                      <img
                        src={currentModelIcon}
                        alt=""
                        className="size-4 rounded-[3px] object-contain brightness-0 invert shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-[14px]">🍌</span>
                    )}
                    <span className="truncate text-white">{currentModel?.name || "Model"}</span>
                  </span>
                  <GoogleIcon
                    iconName="arrow_drop_down"
                    className={cn("text-[20px] text-white transition-transform", modelMenuOpen && "rotate-180")}
                  />
                </span>
              </Button>

              {/* Inline Model Dropdown Menu if toggled */}
              {modelMenuOpen && models.length > 0 && (
                <div
                  id="cdk-overlay-79"
                  className="cdk-overlay-pane absolute bottom-[calc(100%+8px)] left-0 w-full z-50 !max-h-none !h-auto"
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    left: 0,
                    width: "100%",
                    zIndex: 1000,
                    maxHeight: "none",
                    height: "auto",
                  }}
                >
                  <div
                    tabIndex={-1}
                    role="menu"
                    className="mat-mdc-menu-panel flow-menu-panel flow-model-picker-panel mat-menu-above mat-menu-after w-full !h-auto max-h-[320px] overflow-y-auto"
                    id="mat-menu-panel-158"
                    style={{
                      transformOrigin: "left bottom",
                      maxHeight: "320px",
                      height: "auto",
                      backgroundColor: "rgba(22, 23, 24, 0.6)",
                      backdropFilter: "blur(100px)",
                      WebkitBackdropFilter: "blur(100px)",
                    }}
                  >
                    <div className="mat-mdc-menu-content">
                      {models.map((m) => {
                        const isSelected = m.id === currentModel?.id;
                        const icon = resolveModelIcon(m);
                        const isImgIcon = icon && (icon.startsWith("/") || icon.startsWith("http") || icon.includes("."));

                        return (
                          <flow-menu-item
                            key={m.id}
                            className={cn("block w-full !h-[48px] !min-h-[48px]", isSelected && "selected")}
                          >
                            <button
                              type="button"
                              mat-menu-item=""
                              className={cn(
                                "mat-mdc-menu-item mat-focus-indicator mat-mdc-menu-trigger mat-mdc-tooltip-trigger flow-internal-menu-item w-full !h-[48px] !min-h-[48px] text-white",
                                isSelected && "selected"
                              )}
                              role="menuitem"
                              tabIndex={0}
                              aria-expanded="false"
                              onClick={() => {
                                onSelectModel?.(m.id);
                                setModelMenuOpen(false);
                              }}
                            >
                              <span className="mat-mdc-menu-item-text text-white">
                                <span className="left-content flex items-center gap-2">
                                  {isImgIcon ? (
                                    <img
                                      src={icon}
                                      alt=""
                                      className="size-4 object-contain brightness-0 invert shrink-0"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <mat-icon
                                      role="img"
                                      className="mat-icon notranslate google-symbols mat-icon-no-color text-white"
                                      aria-hidden="true"
                                      data-mat-icon-type="font"
                                    >
                                      {icon || "volume_up"}
                                    </mat-icon>
                                  )}
                                  <span className="item-text text-white">
                                    <span className="label text-white">{m.name}</span>
                                  </span>
                                </span>
                                {isSelected && (
                                  <mat-icon
                                    role="img"
                                    className="mat-icon notranslate google-symbols mat-icon-no-color text-[16px] text-white shrink-0 ml-1"
                                    aria-hidden="true"
                                    data-mat-icon-type="font"
                                  >
                                    check
                                  </mat-icon>
                                )}
                              </span>
                              <div
                                matripple=""
                                className="mat-ripple mat-mdc-menu-ripple"
                              />
                            </button>
                          </flow-menu-item>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── 6. OUTPUTS / VARIATIONS TOGGLES (only when models exist) ── */}
        {models && models.length > 0 && currentModel && (
          <flow-toggles
            aria-label="Nombre de sorties"
            className="block w-full"
          >
            <mat-button-toggle-group
              className="mat-button-toggle-group toggle-group flex items-center gap-0.5 p-0.5 bg-[rgba(218,220,224,0.05)] rounded-[12px] w-full"
              role="radiogroup"
            >
              {[1, 2, 3, 4].map((countVal) => {
                const isChecked = currentCount === countVal;

                return (
                  <mat-button-toggle
                    key={countVal}
                    role="presentation"
                    className={cn(
                      "mat-button-toggle toggle flex-toggle flex-1 flex h-8 rounded-[10px] transition-all",
                      isChecked && "mat-button-toggle-checked"
                    )}
                  >
                    <Button
                      type="button"
                      variant={isChecked ? "flow-toggle-active" : "flow-toggle"}
                      onClick={() => handleCountClick(countVal)}
                      role="radio"
                      aria-checked={isChecked}
                      className={cn(
                        "mat-button-toggle-button w-full h-8 text-white",
                        isChecked ? "font-semibold" : "font-medium"
                      )}
                    >
                      <span className="mat-button-toggle-label-content flex items-center justify-center w-full">
                        <span className="toggle-label flex items-center justify-center">
                          <span className="toggle-text font-semibold text-white">x{countVal}</span>
                        </span>
                      </span>
                    </Button>
                  </mat-button-toggle>
                );
              })}
            </mat-button-toggle-group>
          </flow-toggles>
        )}

        {/* ── 7. CREDIT COST LABEL (only when models exist) ── */}
        {models && models.length > 0 && currentModel && (
          <flow-credit-cost-label
            className="settings-credit-cost block pt-0.5 text-center"
          >
            <span className="credit-cost-label block text-[11px] text-white">
              <span>
                La génération utilisera{" "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="credit-cost-link text-white underline underline-offset-2 hover:text-white/80 transition-colors font-medium"
                  href="https://support.google.com/googleone?p=g1_ai_credit_menu"
                >
                  {creditCost || 0}&nbsp;crédits
                </a>
              </span>
            </span>
          </flow-credit-cost-label>
        )}

        {/* ── Empty notice if no models available for this mode ── */}
        {(!models || models.length === 0) && (
          <div className="py-3 px-2 text-center text-[12px] text-white">
            Aucun modèle disponible
          </div>
        )}
      </div>
    </flow-prompt-box-settings>
  );
}
