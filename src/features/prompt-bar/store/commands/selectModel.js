/**
 * Prompt Bar Platform — selectModel Command
 *
 * Pure command executing atomic model selection and reference trimming per PB-D-03 / PB-K3.
 * Zero React, zero DOM, zero store mutation.
 */

import { ok } from "../../core/commandResult.js";
import { reconcile } from "../../core/reconciliation.js";
import { pruneMedia } from "../../core/media.js";
import { cleanTagsForAsset, getAssetId } from "../../core/tagsService.js";
import { getModelReferenceCapability } from "../../core/modelManagement.js";

/**
 * Pure selectModel command.
 *
 * @param {object} state - Current Zustand store state
 * @param {string|object} modelIdOrArgs - Target modelId or { modelId }
 * @param {object} [deps]
 * @returns {CommandResult}
 */
export function selectModel(state, modelIdOrArgs, deps = {}) {
  const modelId =
    typeof modelIdOrArgs === "object" && modelIdOrArgs !== null
      ? modelIdOrArgs.modelId
      : modelIdOrArgs;

  if (modelId === null) {
    if (state.selectedModelId === null) return ok({});
    return ok({ selectedModelId: null, parameterValues: {}, reconciliationLog: [] });
  }

  const modelsMap = state.modelsMap || deps.modelsMap || {};
  if (!modelsMap[modelId] || modelId === state.selectedModelId) {
    return ok({});
  }

  const prevModel = modelsMap[state.selectedModelId] || null;
  const nextModel = modelsMap[modelId];
  const prevDefs = prevModel?.parameters || {};
  const nextDefs = nextModel?.parameters || {};

  // 1. Reconcile parameters against nextModel definitions
  const { nextValues, changes } = reconcile(state.parameterValues || {}, prevDefs, nextDefs);

  // 2. Prune/trim media parameters using pruneMedia with reason: "model-change" per PB-D-03
  const pruned = pruneMedia({
    parameterValues: nextValues,
    prevModel,
    nextModel,
    reason: "model-change",
  });

  const nextCap = getModelReferenceCapability(nextModel);
  const targetKey = nextCap?.backendKey || "images";

  // For single-reference models (max === 1), if the parameter was an array with 1 item,
  // convert to single item object for backward compatibility with SAFE-3 / legacy callers
  if (
    nextCap?.maxRefs === 1 &&
    Array.isArray(pruned.parameterValues[targetKey]) &&
    pruned.parameterValues[targetKey].length === 1
  ) {
    pruned.parameterValues[targetKey] = pruned.parameterValues[targetKey][0];
  }

  // 3. Collect removed asset IDs from reconciliation and media trimming
  const idsToClean = new Set();

  changes.forEach((c) => {
    if ((c.action === "removed" || c.action === "reset") && c.previousValue) {
      const vals = Array.isArray(c.previousValue) ? c.previousValue : [c.previousValue];
      vals.forEach((v) => {
        const id = getAssetId(v);
        if (id) idsToClean.add(id);
        if (v?.workflow_id) idsToClean.add(v.workflow_id);
        if (v?.workflowId) idsToClean.add(v.workflowId);
        if (v?.id) idsToClean.add(v.id);
        if (v?.asset_id) idsToClean.add(v.asset_id);
        if (v?.name) idsToClean.add(v.name);
        if (v?.displayName) idsToClean.add(v.displayName);
      });
    }
  });

  (pruned.removed || []).forEach((r) => {
    (r.assetIds || []).forEach((id) => idsToClean.add(id));
  });

  let nextElements = [...(state.elements || [])];
  let nextCharacters = [...(state.characters || [])];

  if (!nextCap?.supports || nextCap?.maxRefs === 0) {
    delete pruned.parameterValues.images;
    delete pruned.parameterValues.reference_images;

    const oldRefItems = [
      ...(Array.isArray(state.parameterValues?.images)
        ? state.parameterValues.images
        : state.parameterValues?.images
        ? [state.parameterValues.images]
        : []),
      ...(Array.isArray(state.parameterValues?.reference_images)
        ? state.parameterValues.reference_images
        : state.parameterValues?.reference_images
        ? [state.parameterValues.reference_images]
        : []),
      ...nextElements,
      ...nextCharacters,
    ];

    oldRefItems.forEach((v) => {
      const id = getAssetId(v);
      if (id) idsToClean.add(id);
      if (v?.workflow_id) idsToClean.add(v.workflow_id);
      if (v?.workflowId) idsToClean.add(v.workflowId);
      if (v?.id) idsToClean.add(v.id);
      if (v?.asset_id) idsToClean.add(v.asset_id);
      if (v?.name) idsToClean.add(v.name);
      if (v?.displayName) idsToClean.add(v.displayName);
    });

    nextElements = [];
    nextCharacters = [];
  } else if (idsToClean.size > 0) {
    nextElements = nextElements.filter((e) => !idsToClean.has(e.id) && !idsToClean.has(e.workflow_id));
    nextCharacters = nextCharacters.filter((c) => !idsToClean.has(c.id) && !idsToClean.has(c.workflow_id));
  }

  // 4. Clean orphan tags from prompt
  let nextPrompt = state.prompt || "";
  if (idsToClean.size > 0) {
    nextPrompt = cleanTagsForAsset(nextPrompt, Array.from(idsToClean));
  }

  return ok({
    selectedModelId: modelId,
    parameterValues: pruned.parameterValues,
    prompt: nextPrompt,
    elements: nextElements,
    characters: nextCharacters,
    reconciliationLog: changes,
  });
}
