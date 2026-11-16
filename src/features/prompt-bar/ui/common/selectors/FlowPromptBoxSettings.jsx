"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { Slider } from "@/shared/ui/slider";
import { Switch } from "@/shared/ui/switch";
import { Popover, PopoverTrigger, PopoverContent } from "@/shared/ui/popover";
import { resolveModelIcon } from "../../../core/modelManagement.js";
import { calculateModelCredits } from "../../../core/creditCalculationService.js";

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
 * Powered by Radix Popover and SaaS Dark UI styling.
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
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full h-9 px-3 flex items-center justify-between transition-all bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl"
            aria-label={ariaLabel || label || displayValue}
          >
            <span className="flex items-center gap-1.5 truncate text-white">
              {icon}
              {label && <span className="text-white/50 font-normal">{label}:</span>}
              <span className="truncate text-white font-medium">{displayValue}</span>
            </span>
            <GoogleIcon
              iconName="arrow_drop_down"
              className={cn("text-[20px] text-white/70 transition-transform shrink-0", open && "rotate-180")}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          role="listbox"
          data-portal="true"
          side="left"
          align="end"
          sideOffset={8}
          collisionPadding={16}
          avoidCollisions
          className="z-[99999] p-1 overflow-y-auto font-sans antialiased"
          style={{
            width: `${width}px`,
            maxHeight: `${maxHeightLimit}px`,
          }}
        >
          {items.map((item) => {
            const isSelected = String(value) === String(item.value);

            return (
              <Button
                key={String(item.value)}
                type="button"
                variant={isSelected ? "secondary" : "ghost"}
                className={cn(
                  "w-full h-9 justify-between px-2.5 rounded-lg text-xs font-medium transition-colors",
                  isSelected ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
                onClick={() => {
                  onChange?.(item.value);
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2 truncate">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </span>
                {isSelected && (
                  <GoogleIcon iconName="check" className="text-base text-white shrink-0 ml-1" />
                )}
              </Button>
            );
          })}
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
 * SaaS Dark UI compliant Prompt Bar Settings panel:
 * - Uses Base UI Button, Slider, Switch, Popover primitives
 * - Surface glass / dark translucent container with 1px border-white/10
 * - Semantic HTML with accessible radio and dialog roles
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
      role="region"
      aria-label="Paramètres de génération"
      className={cn(
        "flow-prompt-box-settings w-72 rounded-2xl p-2.5",
        "bg-[#242426]/95 backdrop-blur-2xl border border-white/10 shadow-2xl",
        "text-white select-none font-sans antialiased",
        className
      )}
      style={{
        boxSizing: "border-box",
        width: "var(--prompt-box-settings-width, 18rem)",
        borderRadius: "16px",
        padding: "0.625rem",
        colorScheme: "dark",
        pointerEvents: "auto",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div className="settings-content flex flex-col gap-2.5">
        {/* ── 1. MODE TOGGLES (Image vs Video) ── */}
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
                  variant={isChecked ? "primary" : "ghost"}
                  onClick={() => onModeChange?.(opt.value)}
                  role="radio"
                  aria-checked={isChecked}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-xs transition-all gap-1.5",
                    isChecked
                      ? "bg-white text-black font-semibold shadow hover:bg-white/90"
                      : "text-white/70 hover:text-white hover:bg-white/10 font-medium"
                  )}
                >
                  <GoogleIcon
                    iconName={opt.icon}
                    className="text-[16px] leading-none"
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
                  variant={isChecked ? "primary" : "ghost"}
                  onClick={() => onSubModeChange?.(opt.value)}
                  role="radio"
                  aria-checked={isChecked}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-xs transition-all gap-1.5",
                    isChecked
                      ? "bg-white text-black font-semibold shadow hover:bg-white/90"
                      : "text-white/70 hover:text-white hover:bg-white/10 font-medium"
                  )}
                >
                  <GoogleIcon
                    iconName={opt.icon}
                    className="text-[16px] leading-none"
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
            className="grid grid-cols-5 gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-full"
          >
            {ratioOptions.map((ratio) => {
              const isChecked = currentRatio === ratio;
              const iconName = getRatioIcon(ratio);

              return (
                <Button
                  key={ratio}
                  type="button"
                  variant={isChecked ? "primary" : "ghost"}
                  onClick={() => handleRatioClick(ratio)}
                  role="radio"
                  aria-checked={isChecked}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[44px] h-[52px] rounded-lg p-1 transition-all",
                    isChecked
                      ? "bg-white text-black font-semibold shadow hover:bg-white/90"
                      : "text-white/70 hover:text-white hover:bg-white/10 font-medium"
                  )}
                >
                  <GoogleIcon
                    iconName={iconName}
                    className="text-[18px] leading-none mb-0.5"
                  />
                  <span className="text-[10px] leading-tight font-mono">{ratio}</span>
                </Button>
              );
            })}
          </div>
        )}

        {/* ── 3. DYNAMIC PARAMETERS (Quality, Video Resolution, Duration, Sliders, Switches) ── */}
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
                          variant={isChecked ? "primary" : "ghost"}
                          onClick={() => onParamChange?.(key, itemVal)}
                          role="radio"
                          aria-checked={isChecked}
                          aria-description={infoText || undefined}
                          className={cn(
                            "h-8 rounded-lg text-xs transition-all px-1.5",
                            !isGrid && "flex-1",
                            isChecked
                              ? "bg-white text-black font-semibold shadow hover:bg-white/90"
                              : "text-white/70 hover:text-white hover:bg-white/10 font-medium"
                          )}
                        >
                          <span className="flex items-center justify-center gap-1 truncate w-full text-center">
                            <span className="truncate">{itemLabel}</span>
                            {hasInfo && (
                              <GoogleIcon
                                iconName="info"
                                role="img"
                                aria-hidden={false}
                                aria-label={infoText}
                                className="text-[13px] opacity-70"
                              />
                            )}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                );
              }

              // Render Boolean Toggles with canonical Switch primitive
              if (def.type === "boolean") {
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/5 border border-white/10"
                  >
                    <span className="text-xs text-white/90 font-medium">
                      {def.label || formatParamLabel(key)}
                    </span>
                    <Switch
                      size="sm"
                      checked={Boolean(val)}
                      onCheckedChange={(checked) => onParamChange?.(key, checked)}
                      aria-label={def.label || formatParamLabel(key)}
                    />
                  </div>
                );
              }

              // Numeric Slider Control with canonical Slider primitive
              if (def.type === "number") {
                const min = def.min ?? 0;
                const max = def.max ?? 100;
                const step = def.step ?? 1;
                const numVal = val !== undefined && val !== null ? Number(val) : (def.default ?? min);

                return (
                  <div key={key} className="flex flex-col gap-1.5 p-2 bg-white/5 border border-white/10 rounded-xl px-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/80 font-medium">{def.label || formatParamLabel(key)}</span>
                      <span className="font-mono text-white font-semibold tabular-nums">{numVal}</span>
                    </div>
                    <Slider
                      min={min}
                      max={max}
                      step={step}
                      value={[Number.isNaN(numVal) ? min : numVal]}
                      onValueChange={([newVal]) => onParamChange?.(key, newVal)}
                      className="w-full py-1"
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
                  className="size-3.5 rounded-sm object-contain brightness-0 invert shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-[14px]">🍌</span>
              )
            }
            displayValue={currentModel?.name || "Model"}
            width={260}
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
                  variant={isChecked ? "primary" : "ghost"}
                  onClick={() => handleCountClick(countVal)}
                  role="radio"
                  aria-checked={isChecked}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-xs transition-all",
                    isChecked
                      ? "bg-white text-black font-semibold shadow hover:bg-white/90"
                      : "text-white/70 hover:text-white hover:bg-white/10 font-medium"
                  )}
                >
                  x{countVal}
                </Button>
              );
            })}
          </div>
        )}

        {/* ── 6. CREDIT COST LABEL ── */}
        {models && models.length > 0 && currentModel && (
          <div className="pt-0.5 text-center">
            <p className="text-[11px] text-white/50">
              La génération utilisera{" "}
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-yellow underline underline-offset-2 hover:text-accent-yellow/80 transition-colors font-medium"
                href="https://support.google.com/googleone?p=g1_ai_credit_menu"
              >
                {displayCredits}&nbsp;{displayCredits === 1 ? "crédit" : "crédits"}
              </a>
            </p>
          </div>
        )}

        {/* ── Empty notice if no models available for this mode ── */}
        {(!models || models.length === 0) && (
          <div className="py-3 px-2 text-center text-xs text-white/50">
            Aucun modèle disponible
          </div>
        )}
      </div>
    </div>
  );
}
