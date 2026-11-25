"use client";

import { useMemo, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Button } from "@/components/base/button";
import { Label } from "@/components/base/label";
import { ButtonGroup } from "@/components/primitives/button-group";
import { Switch } from "@/components/base/switch";
import { Slider } from "@/components/primitives/slider";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/primitives/popover";
import {
  MenuItemContent,
  MenuSubChevronIcon,
  menuItemClassName,
  menuPanelClassName,
} from "@/components/base/menu";
import { resolveModelIcon, calculateModelCredits } from "@/features/prompt-bar";

/**
 * Ratio icon mapping using Hugeicons
 */
const RATIO_ICONS = {
  "16:9": "rectangle-horizontal",
  "4:3": "rectangle-horizontal",
  "1:1": "square",
  "3:4": "rectangle-vertical",
  "9:16": "rectangle-vertical",
  "21:9": "rectangle-horizontal",
  "9:21": "rectangle-vertical",
  "3:2": "rectangle-horizontal",
  "2:3": "rectangle-vertical",
  "4:5": "rectangle-vertical",
  "5:4": "rectangle-horizontal",
  "1:2": "rectangle-vertical",
  "2:1": "rectangle-horizontal",
};

export function getRatioIcon(ratio) {
  if (RATIO_ICONS[ratio]) return RATIO_ICONS[ratio];
  if (typeof ratio === "string" && ratio.includes(":")) {
    const [w, h] = ratio.split(":").map(Number);
    if (!isNaN(w) && !isNaN(h)) {
      if (w > h) return "rectangle-horizontal";
      if (w < h) return "rectangle-vertical";
      return "square";
    }
  }
  return "square";
}

const RATIO_PARAM_KEYS = ["aspect_ratio", "ratio"];
const COUNT_PARAM_KEYS = ["count", "variations", "num_outputs", "n"];

function extractSelectValues(def) {
  const raw = def?.values || def?.options || def?.enum;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((v) => (typeof v === "object" && v !== null ? v.value : v));
}

function extractCountOptions(def) {
  const explicit = extractSelectValues(def);
  if (explicit.length > 0) return explicit;
  if (typeof def?.min === "number" && typeof def?.max === "number" && def.max >= def.min) {
    const step = typeof def.step === "number" && def.step > 0 ? def.step : 1;
    const options = [];
    for (let v = def.min; v <= def.max && options.length < 20; v += step) {
      options.push(v);
    }
    return options;
  }
  return [];
}

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
  side = "left",
  align = "end",
  sideOffset = 12,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="dropdown-card"
            disabled={disabled}
            className="w-full justify-between rounded-subtle ds-type-small data-[state=open]:bg-surface-tonal-hover"
            aria-label={ariaLabel || label || displayValue}
            data-state={open ? "open" : "closed"}
          >
            <div className="text-ellipsis overflow-hidden flex items-center gap-2">
              {icon}
              <span className="flex min-w-0 flex-col items-start gap-0.5">
                {label && (
                  <Label as="span">{label}</Label>
                )}
                <span className="max-w-full truncate ds-type-small text-text-primary">
                  {displayValue}
                </span>
              </span>
            </div>
            <MenuSubChevronIcon
              className={cn(
                "text-icon-secondary transition-transform duration-150 ease-out",
                open && "rotate-90"
              )}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          role="listbox"
          data-portal="true"
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={16}
          avoidCollisions
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={menuPanelClassName({
            variant: "listbox",
            className: "z-100 max-h-60",
          })}
          style={{
            width: `${width}px`,
            maxHeight: `${maxHeightLimit}px`,
          }}
        >
          <div className="overflow-hidden flex flex-col gap-0.5 w-full" role="group">
            {items.map((item) => {
              const isSelected = String(value) === String(item.value);

              return (
                <div
                  key={String(item.value)}
                  role="option"
                  tabIndex={0}
                  aria-selected={isSelected}
                  data-selected={isSelected ? "true" : undefined}
                  onClick={() => {
                    onChange?.(item.value);
                    setOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onChange?.(item.value);
                      setOpen(false);
                    }
                  }}
                  className={menuItemClassName({ selected: isSelected })}
                >
                  <MenuItemContent
                    icon={item.icon}
                    subtitle={item.subtitle}
                    badge={item.badge}
                    checked={isSelected}
                  >
                    {item.label}
                  </MenuItemContent>
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

  return (
    <FlowSelect
      value={value ?? def.default}
      onChange={(newVal) => onChange?.(paramKey, newVal)}
      items={items}
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
      { value: "image", label: "Image", icon: "image-02" },
      { value: "video", label: "Vidéo", icon: "video-01" },
    ];
    if (!availableModes || availableModes.length === 0) return all;
    const filtered = all.filter((m) => availableModes.includes(m.value));
    return filtered.length > 0 ? filtered : all;
  }, [availableModes]);

  // SubMode Options (Type de vidéo for Video)
  const subModeOptions = useMemo(() => {
    const all = [
      { value: "frames", label: "Frames", icon: "aspect-ratio" },
      { value: "reference", label: "Reference", icon: "puzzle" },
    ];
    if (!availableSubModes || availableSubModes.length === 0) return all;
    return all.filter((s) => availableSubModes.includes(s.value));
  }, [availableSubModes]);

  const currentModeOption = useMemo(() => {
    return modeOptions.find((m) => m.value === activeMode) || modeOptions[0];
  }, [modeOptions, activeMode]);

  const currentSubModeOption = useMemo(() => {
    return subModeOptions.find((s) => s.value === activeSubMode) || subModeOptions[0];
  }, [subModeOptions, activeSubMode]);

  // Ratio Parameter detection (strictly model-declared: aspect_ratio or ratio)
  const ratioParamEntry = useMemo(() => {
    if (!currentModel || models.length === 0) return null;
    const found = parameters.find(([k]) => RATIO_PARAM_KEYS.includes(k));
    if (found) return found;
    const modelParams = currentModel?.parameters || {};
    for (const key of RATIO_PARAM_KEYS) {
      if (modelParams[key]) return [key, modelParams[key]];
    }
    return null;
  }, [parameters, currentModel, models.length]);

  const ratioOptions = useMemo(() => {
    if (!ratioParamEntry) return [];
    const [, def] = ratioParamEntry;
    return extractSelectValues(def).map((v) => String(v));
  }, [ratioParamEntry]);

  const currentRatio = useMemo(() => {
    if (!ratioParamEntry) return "";
    const [key, def] = ratioParamEntry;
    const val = paramValues[key] ?? def?.default;
    return val !== undefined && val !== null ? String(val) : (ratioOptions[0] || "");
  }, [ratioParamEntry, paramValues, ratioOptions]);

  // Outputs / Variations detection (strictly model-declared: count, variations, num_outputs, n)
  const countParamEntry = useMemo(() => {
    if (!currentModel || models.length === 0) return null;
    const found = parameters.find(([k]) => COUNT_PARAM_KEYS.includes(k));
    if (found) return found;
    const modelParams = currentModel?.parameters || {};
    for (const key of COUNT_PARAM_KEYS) {
      if (modelParams[key]) return [key, modelParams[key]];
    }
    return null;
  }, [parameters, currentModel, models.length]);

  const countOptions = useMemo(() => {
    if (!countParamEntry) return [];
    return extractCountOptions(countParamEntry[1]);
  }, [countParamEntry]);

  const currentCountValue = useMemo(() => {
    if (!countParamEntry) return 1;
    const [key, def] = countParamEntry;
    const val = paramValues[key] ?? def?.default ?? countOptions[0];
    return val !== undefined && val !== null ? val : 1;
  }, [countParamEntry, paramValues, countOptions]);

  const currentCount = useMemo(() => {
    const num = Number(currentCountValue);
    return Number.isFinite(num) && num > 0 ? num : 1;
  }, [currentCountValue]);

  const displayCredits = useMemo(() => {
    if (typeof creditCost === "number" && creditCost > 0) return creditCost;
    return calculateModelCredits(currentModel, paramValues, currentCount);
  }, [creditCost, currentModel, paramValues, currentCount]);

  // Other non-ratio non-count parameters (Quality, Duration, Sliders, etc.)
  const otherParams = useMemo(() => {
    if (!currentModel || models.length === 0) return [];
    return parameters.filter(
      ([k]) => !RATIO_PARAM_KEYS.includes(k) && !COUNT_PARAM_KEYS.includes(k)
    );
  }, [parameters, currentModel, models.length]);

  // Current Model Icon
  const currentModelIcon = useMemo(() => {
    return resolveModelIcon(currentModel);
  }, [currentModel]);

  const handleRatioClick = (val) => {
    if (ratioParamEntry && onParamChange) {
      onParamChange(ratioParamEntry[0], val);
    }
  };

  const handleCountClick = (cnt) => {
    if (countParamEntry && onParamChange) {
      onParamChange(countParamEntry[0], cnt);
    }
  };

  return (
    <div
      data-slot="prompt-box-settings"
      className={menuPanelClassName({
        className: cn(
          "settings-content-overlay flow-prompt-box-settings block box-border w-[var(--prompt-box-settings-width,15.5rem)] select-none",
          className
        ),
      })}
    >
      <div className="settings-content flex flex-col gap-1">
        {/* ── 1. MODE TOGGLES ── */}
        {hasModes && modeOptions.length > 0 && (
          <div
            role="radiogroup"
            aria-label="Mode"
            className="flex items-center gap-1 p-0.5 bg-surface-card border border-border-menu-subtle rounded-comfortable w-full"
          >
            {modeOptions.map((opt) => {
              const isChecked = activeMode === opt.value;
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant="segmented"
                  onClick={() => onModeChange?.(opt.value)}
                  role="radio"
                  aria-pressed={isChecked}
                  aria-checked={isChecked}
                  className="flex-1 rounded-subtle ds-type-small"
                >
                  <HugeIcon
                    name={opt.icon}
                    className="leading-none text-icon-primary"
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
            className="flex items-center gap-1 p-0.5 bg-surface-card border border-border-menu-subtle rounded-comfortable w-full"
          >
            {subModeOptions.map((opt) => {
              const isChecked = activeSubMode === opt.value;
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant="segmented"
                  onClick={() => onSubModeChange?.(opt.value)}
                  role="radio"
                  aria-pressed={isChecked}
                  aria-checked={isChecked}
                  className="flex-1 rounded-subtle ds-type-small"
                >
                  <HugeIcon
                    name={opt.icon}
                    className="leading-none text-icon-primary"
                  />
                  <span>{opt.label}</span>
                </Button>
              );
            })}
          </div>
        )}

        {/* ── 2. FORMAT / ASPECT RATIO TOGGLES ── */}
        {ratioParamEntry && ratioOptions.length > 0 && (
          <div
            role="radiogroup"
            aria-label="Format"
            style={{
              gridTemplateColumns: `repeat(${Math.min(ratioOptions.length, 5)}, minmax(0, 1fr))`,
            }}
            className="grid gap-1 p-0.5 bg-surface-card border border-border-menu-subtle rounded-comfortable w-full"
          >
            {ratioOptions.map((ratio) => {
              const isChecked = currentRatio === ratio;
              const iconName = getRatioIcon(ratio);

              return (
                <Button
                  key={ratio}
                  type="button"
                  variant="segmented"
                  onClick={() => handleRatioClick(ratio)}
                  role="radio"
                  aria-pressed={isChecked}
                  aria-checked={isChecked}
                  className="w-full min-w-0 h-8 flex-col !gap-0.5 !py-0.5 !px-1 rounded-subtle"
                >
                  <HugeIcon
                    name={iconName}
                    className="leading-none text-icon-primary"
                  />
                  <span className="ds-type-micro-tag text-text-primary">
                    {ratio}
                  </span>
                </Button>
              );
            })}
          </div>
        )}

        {/* ── 3. DYNAMIC PARAMETERS (Quality, Video Resolution, Duration, etc.) ── */}
        {otherParams.length > 0 && (
          <div className="flex flex-col gap-1">
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
                      "p-0.5 bg-surface-card border border-border-menu-subtle rounded-comfortable w-full max-w-full",
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
                          variant="segmented"
                          onClick={() => onParamChange?.(key, itemVal)}
                          role="radio"
                          aria-pressed={isChecked}
                          aria-checked={isChecked}
                          aria-description={infoText || undefined}
                          className={cn(!isGrid ? "flex-1" : undefined, "rounded-subtle ds-type-small")}
                        >
                          <span className="flex items-center justify-center gap-1 truncate w-full text-center">
                            <span className="truncate text-text-primary">{itemLabel}</span>
                            {hasInfo && (
                              <HugeIcon
                                name="information-circle"
                                size="sm"
                                role="img"
                                aria-hidden={false}
                                aria-label={infoText}
                                className="text-icon-primary hover:text-text-primary"
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
                  <div
                    key={key}
                    className="flex items-center justify-between min-h-[30px] px-2 py-1 rounded-subtle ds-type-small text-text-primary hover:bg-surface-tonal transition-colors"
                  >
                    <span className="truncate">
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
                  <div key={key} className="flex flex-col gap-1 py-1 rounded-subtle">
                    <div className="flex items-center justify-between px-2 py-0.5">
                      <Label as="span">{def.label || key}</Label>
                      <span className="font-mono ds-type-micro-tag text-text-primary tabular-nums">{numVal}</span>
                    </div>
                    <div className="px-2 pb-1">
                      <Slider
                        min={min}
                        max={max}
                        step={step}
                        value={[Number.isNaN(numVal) ? min : numVal]}
                        onValueChange={([newVal]) => onParamChange?.(key, newVal)}
                        className="w-full py-1"
                      />
                    </div>
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
                  <HugeIcon name={icon || "volume-high"} className="text-icon-primary shrink-0" />
                ),
              };
            })}
            displayValue={currentModel?.name || "Model"}
            label="Model"
            width={240}
            maxHeightLimit={320}
            ariaLabel="Sélectionner une famille de modèles"
          />
        )}

        {/* ── 5. OUTPUTS / VARIATIONS TOGGLES ── */}
        {models && models.length > 0 && currentModel && countParamEntry && countOptions.length > 0 && (
          <div
            role="radiogroup"
            aria-label="Nombre de sorties"
            style={{
              gridTemplateColumns: `repeat(${Math.min(countOptions.length, 4)}, minmax(0, 1fr))`,
            }}
            className="grid gap-1 p-0.5 bg-surface-card border border-border-menu-subtle rounded-comfortable w-full"
          >
            {countOptions.map((countVal) => {
              const isChecked = String(currentCountValue) === String(countVal);

              return (
                <Button
                  key={String(countVal)}
                  type="button"
                  variant="segmented"
                  onClick={() => handleCountClick(countVal)}
                  role="radio"
                  aria-pressed={isChecked}
                  aria-checked={isChecked}
                  className="w-full rounded-subtle ds-type-small"
                >
                  {countVal}
                </Button>
              );
            })}
          </div>
        )}

        {/* ── 6. CREDIT COST LABEL ── */}
        {models && models.length > 0 && currentModel && (
          <div className="settings-credit-cost block text-center pt-1 pb-0.5">
            <span className="credit-cost-label block ds-type-micro-tag text-text-secondary">
              <span>
                La génération utilisera{" "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="credit-cost-link ds-type-micro-tag text-text-primary underline underline-offset-2 hover:text-text-body-muted transition-colors"
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
          <div className="py-3 px-2 text-center ds-type-small text-text-secondary">
            Aucun modèle disponible
          </div>
        )}
      </div>
    </div>
  );
}
