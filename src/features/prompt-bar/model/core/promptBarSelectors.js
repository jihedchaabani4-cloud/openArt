export function extractSupportValue(raw, fallback = null) {
  if (!raw) return fallback;
  if (Array.isArray(raw)) {
    const first = raw[0];
    return typeof first === "object" ? first?.value ?? fallback : first ?? fallback;
  }
  if (typeof raw === "object") {
    return raw.default ?? fallback;
  }
  return raw ?? fallback;
}

export function extractSupportOptions(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => (typeof item === "object" ? item.value : item)).filter(Boolean);
  }
  if (Array.isArray(raw.items)) {
    return raw.items.map((item) => (typeof item === "object" ? item.value : item)).filter(Boolean);
  }
  if (Array.isArray(raw.options)) {
    return raw.options.map((item) => (typeof item === "object" ? item.value : item)).filter(Boolean);
  }
  return [];
}

export function extractMinDuration(raw) {
  if (!raw) return "5s";
  if (typeof raw === "object" && "min" in raw) {
    const unit = raw.unit ?? "s";
    return `${raw.min}${unit}`;
  }
  if (Array.isArray(raw)) {
    const first = raw[0];
    const value = typeof first === "object" ? first?.value : first;
    return value ?? "5s";
  }
  return "5s";
}

export function supportsGenerationMode(model, generationMode) {
  if (!model) return false;

  const isVideoMode = ["video", "keyframe", "motion", "motion-control"].includes(generationMode);
  const isVideoModel = model.category === "video" || model.supportedModes?.some((m) => ["i2v", "t2v", "i2v_se", "motion"].includes(m));

  if (isVideoMode) {
    return isVideoModel;
  }

  if (generationMode === "multiref") {
    return model.supportedModes?.includes("r2v") || (model.support?.references?.max > 1);
  }

  if (["edit", "image", "character", "location", "product"].includes(generationMode)) {
    return model.category === "image" || model.category === generationMode;
  }

  return model.category === generationMode || model.supportedModes?.includes(generationMode);
}

export function selectSupportedModels(studioModels, generationMode) {
  return (studioModels ?? []).filter((item) => supportsGenerationMode(item, generationMode));
}

export function selectPreferredModelKey(studioModels, generationMode, preferredModelId = null) {
  const supportedModels = selectSupportedModels(studioModels, generationMode);

  if (preferredModelId) {
    const preferredModel = studioModels.find((item) => item.key === preferredModelId);
    if (supportsGenerationMode(preferredModel, generationMode)) {
      return preferredModel.key;
    }
  }

  return supportedModels[0]?.key ?? studioModels[0]?.key ?? null;
}

export function selectModelByKey(studioModels, selectedModelId) {
  return studioModels.find((item) => item.key === selectedModelId) ?? null;
}

export function selectMaxRefsForModel(selectedModel, generationMode) {
  if (!selectedModel?.support?.references) {
    return 1;
  }

  let count = selectedModel?.support?.references?.max ?? 4;
  if (generationMode === "motion" || generationMode === "motion-control") {
    count = 2;
  }

  return count;
}

