// src/shared/lib/referenceUtils.js
// Pure business logic - no UI, no React, fully testable

function inferReferenceRole(ref = {}) {
  const inputType = ref.input_type || ref.inputType || "";
  if (inputType === "IMAGE_INPUT_TYPE_START_FRAME") return "start";
  if (inputType === "IMAGE_INPUT_TYPE_END_FRAME")   return "end";
  if (inputType === "IMAGE_INPUT_TYPE_BASE_IMAGE")  return "start";
  if (inputType === "IMAGE_INPUT_TYPE_REFERENCE")   return "normal";
  
  const role = ref.role || "normal";
  if (role === "IMAGE_INPUT_TYPE_REFERENCE") return "normal";
  return role;
}

function normalizeReference(ref = {}) {
  const media = ref.ref_media || ref.media || {};
  const url = ref.url || media.url || null;
  const workflowId = ref.workflow_id || ref.workflowId || media.workflow_id || media.workflowId || null;
  const assetId = ref.asset_id || ref.assetId || ref.ref_media_id || media.id || workflowId || null;
  const type = ref.type || (url?.match(/\.(mp4|webm|mov)$/i) ? "video" : "image");

  return {
    ...ref,
    url,
    workflow_id: workflowId,
    workflowId,
    asset_id: assetId,
    assetId,
    role: inferReferenceRole(ref),
    type,
    ref_media: media,
  };
}

function normalizeReferences(references = []) {
  return (references || [])
    .map(normalizeReference)
    .filter((ref) => ref.url || ref.workflow_id || ref.asset_id);
}

/**
 * Extracts generation config from a generation item (for Reuse Settings).
 */
export function getGenerationConfig(item, group) {
  if (group?.generation_info) {
    const info = group.generation_info;
    return {
      ...info,
      prompt: info.prompt || item?.prompt || "Generated Asset",
      model_name: info.model || info.model_name,
      ratio: info.aspect_ratio || info.ratio || "1:1",
      references: normalizeReferences(info.references),
    };
  }

  if (item?.mediaMetadata?.requestData) {
    const meta = item.mediaMetadata.requestData;
    const settings = meta.settings || {};
    const prompt = meta.promptInputs?.[0]?.textInput || settings.prompt || "Generated Asset";

    const refs = meta.references || settings.references || settings.input_assets || item.generationConfig?.references || [];

    return {
      ...settings,
      prompt,
      model_name: meta.modelId || meta.modelName || settings.model_name,
      ratio: settings.aspect_ratio || settings.ratio || "1:1",
      references: normalizeReferences(refs),
    };
  }

  const params = item?.params ?? group?.params ?? {};
  const config = item?.generationConfig ?? group?.generationConfig ?? {};
  const merged = { ...params, ...config };
  const prompt = merged.prompt ?? item?.prompt ?? group?.items?.[0]?.asset?.prompt ?? "Generated Asset";

  return {
    ...merged,
    prompt,
    references: normalizeReferences(merged.references || merged.input_assets || []),
  };
}
