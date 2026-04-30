// src/shared/lib/referenceUtils.js
// Pure business logic - no UI, no React, fully testable

/**
 * Adapts references when the generation mode changes.
 *
 * Rules:
 *   image mode       -> images only, all roles set to "normal", max maxRefs
 *   video mode       -> first image -> start, second image -> end, first video -> mc_video
 *   motion-control   -> first image -> mc_image, first video -> mc_video
 *
 * @param {Array}  currentRefs  - Current reference array from the store
 * @param {string} newMode      - Target mode: "image" | "video" | "motion-control"
 * @param {number} maxRefs      - Max number of references allowed
 * @returns {Array}             - New adapted reference array (immutable)
 */
export function adaptReferences(currentRefs = [], newMode = "image", maxRefs = 4) {
  if (!currentRefs.length) return [];

  const images = currentRefs.filter((r) => r.type !== "video" && !r.is_video);
  const videos = currentRefs.filter((r) => r.type === "video" || r.is_video);

  switch (newMode) {
    case "image":
      return images
        .slice(0, maxRefs)
        .map((r) => ({ ...r, role: "normal" }));

    case "video": {
      const adapted = [];
      if (images[0]) adapted.push({ ...images[0], role: "start" });
      if (images[1]) adapted.push({ ...images[1], role: "end" });
      const vid = videos.find((v) => v.role === "mc_video") ?? videos[0];
      if (vid) adapted.push({ ...vid, role: "mc_video" });
      return adapted;
    }

    case "motion-control": {
      const adapted = [];
      const img = images[0];
      const vid = videos.find((v) => v.role === "mc_video") ?? videos[0];
      if (img) adapted.push({ ...img, role: "mc_image" });
      if (vid) adapted.push({ ...vid, role: "mc_video" });
      return adapted;
    }

    default:
      return currentRefs;
  }
}

/**
 * Validates if an asset can be added given mode + current refs.
 * Returns { ok: true } or { ok: false, reason: string }
 */
export function validateReference(asset, role, currentRefs, maxRefs, generationMode) {
  if (role === "mc_video" && !asset.is_video) {
    return { ok: false, reason: "Motion ref slot requires a video." };
  }

  if ((role === "mc_image" || role === "start" || role === "end") && asset.is_video) {
    return { ok: false, reason: "This slot requires an image, not a video." };
  }

  const normalRoles = ["normal", "image_ref", "start", "end"];
  if (normalRoles.includes(role)) {
    const count = currentRefs.filter((r) => normalRoles.includes(r.role)).length;
    if (count >= maxRefs) {
      return { ok: false, reason: `Max ${maxRefs} references reached.` };
    }
  }

  const isDuplicate = currentRefs.some(
    (r) => r.url === asset.url && r.role === role
  );
  if (isDuplicate) {
    return { ok: false, reason: "This asset is already added with the same role." };
  }

  return { ok: true };
}

export function buildReferencesPayload(referenceImages) {
  return referenceImages.map((r) => ({
    id: r.workflowId || r.workflow_id || r.id || r.asset_id || null,
    workflow_id: r.workflowId || r.workflow_id || r.id || r.asset_id || null,
    role: r.role ?? "normal",
    type: r.type ?? "image",
    label: r.label ?? "unnamed",
    dna: r.dna ?? null,
  }));
}

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
