"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/components/primitives/GoogleIcon";
import { Button } from "@/components/base/button";
import { Switch } from "@/components/base/switch";
import { Slider } from "@/components/primitives/slider";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/primitives/popover";
import { resolveModelIcon } from "@/features/prompt-bar/core/modelManagement.js";
import { calculateModelCredits } from "@/features/prompt-bar/core/creditCalculationService.js";

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

export function formatParamLabel(str) {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Unified FlowSelect dropdown component
 * Powered by collision-aware Radix Popover and canonical Base UI Button primitive.
 */
export function FlowSelect({
  value,
  onChange,
  items = [],
  icon = null,
  label = null,
  displayValue = "",
  width = 220,
  maxHeightLimit = 320,
  ariaLabel,
  sideOffset = 12,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="dropdown-card"
            className="w-full justify-between bg-white/10 hover:bg-white/15"
            aria-label={ariaLabel || label || displayValue}
            data-state={open ? "open" : "closed"}
          >
            <div className="text-ellipsis overflow-hidden flex items-center gap-2">
              {icon}
              <span className="flex min-w-0 flex-col items-start gap-0.5 font-medium">
                {label && (
                  <span className="text-xs leading-[15px] text-white/50">{label}</span>
                )}
                <span className="max-w-full truncate text-sm leading-[17px] text-white font-medium">
                  {displayValue}
                </span>
              </span>
            </div>
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0 text-white/50 transition-transform duration-150 ease-out",
                open && "rotate-90"
              )}
            >
              <path d="M9.29301 6.29295C9.68354 5.90243 10.3166 5.90243 10.7071 6.29295L15.7071 11.293C16.0974 11.6835 16.0975 12.3165 15.7071 12.707L10.7071 17.707L10.6309 17.7754C10.2382 18.0957 9.65913 18.0731 9.29301 17.707C8.9269 17.3409 8.90432 16.7619 9.22465 16.3691L9.29301 16.293L13.4092 12.1767C13.5068 12.0791 13.5067 11.9209 13.4092 11.8232L9.29301 7.70702C8.90249 7.31649 8.90249 6.68348 9.29301 6.29295Z" />
            </svg>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          role="listbox"
          data-portal="true"
          side="left"
          align="end"
          sideOffset={sideOffset}
          collisionPadding={16}
          avoidCollisions
          className="z-[99999] max-h-[240px] overflow-y-auto overflow-x-hidden p-0 font-sans antialiased bg-[color:var(--ui-menu-background)] text-white border border-white/10 rounded-xl shadow-2xl"
          style={{
            width: `${width}px`,
          }}
        >
          <div className="overflow-hidden p-[6px] flex flex-col gap-1 w-full" role="group">
            {items.map((item) => {
              const isSelected = String(value) === String(item.value);

              return (
                <div
                  key={String(item.value)}
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected}
                  onClick={() => {
                    onChange?.(item.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "relative flex gap-2 select-none items-center py-1.5 outline-none min-h-8 rounded-lg px-2 text-sm font-medium cursor-pointer transition-colors duration-150 ease-out",
                    isSelected
                      ? "bg-white/15 text-white ring-1 ring-inset ring-white/30 hover:bg-white/20"
                      : "bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0 transition-opacity duration-150",
                      isSelected ? "opacity-100 text-white" : "opacity-0"
                    )}
                  >
                    <path
                      d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function FlowParamSelect({ paramKey, def, value, onChange }) {
  const items = (def.values || []).map((item) => {
    const itemVal = typeof item === "object" ? item.value : item;
    const itemLabel = typeof item === "object" ? item.label || item.value : item;
    return {
      value: itemVal,
      label: formatParamLabel(String(itemLabel)),
    };
  });

  const selectedItem = items.find((it) => String(it.value) === String(value));
  const rawLabel = selectedItem ? selectedItem.label : value || def.default || "Default";
  const displayValue = formatParamLabel(String(rawLabel));
  const paramTitle = def.label || formatParamLabel(paramKey);

  const getParamIcon = () => {
    if (paramKey.includes("camera")) return "videocam";
    if (paramKey.includes("mode")) return "tune";
    if (paramKey.includes("resolution")) return "hd";
    return "tune";
  };

  return (
    <FlowSelect
      value={value ?? def.default}
      onChange={(newVal) => onChange?.(paramKey, newVal)}
      items={items}
      icon={<GoogleIcon iconName={getParamIcon()} className="text-[16px] text-white/60 shrink-0" />}
      label={paramTitle}
      displayValue={displayValue}
      width={220}
      maxHeightLimit={260}
      ariaLabel={paramTitle}
    />
  );
}

/**
 * FlowPromptBoxSettings
 *
 * Clean SaaS Dark UI Settings Dropdown using pure Base UI components and canonical variants:
 * - Zero custom inline styling classes on Button (pure variant="secondary" | "ghost" | "outline")
 * - Layout classes only on flex/grid containers
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

  const displayCredits = useMemo(() => {
    if (typeof creditCost === "number" && creditCost > 0) return creditCost;
    return calculateModelCredits(currentModel, paramValues, currentCount);
  }, [creditCost, currentModel, paramValues, currentCount]);

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
    <div
      data-slot="prompt-box-settings"
      className={cn(
        "settings-content-overlay flow-prompt-box-settings block box-border w-[var(--prompt-box-settings-width,18rem)] rounded-2xl p-2.5",
        "bg-[color:var(--ui-menu-background)] border border-white/10 shadow-2xl",
        "text-white select-none font-sans antialiased",
        className
      )}
    >
      <div className="settings-content flex flex-col gap-2">
        {/* ── 1. MODE TOGGLES ── */}
        {hasModes && modeOptions.length > 0 && (
          <div
            role="radiogroup"
            aria-label="Mode"
            className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-full"
          >
            {modeOptions.map((opt) => {
              const isChecked = activeMode === opt.value;
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={isChecked ? "secondary" : "ghost"}
                  onClick={() => onModeChange?.(opt.value)}
                  role="radio"
                  aria-checked={isChecked}
                  className="flex-1 rounded-lg text-xs h-8"
                >
                  <GoogleIcon
                    iconName={opt.icon}
                    className="text-[16px] leading-none text-white"
                  />
                  <span>{opt.label}</span>
                </Button>
              );
            })}
          </div>
        )}

        {/* ── SubMode: Type de vidéo (when Video mode is active) ── */}
        {hasModes && activeMode === "video" && subModeOptions.length > 1 && (
          <div
            role="radiogroup"
            aria-label="Type de vidéo"
            className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-full"
          >
            {subModeOptions.map((opt) => {
              const isChecked = activeSubMode === opt.value;
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={isChecked ? "secondary" : "ghost"}
                  onClick={() => onSubModeChange?.(opt.value)}
                  role="radio"
                  aria-checked={isChecked}
                  className="flex-1 rounded-lg text-xs h-8"
                >
                  <GoogleIcon
                    iconName={opt.icon}
                    className="text-[16px] leading-none text-white"
                  />
                  <span>{opt.label}</span>
                </Button>
              );
            })}
          </div>
        )}

        {/* ── 2. FORMAT / ASPECT RATIO TOGGLES ── */}
        {ratioOptions.length > 0 && (
          <div
            role="radiogroup"
            aria-label="Format"
            className="flex flex-wrap items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-full"
          >
            {ratioOptions.map((ratio) => {
              const isChecked = currentRatio === ratio;
              const iconName = getRatioIcon(ratio);

              return (
                <Button
                  key={ratio}
                  type="button"
                  variant={isChecked ? "secondary" : "ghost"}
                  onClick={() => handleRatioClick(ratio)}
                  role="radio"
                  aria-checked={isChecked}
                  className="flex-1 min-w-[44px] h-[52px] flex-col gap-1 p-1 rounded-lg"
                >
                  <GoogleIcon
                    iconName={iconName}
                    className="text-[18px] leading-none text-white"
                  />
                  <span className="text-[11px] leading-tight text-white">{ratio}</span>
                </Button>
              );
            })}
          </div>
        )}

        {/* ── 3. DYNAMIC PARAMETERS (Quality, Video Resolution, Duration, etc.) ── */}
        {otherParams.length > 0 && (
          <div className="flex flex-col gap-2">
            {otherParams.map(([key, def]) => {
              const val = paramValues[key];

              // Render Select / Enums (e.g. Quality 1K/2K/4K or VideoResolution 720p/1080p, Duration, Camera Motion)
              if (Array.isArray(def.values) && def.values.length > 0) {
                const hasLongLabels = def.values.some((item) => {
                  const str = typeof item === "object" ? item.label || item.value : String(item);
                  return str.length > 6;
                });
                const shouldUseDropdown =
                  def.type === "select" || key === "camera_motion" || (hasLongLabels && def.values.length > 3);

                if (shouldUseDropdown) {
                  return (
                    <FlowParamSelect
                      key={key}
                      paramKey={key}
                      def={def}
                      value={val}
                      onChange={onParamChange}
                    />
                  );
                }

                const isGrid = def.values.length > 5;
                const gridColsClass = def.values.length > 8 ? "grid-cols-5" : "grid-cols-4";

                return (
                  <div
                    key={key}
                    role="radiogroup"
                    aria-label={def.label || key}
                    className={cn(
                      "p-1 bg-white/5 border border-white/10 rounded-xl w-full max-w-full",
                      isGrid ? cn("grid", gridColsClass, "gap-1") : "flex items-center gap-1"
                    )}
                  >
                    {def.values.map((item) => {
                      const itemVal = typeof item === "object" ? item.value : item;
                      let itemLabel = typeof item === "object" ? item.label || item.value : item;
                      if ((key === "duration" || def.label?.toLowerCase()?.includes("durée")) && typeof itemLabel === "string") {
                        if (itemLabel.endsWith("s") && !itemLabel.includes(" ")) {
                          itemLabel = itemLabel.replace("s", " s");
                        }
                      }
                      const isChecked = String(val) === String(itemVal) || (!val && itemVal === def.default);
                      const hasInfo = itemVal === "360p" || item?.info;
                      const infoText = item?.info || (itemVal === "360p" ? "La résolution 360p est générée plus rapidement, mais elle est plus faible" : "");

                      return (
                        <Button
                          key={String(itemVal)}
                          type="button"
                          variant={isChecked ? "secondary" : "ghost"}
                          onClick={() => onParamChange?.(key, itemVal)}
                          role="radio"
                          aria-checked={isChecked}
                          aria-description={infoText || undefined}
                          className={cn(!isGrid ? "flex-1" : undefined, "rounded-lg text-xs h-8")}
                        >
                          <span className="flex items-center justify-center gap-1 truncate w-full text-center">
                            <span className="truncate text-white">{itemLabel}</span>
                            {hasInfo && (
                              <GoogleIcon
                                iconName="info"
                                role="img"
                                aria-hidden={false}
                                aria-label={infoText}
                                className="text-[14px] text-white hover:text-white"
                              />
                            )}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                );
              }

              // Render Boolean Toggles (On / Off) using canonical Base Switch
              if (def.type === "boolean") {
                const isChecked = Boolean(val);
                return (
                  <div key={key} className="flex items-center justify-between px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                    <span className="text-xs text-white font-medium">
                      {def.label || key}
                    </span>
                    <Switch
                      checked={isChecked}
                      onCheckedChange={(checked) => onParamChange?.(key, checked)}
                      aria-label={def.label || key}
                    />
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
                  <div key={key} className="flex flex-col gap-1.5 p-2.5 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-medium">{def.label || key}</span>
                      <span className="font-mono text-white/90 font-semibold tabular-nums">{numVal}</span>
                    </div>
                    <Slider
                      min={min}
                      max={max}
                      step={step}
                      value={[Number.isNaN(numVal) ? min : numVal]}
                      onValueChange={([newVal]) => onParamChange?.(key, newVal)}
                      className="w-full py-1.5"
                    />
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}

        {/* ── 4. MODEL SELECT TRIGGER ── */}
        {models && models.length > 0 && currentModel && (
          <FlowSelect
            value={currentModel.id}
            onChange={(selectedId) => onSelectModel?.(selectedId)}
            items={models.map((m) => {
              const icon = resolveModelIcon(m);
              const isImgIcon = icon && (icon.startsWith("/") || icon.startsWith("http") || icon.includes("."));
              return {
                value: m.id,
                label: m.name,
                icon: isImgIcon ? (
                  <img
                    src={icon}
                    alt=""
                    className="size-4 object-contain brightness-0 invert shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <GoogleIcon iconName={icon || "volume_up"} className="text-[16px] text-white shrink-0" />
                ),
              };
            })}
            icon={
              currentModelIcon ? (
                <img
                  src={currentModelIcon}
                  alt=""
                  className="size-5 rounded-lg object-contain brightness-0 invert shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-[14px]">🍌</span>
              )
            }
            displayValue={currentModel?.name || "Model"}
            label="Model"
            width={240}
            maxHeightLimit={320}
            ariaLabel="Sélectionner une famille de modèles"
          />
        )}

        {/* ── 5. OUTPUTS / VARIATIONS TOGGLES ── */}
        {models && models.length > 0 && currentModel && (
          <div
            role="radiogroup"
            aria-label="Nombre de sorties"
            className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-full"
          >
            {[1, 2, 3, 4].map((countVal) => {
              const isChecked = currentCount === countVal;

              return (
                <Button
                  key={countVal}
                  type="button"
                  variant={isChecked ? "secondary" : "ghost"}
                  onClick={() => handleCountClick(countVal)}
                  role="radio"
                  aria-checked={isChecked}
                  className="flex-1 rounded-lg text-xs h-8"
                >
                  <span className="font-semibold text-white">x{countVal}</span>
                </Button>
              );
            })}
          </div>
        )}

        {/* ── 6. CREDIT COST LABEL ── */}
        {models && models.length > 0 && currentModel && (
          <div className="settings-credit-cost block text-center pt-1 pb-0.5">
            <span className="credit-cost-label block text-xs text-white/50">
              <span>
                La génération utilisera{" "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="credit-cost-link text-white underline underline-offset-2 hover:text-white/80 transition-colors font-medium"
                  href="https://support.google.com/googleone?p=g1_ai_credit_menu"
                >
                  {displayCredits}&nbsp;{displayCredits === 1 ? "crédit" : "crédits"}
                </a>
              </span>
            </span>
          </div>
        )}

        {/* ── Empty notice if no models available for this mode ── */}
        {(!models || models.length === 0) && (
          <div className="py-3 px-2 text-center text-xs text-white/60">
            Aucun modèle disponible
          </div>
        )}
      </div>
    </div>
  );
}
