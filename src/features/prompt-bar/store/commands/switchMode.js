/**
 * Prompt Bar Platform — switchMode Command
 *
 * Pure command executing atomic mode and subMode transitions per PB-D-03.
 * Zero React, zero DOM, zero store mutation.
 */

import { ok, fail, REASONS } from "../../core/commandResult.js";
import { reconcile } from "../../core/reconciliation.js";
import { pruneMedia } from "../../core/media.js";
import { cleanTagsForAsset } from "../../core/tagsService.js";
import { isMediaType } from "../../core/parameterKeys.js";

/**
 * Pure switchMode command.
 *
 * @param {object} state - Current Zustand store state
 * @param {object} args - { mode, subMode }
 * @param {string} [args.mode] - Target mode ("image" | "video")
 * @param {string} [args.subMode] - Target subMode ("frames" | "reference")
 * @param {object} [deps] - { template, filterEligibleModels, models }
 * @returns {CommandResult}
 */
export function switchMode(state, { mode, subMode } = {}, deps = {}) {
  const targetMode = mode || state.activeMode || "image";
  const targetSubMode = subMode || (targetMode === "video" ? (state.activeSubMode || "frames") : "frames");

  const template = deps.template || state.template;
  const modelsMap = state.modelsMap || deps.modelsMap || {};
  const allModelsList = Object.values(modelsMap);

  const filterEligible =
    template?.filterEligibleModels ||
    deps.filterEligibleModels ||
    (typeof template?.getEligibleModels === "function" ? template.getEligibleModels : null);

  let nextModelId = state.selectedModelId;
  let nextModel = modelsMap[nextModelId] || null;

  if (typeof filterEligible === "function" && allModelsList.length > 0) {
    const eligible = filterEligible(allModelsList, targetMode, targetSubMode, state.parameterValues || {});
    if (!eligible || eligible.length === 0) {
      return fail(REASONS.NO_ELIGIBLE_MODEL, { mode: targetMode, subMode: targetSubMode });
    }

    const currentIsEligible = eligible.some((m) => m.id === state.selectedModelId);
    if (!currentIsEligible) {
      nextModelId = eligible[0].id;
      nextModel = modelsMap[nextModelId] || eligible[0];
    }
  }

  const prevModel = modelsMap[state.selectedModelId] || null;
  const currentValues = state.parameterValues || {};

  // 1. Prune media parameters with reason: "mode-change" per PB-D-03
  const pruned = pruneMedia({
    parameterValues: currentValues,
    prevModel,
    nextModel,
    reason: "mode-change",
  });

  // 2. Reconcile remaining parameters against nextModel
  const prevDef = prevModel?.parameters || {};
  const nextDef = nextModel?.parameters || {};
  const { nextValues, changes: recLog } = reconcile(pruned.parameterValues, prevDef, nextDef);

  // PB-D-03: On mode-change, ensure media parameters are not populated with defaults
  for (const [key, def] of Object.entries(nextDef)) {
    if (isMediaType(def.type)) {
      delete nextValues[key];
    }
  }

  // 3. Clean tags of removed media assets from prompt text
  let nextPrompt = state.prompt || "";
  const removedAssetIds = (pruned.removed || []).flatMap((r) => r.assetIds).filter(Boolean);
  if (removedAssetIds.length > 0) {
    nextPrompt = cleanTagsForAsset(nextPrompt, removedAssetIds);
  }

  return ok({
    activeMode: targetMode,
    activeSubMode: targetSubMode,
    selectedModelId: nextModelId,
    parameterValues: nextValues,
    prompt: nextPrompt,
    reconciliationLog: recLog,
  });
}
