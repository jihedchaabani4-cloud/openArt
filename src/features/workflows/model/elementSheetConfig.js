import { extractFeaturesFromPrompt, getFeatureInfoFromLabel } from "@/features/prompt-bar/model/feature-constants";
import { getPrimaryMedia, getPrimaryMediaConfig, getItemMetadata } from "@/shared/lib/generationUtils";

const ELEMENT_MODE_BY_DNA_TYPE = {
  CHARACTER: "character",
  LOCATION: "location",
  PRODUCT: "product",
};

export const ELEMENT_SHEET_CONFIGS = {
  character: {
    type: "character",
    label: "Character",
    maxReferences: 5,
    support: {
      references: { min: 0, max: 5 },
    },
  },
  location: {
    type: "location",
    label: "Location",
    maxReferences: 1,
    support: {
      references: { min: 0, max: 1 },
    },
  },
  product: {
    type: "product",
    label: "Product",
    maxReferences: 1,
    support: {
      references: { min: 0, max: 1 },
    },
  },
};

const DEFAULT_ELEMENT_SHEET_CONFIG = {
  type: "default",
  label: "Element",
  maxReferences: 5,
  support: {
    references: { min: 0, max: 5 },
  },
};

export function isElementSheetMode(mode) {
  return Object.prototype.hasOwnProperty.call(ELEMENT_SHEET_CONFIGS, mode);
}

export function getElementSheetConfig(mode) {
  return ELEMENT_SHEET_CONFIGS[mode] || DEFAULT_ELEMENT_SHEET_CONFIG;
}

export function normalizeElementMode(dnaType) {
  return ELEMENT_MODE_BY_DNA_TYPE[(dnaType || "").toUpperCase()] || "character";
}

export function normalizeElementReferences(references = []) {
  const safeRefs = Array.isArray(references) ? references : [];
  return safeRefs
    .filter((item) => item?.url)
    .map((item, index) => {
      const assetId = item.asset_id ?? item.assetId ?? item.id ?? item.name ?? `${item.url}-${index}`;
      const isVideo =
        item.is_video ||
        item.type === "video" ||
        item.url?.toLowerCase().endsWith(".mp4") ||
        item.url?.toLowerCase().endsWith(".webm");

      return {
        ...item,
        asset_id: assetId,
        role: item.role ?? "normal",
        type: isVideo ? "video" : "image",
        is_video: !!isVideo,
      };
    });
}

export function buildElementPrompt(basePrompt = "", traits = []) {
  const cleanedPrompt = (basePrompt || "").trim();
  const safeTraits = Array.isArray(traits) ? traits : [];
  const traitTags = safeTraits
    .map((trait) => {
      if (typeof trait === "string") return trait.trim();
      return trait?.label?.trim() || trait?.name?.trim() || trait?.value?.trim() || "";
    })
    .filter(Boolean)
    .map((trait) => {
      const resolved = getFeatureInfoFromLabel(trait);
      return resolved?.label || trait;
    });

  const existingTags = new Set(
    Array.from(cleanedPrompt.matchAll(/<Trait:\s*([^>]+)>/gi)).map((match) => match[1].trim().toLowerCase())
  );

  const missingTags = traitTags.filter((trait) => !existingTags.has(trait.toLowerCase()));
  const appendedTags = missingTags.map((trait) => `<Trait: ${trait}>`).join(" ");

  return [cleanedPrompt, appendedTags].filter(Boolean).join(" ").trim();
}

export function buildElementSheetDraft(workflow, targetItem = null) {
  const currentItem = targetItem || getPrimaryMedia(workflow);
  if (!workflow || !currentItem) return null;

  const primaryMedia = getPrimaryMedia(workflow);
  const primaryConfig = getPrimaryMediaConfig(workflow) || {};
  const meta = getItemMetadata(currentItem);
  const primaryMeta = getItemMetadata(primaryMedia);
  const workflowPrompt = primaryConfig.prompt || currentItem?.params?.prompt || meta.prompt || "";
  const dna = primaryConfig.dna || null;
  const elementMode = normalizeElementMode(dna?.type);
  const elementConfig = getElementSheetConfig(elementMode);
  const prompt = buildElementPrompt(workflowPrompt, dna?.traits || []);
  const references = normalizeElementReferences(primaryConfig.references || []);
  const features = extractFeaturesFromPrompt(prompt);

  return {
    mode: elementMode,
    prompt,
    references,
    features,
    dna,
    isVideo: meta.isVideo ?? false,
    url: meta.url,
    primaryMediaUrl: primaryMeta.url,
    mediaId: currentItem?.id || currentItem?.name,
    primaryMediaId: workflow.metadata?.primaryMediaId,
    workflowId: workflow.id || workflow.name,
    workflowType: workflow.workflow_type,
    promptConfig: {
      model: primaryConfig.model || primaryConfig.model_name || "",
      ratio: primaryConfig.ratio || currentItem?.params?.ratio || meta.ratioStr || "1:1",
      quality: primaryConfig.quality || currentItem?.params?.quality || "standard",
      videoResolution: primaryConfig.video_resolution || currentItem?.params?.video_resolution || "1080p",
    },
  };
}
