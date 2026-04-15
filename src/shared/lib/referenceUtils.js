// src/shared/lib/referenceUtils.js
// ✅ Pure business logic — no UI, no React, fully testable

/**
 * Adapts references when the generation mode changes.
 * 
 * Rules:
 *   image mode       → images only, all roles set to "normal", max maxRefs
 *   video mode       → first image → start, second image → end, first video → mc_video
 *   motion-control   → first image → mc_image, first video → mc_video
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
  // Video-only slot check
  if (role === "mc_video" && !asset.is_video) {
    return { ok: false, reason: "Motion ref slot requires a video." };
  }

  // Image-only slot check
  if ((role === "mc_image" || role === "start" || role === "end") && asset.is_video) {
    return { ok: false, reason: "This slot requires an image, not a video." };
  }

  // Capacity check
  const normalRoles = ["normal", "image_ref", "start", "end"];
  if (normalRoles.includes(role)) {
    const count = currentRefs.filter((r) => normalRoles.includes(r.role)).length;
    if (count >= maxRefs) {
      return { ok: false, reason: `Max ${maxRefs} references reached.` };
    }
  }

  // Smart duplicate check: allow same image as start+end, block true duplicates
  const isDuplicate = currentRefs.some(
    (r) => r.url === asset.url && r.role === role
  );
  if (isDuplicate) {
    return { ok: false, reason: "This asset is already added with the same role." };
  }

  return { ok: true };
}

/**
 * Builds the references payload for the generate API call.
 */
export function buildReferencesPayload(referenceImages) {
  return referenceImages.map((r) => ({
    url:      r.url,
    asset_id: r.asset_id ?? null,
    media_id: r.asset_id ?? null, // Backend controller expects media_id
    id:       r.asset_id ?? null, // Fallback alias
    role:     r.role ?? "normal",
    type:     r.type ?? "image",
  }));
}

/**
 * Extracts generation config from a generation item (for Reuse Settings).
 */
export function getGenerationConfig(item, group) {
  // New Schema Support
  if (item?.mediaMetadata?.requestData) {
    const meta = item.mediaMetadata.requestData;
    const settings = meta.settings || {};
    const prompt = meta.promptInputs?.[0]?.textInput || settings.prompt || "Generated Asset";
    return { ...settings, prompt, model_name: meta.modelId || meta.modelName };
  }

  // Old Schema Fallback
  const params = item.params ?? group?.params ?? {};
  const prompt =
    params.prompt ??
    item.prompt ??
    group?.items?.[0]?.asset?.prompt ??
    "Generated Asset";
  return { ...params, prompt };
}
