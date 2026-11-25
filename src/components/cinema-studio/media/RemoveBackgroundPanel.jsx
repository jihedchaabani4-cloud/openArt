"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import { Switch } from "@/components/base/switch";
import { Input } from "@/components/base/input";
import { Label } from "@/components/base/label";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Slider } from "@/components/primitives/slider";
import { Textarea } from "@/components/primitives/textarea";
import {
  FlowSelect,
  formatParamLabel,
} from "@/components/cinema-studio/prompt-bar/selectors/FlowPromptBoxSettings";
import {
  REMOVE_BACKGROUND_PROMPT_MAX_LENGTH,
  filterRemoveBackgroundModels,
  getRemoveBackgroundModelCost,
  resolveDefaultRemoveBackgroundModelKey,
} from "@/features/workflows/api/mutations/useImageRemoveBackgroundEdit";
import { cn } from "@/shared/lib/utils";

const SKIPPED_DYNAMIC_PARAMS = new Set(["input_image", "prompt"]);

function buildInitialParamValues(model) {
  const values = {};
  const params = model?.parameters;
  if (!params || typeof params !== "object") return values;

  for (const [key, def] of Object.entries(params)) {
    if (SKIPPED_DYNAMIC_PARAMS.has(key) || !def || typeof def !== "object") continue;

    if (def.type === "boolean") {
      values[key] = typeof def.default === "boolean" ? def.default : false;
    } else if (Array.isArray(def.values) && def.values.length > 0) {
      values[key] = def.default !== undefined ? def.default : def.values[0];
    } else if (def.type === "number" || def.type === "integer") {
      if (typeof def.default === "number" && Number.isFinite(def.default)) {
        values[key] = def.default;
      } else if (typeof def.min === "number" && Number.isFinite(def.min)) {
        values[key] = def.min;
      } else {
        values[key] = "";
      }
    } else {
      values[key] = def.default !== undefined && def.default !== null ? String(def.default) : "";
    }
  }

  return values;
}

/**
 * RemoveBackgroundPanel
 * Schema-driven In-Place Image Edit sidebar for `POST /api/images/remove-background`.
 * Uses canonical DESIGN.md primitives (`Textarea variant="outline"`, Prompt Bar `FlowSelect`,
 * `Button variant="segmented"`, `Switch`, `Slider`, and `Input variant="outline"`).
 */
export function RemoveBackgroundPanel({
  models: rawModels = [],
  isLoadingModels = false,
  isSubmitting = false,
  isPrimaryProcessing = false,
  onGenerate,
  onBack,
  onClose,
  className,
}) {
  const models = React.useMemo(() => filterRemoveBackgroundModels(rawModels), [rawModels]);

  const [selectedModelKey, setSelectedModelKey] = React.useState(() =>
    resolveDefaultRemoveBackgroundModelKey(rawModels)
  );
  const [prompt, setPrompt] = React.useState("");
  const [paramValues, setParamValues] = React.useState(() => {
    const initialKey = resolveDefaultRemoveBackgroundModelKey(rawModels);
    const initialModel = filterRemoveBackgroundModels(rawModels).find((m) => m.key === initialKey);
    return buildInitialParamValues(initialModel);
  });

  // Sync selected model when dynamic catalog arrives or updates
  React.useEffect(() => {
    if (models.length === 0) return;
    const exists = models.some((m) => m.key === selectedModelKey);
    if (!exists) {
      const nextKey = resolveDefaultRemoveBackgroundModelKey(models);
      const nextModel = models.find((m) => m.key === nextKey) || null;
      setSelectedModelKey(nextKey);
      setParamValues(buildInitialParamValues(nextModel));
      if (!nextModel?.parameters?.prompt) {
        setPrompt("");
      }
    }
  }, [models, selectedModelKey]);

  const selectedModel = React.useMemo(
    () => models.find((m) => m.key === selectedModelKey) || models[0] || null,
    [models, selectedModelKey]
  );

  const supportsPrompt = Boolean(selectedModel?.parameters?.prompt);
  const selectedCost = getRemoveBackgroundModelCost(selectedModel);

  const modelSelectItems = React.useMemo(
    () =>
      models.map((m) => ({
        value: m.key,
        label: m.displayName || m.key,
      })),
    [models]
  );

  const dynamicParamEntries = React.useMemo(() => {
    const params = selectedModel?.parameters;
    if (!params || typeof params !== "object") return [];
    return Object.entries(params).filter(
      ([key, def]) => !SKIPPED_DYNAMIC_PARAMS.has(key) && def && typeof def === "object"
    );
  }, [selectedModel]);

  const handleSelectModel = React.useCallback(
    (nextKey) => {
      if (nextKey === selectedModel?.key) return;
      const nextModel = models.find((m) => m.key === nextKey) || null;
      setSelectedModelKey(nextKey);
      setParamValues(buildInitialParamValues(nextModel));
      if (!nextModel?.parameters?.prompt) {
        setPrompt("");
      }
    },
    [models, selectedModel?.key]
  );

  const handleParamChange = React.useCallback((key, value) => {
    setParamValues((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const isBusy = isSubmitting || isPrimaryProcessing;
  const canSubmit = Boolean(selectedModel && !isBusy && !isLoadingModels && onGenerate);

  const handleSubmit = React.useCallback(() => {
    if (!canSubmit || !selectedModel) return;

    const extraParameters = {};
    let preserveAlpha;

    for (const [key, def] of dynamicParamEntries) {
      const rawVal = paramValues[key];
      if (key === "preserve_alpha") {
        preserveAlpha = typeof rawVal === "boolean" ? rawVal : Boolean(def.default ?? true);
        continue;
      }
      if (rawVal === undefined || rawVal === null || rawVal === "") continue;
      if (def.type === "number" || def.type === "integer") {
        const num = Number(rawVal);
        if (Number.isFinite(num)) extraParameters[key] = num;
      } else {
        extraParameters[key] = rawVal;
      }
    }

    onGenerate({
      model: selectedModel.key,
      modelSchema: selectedModel,
      ...(supportsPrompt && prompt.trim() ? { prompt: prompt.trim() } : {}),
      ...(typeof preserveAlpha === "boolean" ? { preserve_alpha: preserveAlpha } : {}),
      ...(Object.keys(extraParameters).length > 0 ? { parameters: extraParameters } : {}),
    });
  }, [canSubmit, selectedModel, dynamicParamEntries, paramValues, supportsPrompt, prompt, onGenerate]);

  return (
    <section
      aria-label="Remove background editor"
      data-slot="remove-background-panel"
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
            Remove Background
          </h2>
        </div>

        <IconButton
          type="button"
          variant="tonal"
          size="sm"
          aria-label="Close Remove Background"
          onClick={onClose}
        >
          <HugeIcon name="cancel-01" size="sm" />
        </IconButton>
      </header>

      {/* Body: FlowSelect Model Dropdown + Animated Prompt Textarea + Dynamic Settings */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
        {/* 1. Model Selector Dropdown (reused Prompt Bar FlowSelect) */}
        {isLoadingModels ? (
          <div className="py-3 px-2 text-center ds-type-small text-text-secondary">
            Loading models…
          </div>
        ) : models.length === 0 ? (
          <div className="py-3 px-2 text-center ds-type-small text-text-secondary">
            No background removal models available.
          </div>
        ) : (
          <FlowSelect
            value={selectedModel?.key}
            onChange={handleSelectModel}
            items={modelSelectItems}
            label="Model"
            displayValue={selectedModel?.displayName || selectedModel?.key || "Model"}
            width={256}
            maxHeightLimit={320}
            side="bottom"
            align="start"
            sideOffset={6}
            disabled={isSubmitting}
            ariaLabel="Select remove background model"
          />
        )}

        {/* 2. Optional Prompt (animated reveal below Model selector when model declares parameters.prompt) */}
        <AnimatePresence initial={false}>
          {supportsPrompt && (
            <motion.div
              key="remove-bg-prompt"
              data-slot="remove-bg-prompt"
              initial={{ opacity: 0, height: 0, y: -6 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <Textarea
                id="remove-bg-prompt-input"
                variant="outline"
                label="Prompt"
                labelExtra={
                  prompt.length > 0
                    ? `${prompt.length}/${REMOVE_BACKGROUND_PROMPT_MAX_LENGTH}`
                    : undefined
                }
                rows={4}
                minHeight={104}
                maxHeight={180}
                maxLength={REMOVE_BACKGROUND_PROMPT_MAX_LENGTH}
                disabled={isSubmitting}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && canSubmit) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="e.g. Keep only the person on the left..."
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Dynamic Schema-Driven Parameters (reused Prompt Bar settings controls) */}
        {dynamicParamEntries.length > 0 && (
          <div className="flex flex-col gap-1.5" data-slot="remove-bg-parameters">
            {dynamicParamEntries.map(([key, def]) => {
              const label = def.label || formatParamLabel(key);
              const val = paramValues[key];
              const fieldId = `remove-bg-param-${key}`;

              // Boolean -> Prompt Bar settings Switch row
              if (def.type === "boolean") {
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between min-h-8 px-2 py-1 rounded-subtle hover:bg-surface-tonal transition-colors"
                  >
                    <Label
                      htmlFor={fieldId}
                      disabled={isSubmitting}
                      className="block min-w-0 truncate cursor-pointer"
                    >
                      {label}
                    </Label>
                    <Switch
                      id={fieldId}
                      checked={Boolean(val)}
                      disabled={isSubmitting}
                      onCheckedChange={(checked) => handleParamChange(key, Boolean(checked))}
                      aria-label={label}
                    />
                  </div>
                );
              }

              // Enum (`values`) -> Prompt Bar segmented radiogroup (<=3) or FlowSelect (>3)
              if (Array.isArray(def.values) && def.values.length > 0) {
                if (def.values.length <= 3) {
                  return (
                    <div key={key} className="flex flex-col gap-1">
                      <Label as="span" className="px-1">
                        {label}
                      </Label>
                      <div
                        role="radiogroup"
                        aria-label={label}
                        className="flex items-center gap-1 p-0.5 bg-surface-card border border-border-menu-subtle rounded-subtle w-full"
                      >
                        {def.values.map((option) => {
                          const optionVal = typeof option === "object" ? option.value : option;
                          const optionLabel =
                            typeof option === "object" ? option.label || option.value : String(option);
                          const isChecked = String(val) === String(optionVal);
                          return (
                            <Button
                              key={String(optionVal)}
                              type="button"
                              variant="segmented"
                              role="radio"
                              aria-pressed={isChecked}
                              aria-checked={isChecked}
                              disabled={isSubmitting}
                              onClick={() => handleParamChange(key, optionVal)}
                              className={cn(
                                "flex-1 rounded-subtle",
                                def.values.length === 3
                                  ? "px-1.5 ds-type-micro-tag"
                                  : "px-2 ds-type-small"
                              )}
                            >
                              {optionLabel}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const items = def.values.map((option) => {
                  const optionVal = typeof option === "object" ? option.value : option;
                  const optionLabel =
                    typeof option === "object" ? option.label || option.value : String(option);
                  return { value: optionVal, label: formatParamLabel(String(optionLabel)) };
                });
                const activeItem = items.find((it) => String(it.value) === String(val));

                return (
                  <FlowSelect
                    key={key}
                    value={val ?? def.default}
                    onChange={(next) => handleParamChange(key, next)}
                    items={items}
                    label={label}
                    displayValue={activeItem?.label || String(val ?? def.values[0])}
                    width={256}
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    disabled={isSubmitting}
                    ariaLabel={label}
                  />
                );
              }

              // Number / Integer -> Prompt Bar Slider (if bounded) or Outline Input
              if (def.type === "number" || def.type === "integer") {
                const hasBounds =
                  typeof def.min === "number" &&
                  Number.isFinite(def.min) &&
                  typeof def.max === "number" &&
                  Number.isFinite(def.max) &&
                  def.max > def.min;

                if (hasBounds) {
                  const step =
                    typeof def.step === "number" && def.step > 0
                      ? def.step
                      : def.type === "integer"
                        ? 1
                        : 0.1;
                  const numericVal = Number.isFinite(Number(val)) ? Number(val) : def.min;
                  return (
                    <div key={key} className="flex flex-col gap-1 py-1 rounded-subtle">
                      <div className="px-2 py-0.5 flex items-center justify-between">
                        <Label as="span">{label}</Label>
                        <span className="font-mono ds-type-small text-text-primary tabular-nums">
                          {numericVal}
                        </span>
                      </div>
                      <div className="px-2 pb-1">
                        <Slider
                          min={def.min}
                          max={def.max}
                          step={step}
                          disabled={isSubmitting}
                          aria-label={label}
                          value={[numericVal]}
                          onValueChange={([next]) => handleParamChange(key, next)}
                          className="w-full py-1"
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={key} className="flex flex-col gap-1">
                    <Label htmlFor={fieldId} disabled={isSubmitting} className="px-1">
                      {label}
                    </Label>
                    <Input
                      id={fieldId}
                      variant="outline"
                      type="number"
                      min={def.min}
                      max={def.max}
                      step={def.step}
                      disabled={isSubmitting}
                      value={val ?? ""}
                      onChange={(e) => handleParamChange(key, e.target.value)}
                    />
                  </div>
                );
              }

              // String -> Base UI Input (outline variant)
              return (
                <div key={key} className="flex flex-col gap-1">
                  <Label htmlFor={fieldId} disabled={isSubmitting} className="px-1">
                    {label}
                  </Label>
                  <Input
                    id={fieldId}
                    variant="outline"
                    type="text"
                    disabled={isSubmitting}
                    placeholder={def.description || ""}
                    value={val ?? ""}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: Primary White CTA */}
      <footer className="p-3 border-t border-border-subtle shrink-0">
        <Button
          type="button"
          variant="cta-lg"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full h-9 justify-center gap-2 ds-type-button"
        >
          <span>
            {isSubmitting
              ? "Removing…"
              : isPrimaryProcessing
                ? "Processing…"
                : "Remove Background"}
          </span>
          {!isBusy && selectedCost !== null && (
            <span className="tabular-nums opacity-80">{selectedCost}</span>
          )}
        </Button>
      </footer>
    </section>
  );
}

export default RemoveBackgroundPanel;
