export function normalizeGenerationMode(mode) {
  return mode === "video" ? "keyframe" : mode ?? "image";
}

export function isMotionMode(generationMode) {
  return ["motion", "motion-control"].includes(generationMode);
}

export function isVideoMode(generationMode) {
  return ["video", "keyframe", "motion", "motion-control"].includes(normalizeGenerationMode(generationMode));
}

export function isSlottedReferenceMode(generationMode) {
  return isMotionMode(generationMode) || generationMode === "keyframe";
}

export function isVideoAsset(asset) {
  if (!asset) return false;
  return Boolean(
    asset.is_video ||
      asset.type === "video" ||
      asset.url?.toLowerCase().endsWith(".mp4") ||
      asset.url?.toLowerCase().endsWith(".webm") ||
      asset.url?.toLowerCase().endsWith(".mov")
  );
}

export function getReferenceAssetKey(asset) {
  return asset?.asset_id ?? asset?.workflow_id ?? asset?.id ?? asset?.ref_media_id ?? asset?.url ?? null;
}

export function cleanMediaAssetTags(prompt = "", assetIds = []) {
  let nextPrompt = String(prompt ?? "");
  assetIds.filter(Boolean).forEach((assetId) => {
    const tagRegex = new RegExp(`<MediaAsset:\\s*${assetId}>`, "gi");
    nextPrompt = nextPrompt.replace(tagRegex, "");
  });
  return nextPrompt.replace(/\s\s+/g, " ").trim();
}

export function cleanAllMediaAssetTags(prompt = "") {
  return String(prompt ?? "").replace(/<MediaAsset:\s*[a-f0-9-]+>/gi, "").replace(/\s\s+/g, " ").trim();
}

export function getGenerationSection(generationMode) {
  if (isMotionMode(generationMode)) return "motion";
  if (generationMode && generationMode !== "image") return "video_studio";
  return "image_generator";
}

export function resolveGenerationReferenceRole({ generationMode, referenceImages = [], role = "normal", asset }) {
  const isVideo = isVideoAsset(asset);
  const normalizedMode = normalizeGenerationMode(generationMode);
  const isMotion = isMotionMode(generationMode);
  const isKeyframe = normalizedMode === "keyframe";

  let nextRole = role;
  if (nextRole === "normal") {
    if (generationMode === "motion-control") {
      nextRole = isVideo ? "mc_video" : "mc_image";
    } else if (isKeyframe) {
      const hasStart = referenceImages.some((r) => r.role === "start");
      nextRole = hasStart ? "end" : "start";
    }
  }

  return { nextRole, isVideo, isMotion, isKeyframe };
}

export function shouldAllowReferenceAdd({ generationMode, role = "normal", asset, referenceImages = [], maxRefs = 4 }) {
  const { nextRole, isVideo, isMotion, isKeyframe } = resolveGenerationReferenceRole({
    generationMode,
    referenceImages,
    role,
    asset,
  });

  const isSlotted = isMotion || isKeyframe;
  if (isSlotted && role === "normal") {
    return { ok: false, reason: `Blocked 'normal' ref in slotted mode: ${generationMode}. Use specific roles.` };
  }

  if (isMotion) {
    if (nextRole === "mc_video" && !isVideo) {
      return { ok: false, reason: "mc_video role requires a video." };
    }
    if (nextRole === "mc_image" && isVideo) {
      return { ok: false, reason: "mc_image role requires an image." };
    }
  }

  if (isVideo && !isMotion) {
    return { ok: false, reason: `Videos only allowed in motion modes. Blocked for: ${generationMode}` };
  }

  const singularRoles = ["start", "end", "mc_image", "mc_video"];
  const canReplace = singularRoles.includes(nextRole);
  if (!canReplace) {
    const normalCount = referenceImages.filter((r) => !singularRoles.includes(r.role)).length;
    if (normalCount >= maxRefs) {
      return { ok: false, reason: `Reference limit reached (max ${maxRefs})` };
    }
  }

  return { ok: true, nextRole, isVideo };
}

export function resolveGenerationSectionMode(generationMode) {
  return getGenerationSection(generationMode);
}

