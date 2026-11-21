/**
 * Prompt Bar Platform — switchMode Command
 *
 * Pure command executing atomic mode and subMode transitions per PB-D-03.
 * Uses ONE consistent resolveEligibleModels rule, prunes all media parameters
 * (leaving zero orphan entities), reconciles remaining settings, and cleans prompt tags.
 * Zero React, zero DOM, zero store mutation.
 */

import { ok, fail, REASONS } from "../../core/commandResult.js";
import { reconcile } from "../../core/reconciliation.js";
import { pruneMedia } from "../../core/media.js";
import { resolveEligibleModels } from "../../core/modelManagement.js";
import { cleanTagsForAsset } from "../../core/tagsService.js";
import { isMediaType } from "../../core/parameterKeys.js";

/**
 * Pure switchMode command.
 *
 * @param {object} state - Current Zustand store state
 * @param {object} args - { mode, subMode }
 * @param {string} [args.mode] - Target mode ("image" | "video")
 * @param {string} [args.subMode] - Target subMode ("frames" | "reference")
 * @param {object} [deps] - { template, filterEligibleModels, modelsMap }
 * @returns {import("../../core/commandResult.js").CommandResult}
 */
export function switchMode(state, { mode, subMode } = {}, deps = {}) {
  const targetMode = mode || state.activeMode || "image";
  const targetSubMode = subMode || (targetMode === "video" ? (state.activeSubMode || "frames") : "frames");

  const template = deps.template || state.template;
  const modelsMap = state.modelsMap || deps.modelsMap || {};
  const allModelsList = Object.values(modelsMap);

  const effectiveTemplate =
    template ||
    (typeof deps.filterEligibleModels === "function"
      ? { filterEligibleModels: deps.filterEligibleModels }
      : null);

  let nextModelId = state.selectedModelId;
  let nextModel = modelsMap[nextModelId] || null;

  const hasEligibilityFilter =
    typeof effectiveTemplate?.filterEligibleModels === "function" ||
    typeof effectiveTemplate?.getEligibleModels === "function";

  if (hasEligibilityFilter && allModelsList.length > 0) {
    const eligible = resolveEligibleModels(allModelsList, {
      template: effectiveTemplate,
      activeMode: targetMode,
      activeSubMode: targetSubMode,
    });
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
    if (isMediaType(def.type) || def.group === "media") {
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
