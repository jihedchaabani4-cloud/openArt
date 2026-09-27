/**
 * Prompt Bar Platform — Media Reference & Animation Service (v2 / v3 Architecture)
 *
 * Core service providing:
 * 1. addMediaToPrompt({ store, media, featureConfig })
 *    - Dynamically evaluates active mode (image/video), sub-mode (frames/reference), and model capabilities.
 *    - In reference mode: adds to reference list / parameter (respects quota & deduplication).
 *    - In keyframes mode: assigns to start frame (or end frame if start is occupied).
 *    - Automatically registers character / element entities in the store if applicable.
 *
 * 2. animateMedia({ store, media, featureConfig })
 *    - Transitions prompt bar to Video mode -> Frames sub-mode regardless of previous mode.
 *    - Clears existing media references (images, reference_images, entities, and prompt tags).
 *    - Automatically switches to an eligible video frames model if currently on an image model.
 *    - Sets the media into the start frame (input_image) parameter and clears end frame.
 *
 * 3. normalizeMediaAsset(media, defaultRole)
 *    - Unifies media objects into the standard shape expected by PromptBar Platform.
 */

import { autoAssignReference, getAssetId, cleanTagsForAsset } from "./tagsService.js";
import { getActivePromptBarStore } from "../PromptBarStoreContext.js";
import { getEntityImageCount } from "./entityService.js";
import { getModelReferenceCapability } from "./modelManagement.js";

const PENDING_STORAGE_KEY = "openart_pending_prompt_action";

/**
 * Stores a pending prompt bar action across page navigations.
 * @param {object} action
 */
export function setPendingPromptAction(action) {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(action));
    } catch (e) {
      console.warn("[mediaReferenceService] Failed to set pending prompt action:", e);
    }
  }
}

/**
 * Consumes and clears any pending prompt bar action.
 * @returns {object|null}
 */
export function consumePendingPromptAction() {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const raw = window.sessionStorage.getItem(PENDING_STORAGE_KEY);
      if (raw) {
        window.sessionStorage.removeItem(PENDING_STORAGE_KEY);
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("[mediaReferenceService] Failed to consume pending prompt action:", e);
    }
  }
  return null;
}

/**
 * Determines whether at least one model in the catalog can accept this entity.
 * Checks image domain and model capacity (maxRefs >= requiredCount).
 *
 * @param {object} entity - Character or Element entity/workflow
 * @param {Array<object>} models - Available model catalog
 * @returns {boolean}
 */
export function canAnyModelAcceptEntity(entity, models = []) {
  if (!entity) return true;
  const list = Array.isArray(models) ? models : Object.values(models || {});
  if (list.length === 0) return true;

  const count = getEntityImageCount(entity);
  return list.some((m) => {
    if (m.domain !== "image") return false;
    const cap = getModelReferenceCapability(m);
    return cap.supports && (cap.maxRefs || 0) >= count;
  });
}

/**
 * Finds the image model capable of accepting all constituent images of this entity,
 * prioritizing models with the highest available capacity (maxRefs).
 *
 * @param {object} entity - Character or Element entity/workflow
 * @param {Array<object>} models - Available model catalog
 * @returns {object|null}
 */
export function findBestModelForEntity(entity, models = []) {
  if (!entity) return null;
  const list = Array.isArray(models) ? models : Object.values(models || {});
  if (list.length === 0) return null;

  const count = getEntityImageCount(entity);
  const eligible = list.filter((m) => {
    if (m.domain !== "image") return false;
    const cap = getModelReferenceCapability(m);
    return cap.supports && (cap.maxRefs || 0) >= count;
  });

  if (eligible.length === 0) return null;

  // Sort descending by max capacity (maxRefs)
  eligible.sort((a, b) => {
    const capA = getModelReferenceCapability(a).maxRefs || 0;
    const capB = getModelReferenceCapability(b).maxRefs || 0;
    return capB - capA;
  });

  return eligible[0];
}

/**
 * Normalizes any workflow, media item, or asset into the canonical shape expected
 * by PromptBarPlatform and its active run serialization.
 *
 * @param {object} media - Raw media object from workflow or item
 * @param {string} [defaultRole="reference"] - Default slot role
 * @returns {object|null}
 */
export function normalizeMediaAsset(media, defaultRole = "reference") {
  if (!media) return null;

  const workflowId =
    media.workflow_id || media.workflowId || media.id || media.asset_id || media.assetId || null;

  const rawWorkflowType = String(media.workflow_type || media.workflowType || "").toUpperCase();
  const isElement =
    media.type === "element" ||
    Boolean(media.is_element) ||
    Boolean(media.elementId) ||
    Boolean(media.element) ||
    rawWorkflowType === "ELEMENT" ||
    rawWorkflowType === "ELEMENT_SHEET";

  const isCharacter =
    media.type === "character" ||
    Boolean(media.is_character) ||
    Boolean(media.characterId) ||
    Boolean(media.character) ||
    rawWorkflowType === "CHARACTER" ||
    rawWorkflowType === "CHARACTER_SHEET";

  const isVideo = Boolean(
    media.is_video ||
      media.type === "video" ||
      media.url?.toLowerCase().endsWith(".mp4") ||
      media.url?.toLowerCase().endsWith(".webm") ||
      media.file_url?.toLowerCase().endsWith(".mp4")
  );

  const resolvedType = isCharacter
    ? "character"
    : isElement
    ? "element"
    : isVideo
    ? "video"
    : "image";

  let url =
    media.url ||
    media.preview ||
    media.file_url ||
    media.src ||
    media.image?.url ||
    media.video?.url ||
    "";

  if (!url && isCharacter) {
    const sheetItem =
      (media.items || []).find(
        (i) => (i.step_id === "character_sheet" || i.stepId === "character_sheet") && Boolean(i.url || i.file_url)
      ) ||
      (media.items || []).find((i) => i.step_id !== "character_detail" && Boolean(i.url || i.file_url)) ||
      media.items?.[0];
    url = sheetItem?.url || sheetItem?.file_url || "";
  } else if (!url && isElement) {
    const elemItem =
      (media.items || []).find((i) => Boolean(i.url || i.file_url)) || media.items?.[0];
    url = elemItem?.url || elemItem?.file_url || "";
  }

  const displayName =
    media.displayName ||
    media.display_name ||
    media.name ||
    media.title ||
    media.character?.name ||
    media.element?.name ||
    (isCharacter ? "Character" : isElement ? "Element" : "Reference");

  return {
    workflow_id: workflowId,
    id: workflowId,
    asset_id: workflowId,
    url,
    preview: url,
    displayName,
    type: resolvedType,
    workflow_type:
      media.workflow_type ||
      (isCharacter ? "CHARACTER_SHEET" : isElement ? "ELEMENT_SHEET" : undefined),
    image_count: media.image_count || (Array.isArray(media.items) ? media.items.length : 1),
    role: defaultRole,
  };
}

/**
 * Adds a media asset to the Prompt Bar according to the current active mode,
 * sub-mode, and model configuration.
 *
 * @param {object} options
 * @param {object} [options.store] - PromptBar store instance (defaults to getActivePromptBarStore())
 * @param {object} options.media - Media item to add
 * @param {object} [options.featureConfig] - Feature config (e.g. generatedMediaConfig)
 * @returns {boolean} Whether the item was successfully assigned
 */
export function addMediaToPrompt({
  store = getActivePromptBarStore(),
  media,
  featureConfig = null,
} = {}) {
  if (!store || !media) return false;

  const state = store.getState();
  const {
    activeMode = "image",
    activeSubMode = "frames",
    selectedModelId,
    modelsMap = {},
    parameterValues = {},
    setParameter,
    selectModel,
    addElement,
    addCharacter,
  } = state;

  const asset = normalizeMediaAsset(media);
  if (!asset || !asset.url) return false;

  const isEntity = asset.type === "character" || asset.type === "element";
  const requiredCount = getEntityImageCount(asset);

  // If character or element, ensure prompt bar is in Image mode
  let effectiveMode = activeMode;
  if (isEntity && activeMode !== "image") {
    if (state.setActiveMode) {
      state.setActiveMode("image");
    }
    effectiveMode = "image";
  }

  let currentModel = selectedModelId ? modelsMap[selectedModelId] : null;
  const currentCap = getModelReferenceCapability(currentModel);

  // If adding character/element entity, ensure model has enough capacity (maxRefs >= requiredCount).
  // If current model does not fit all images or is not image domain, switch to the model with max capacity.
  if (isEntity) {
    if (!currentCap.supports || (currentCap.maxRefs || 0) < requiredCount || currentModel?.domain !== "image") {
      const allModels = Object.values(modelsMap);
      const bestModel = findBestModelForEntity(asset, allModels);
      if (bestModel) {
        selectModel(bestModel.id);
        currentModel = bestModel;
      }
    }
  }

  // 1. Resolve composition slots for current mode and subMode
  const req = featureConfig?.COMPOSITION_REQUIREMENTS?.[effectiveMode];
  let slots = [];
  if (Array.isArray(req)) {
    slots = req;
  } else if (req && typeof req === "object") {
    slots = req[activeSubMode] || [];
  }

  // 2. Ensure model eligibility if slots require media inputs but model has none
  const needsMedia = slots.some((s) => s.role === "reference" || s.role === "start");
  if (needsMedia && currentModel) {
    const hasMediaSupport =
      currentModel.parameters?.input_image ||
      currentModel.parameters?.images ||
      currentModel.parameters?.reference_images;

    if (!hasMediaSupport && featureConfig?.filterEligibleModels) {
      const allModels = Object.values(modelsMap);
      const eligible = featureConfig.filterEligibleModels(allModels, effectiveMode, activeSubMode, {
        input_image: true,
      });
      if (eligible.length > 0) {
        selectModel(eligible[0].id);
        currentModel = eligible[0];
      }
    }
  }

  // Register entity if Character or Element
  if (asset.type === "character" && addCharacter) {
    addCharacter(asset);
  } else if (asset.type === "element" && addElement) {
    addElement(asset);
  }

  // 3. Case A: Active composition has "reference" slot
  const refSlot = slots.find((s) => s.role === "reference");
  if (refSlot) {
    const backendKey = featureConfig?.resolveParameterMapping
      ? featureConfig.resolveParameterMapping(currentModel, "reference")
      : "images";
    const targetKey = backendKey || "images";

    const currentVal = parameterValues[targetKey];
    if (targetKey === "images" || targetKey === "reference_images") {
      const list = Array.isArray(currentVal) ? [...currentVal] : currentVal ? [currentVal] : [];
      const alreadyHas = list.some(
        (i) => (i.workflow_id || i.id) === (asset.workflow_id || asset.id)
      );
      if (!alreadyHas) {
        list.push(asset);
        setParameter(targetKey, list);
        return true;
      }
      return false; // already added
    } else {
      // Single image parameter (e.g. input_image in image mode)
      setParameter(targetKey, asset);
      return true;
    }
  }

  // 4. Case B: Active composition has "start" / "end" frame slots (Video Frames)
  const startSlot = slots.find((s) => s.role === "start");
  const endSlot = slots.find((s) => s.role === "end");

  if (startSlot || endSlot) {
    const startKey = featureConfig?.resolveParameterMapping
      ? featureConfig.resolveParameterMapping(currentModel, "start") || "input_image"
      : "input_image";
    const endKey = featureConfig?.resolveParameterMapping
      ? featureConfig.resolveParameterMapping(currentModel, "end") || "last_frame"
      : "last_frame";

    const currentStart = startKey ? parameterValues[startKey] : null;
    const currentEnd = endKey ? parameterValues[endKey] : null;

    if (!currentStart && startKey) {
      setParameter(startKey, asset);
      return true;
    } else if (currentStart && !currentEnd && endKey && currentModel?.parameters?.[endKey]) {
      setParameter(endKey, asset);
      return true;
    } else if (startKey) {
      // Overwrite start frame
      setParameter(startKey, asset);
      return true;
    }
  }

  // 5. Case C: Fallback to autoAssignReference
  return Boolean(
    autoAssignReference({
      asset,
      activeSlots: slots,
      paramValues: parameterValues,
      featureConfig,
      currentModel,
      setParameter,
    }).assigned
  );
}

/**
 * Animates a media asset:
 * - Switches activeMode to "video" and activeSubMode to "frames".
 * - Wipes existing media references (images, reference_images, elements, characters, tags).
 * - Ensures an eligible video model that supports input_image is selected.
 * - Sets the media into the Start Frame (input_image) parameter.
 * - Clears End Frame (last_frame).
 *
 * @param {object} options
 * @param {object} [options.store] - PromptBar store instance (defaults to getActivePromptBarStore())
 * @param {object} options.media - Media item to animate
 * @param {object} [options.featureConfig] - Feature config (e.g. generatedMediaConfig)
 * @returns {boolean}
 */
export function animateMedia({
  store = getActivePromptBarStore(),
  media,
  featureConfig = null,
} = {}) {
  if (!store || !media) return false;

  const state = store.getState();
  const {
    modelsMap = {},
    selectedModelId,
    parameterValues = {},
    selectModel,
    setActiveMode,
    setActiveSubMode,
    setParameter,
    clearMediaReferences,
    setPrompt,
    prompt = "",
  } = state;

  const asset = normalizeMediaAsset(media, "start");
  if (!asset || !asset.url) return false;

  // 1. Transition PromptBar mode to Video Frames
  if (setActiveMode) {
    setActiveMode("video");
  }
  if (setActiveSubMode) {
    setActiveSubMode("frames");
  }

  // 2. Wipe media references
  if (clearMediaReferences) {
    clearMediaReferences();
  } else {
    const nextValues = { ...parameterValues };
    const allOld = [
      ...(Array.isArray(parameterValues.images)
        ? parameterValues.images
        : parameterValues.images
        ? [parameterValues.images]
        : []),
      ...(Array.isArray(parameterValues.reference_images)
        ? parameterValues.reference_images
        : parameterValues.reference_images
        ? [parameterValues.reference_images]
        : []),
      ...(state.elements || []),
      ...(state.characters || []),
    ];
    delete nextValues.images;
    delete nextValues.reference_images;
    const ids = allOld.flatMap((i) => [getAssetId(i), i?.workflow_id, i?.id]).filter(Boolean);
    const cleanedPrompt = ids.length > 0 ? cleanTagsForAsset(prompt, ids) : prompt;
    if (setPrompt && cleanedPrompt !== prompt) {
      setPrompt(cleanedPrompt);
    }
    setParameter("images", undefined);
    setParameter("reference_images", undefined);
  }

  // 3. Ensure eligible video model
  const currentModel = selectedModelId ? modelsMap[selectedModelId] : null;
  const isEligible =
    currentModel &&
    currentModel.domain === "video" &&
    Boolean(currentModel.parameters?.input_image);

  let targetModel = currentModel;
  if (!isEligible) {
    const allModels = Object.values(modelsMap);
    const eligibleVideoModels = featureConfig?.filterEligibleModels
      ? featureConfig.filterEligibleModels(allModels, "video", "frames", {})
      : allModels.filter((m) => m.domain === "video" && Boolean(m.parameters?.input_image));

    if (eligibleVideoModels.length > 0) {
      targetModel = eligibleVideoModels[0];
      selectModel(targetModel.id);
    }
  }

  // 4. Resolve start & end keys
  const startKey = featureConfig?.resolveParameterMapping
    ? featureConfig.resolveParameterMapping(targetModel, "start") || "input_image"
    : "input_image";
  const endKey = featureConfig?.resolveParameterMapping
    ? featureConfig.resolveParameterMapping(targetModel, "end") || "last_frame"
    : "last_frame";

  // 5. Set start frame, clear end frame
  setParameter(startKey, asset);
  if (endKey) {
    setParameter(endKey, undefined);
  }

  return true;
}
