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
import { promptBarService } from "@/features/prompt-bar/api/promptBarService.js";
import { getEntityImageCount } from "./entityService.js";
import { getModelReferenceCapability } from "./modelManagement.js";
import * as defaultGeneratedMediaConfig from "@/features/prompt-bar/features/generated-media/generatedMedia.config.js";
import { enqueuePendingAction } from "@/features/prompt-bar/store/pendingActions.js";

const PENDING_STORAGE_KEY = "openart_pending_prompt_action";

/**
 * Stores a pending prompt bar action across page navigations.
 * @param {object} action
 */
export function setPendingPromptAction(action) {
  try {
    enqueuePendingAction(
      { templateId: "generated-media", projectId: action?.projectId || "global" },
      { actionName: action?.type || "action", args: [action], payload: action }
    );
  } catch (e) {
    // Ignore queue failure in legacy bridge
  }

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
 * @param {object} [options.store] - PromptBar store instance (optional, defaults to promptBarService)
 * @param {object} options.media - Media item to add
 * @param {object} [options.featureConfig] - Feature config (e.g. generatedMediaConfig)
 * @returns {boolean} Whether the item was successfully assigned
 */
export function addMediaToPrompt({
  store,
  media,
  featureConfig = defaultGeneratedMediaConfig,
  projectId,
} = {}) {
  if (!media) return false;
  if (store && typeof store.getState === "function") {
    const s = store.getState();
    if (typeof s.addReference === "function") {
      const res = s.addReference(media);
      return res?.ok !== false;
    }
  }

  const targetProjectId = projectId || store?.getState?.()?.identity?.projectId || "global";
  const service = promptBarService({
    templateId: "generated-media",
    projectId: targetProjectId,
  });
  const res = service.addReference(media);
  return Boolean(res.ok);
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
 * @param {object} [options.store] - PromptBar store instance (optional, defaults to promptBarService)
 * @param {object} options.media - Media item to animate
 * @param {object} [options.featureConfig] - Feature config (e.g. generatedMediaConfig)
 * @returns {boolean}
 */
export function animateMedia({
  store,
  media,
  featureConfig = defaultGeneratedMediaConfig,
  projectId,
} = {}) {
  if (!media) return false;
  if (store && typeof store.getState === "function") {
    const s = store.getState();
    if (typeof s.animateMedia === "function") {
      const res = s.animateMedia(media);
      return res?.ok !== false;
    }
  }

  const targetProjectId = projectId || store?.getState?.()?.identity?.projectId || "global";
  const service = promptBarService({
    templateId: "generated-media",
    projectId: targetProjectId,
  });
  const res = service.animateMedia(media);
  return Boolean(res.ok);
}
