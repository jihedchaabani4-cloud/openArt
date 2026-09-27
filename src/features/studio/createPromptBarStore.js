/**
 * Prompt Bar Platform — Store Factory
 *
 * Creates a new isolated Zustand vanilla store per PromptBar mount.
 * Uses createStore() (not create()) so each instance is independent.
 *
 * Per-instance isolation: createStore() returns a new store instance every call — not a singleton.
 * US1: Multiple instances share the Core engine code but have zero shared state.
 * US3: Unmounting a PromptBar garbage-collects this store; no residual state.
 */

import { createStore } from "zustand/vanilla";
import { reconcile } from "./core/reconciliation.js";
import { serialize } from "./core/serialization.js";
import { initializeValues } from "./core/parameterState.js";
import {
  addEntity,
  removeEntity,
  normalizeEntity,
  removeEntityWithPromptClean,
  getEntityImageCount,
} from "./core/entityService.js";
import { getModelReferenceCapability } from "./core/modelManagement.js";
import { cleanTagsForAsset, getAssetId } from "./core/tagsService.js";

/**
 * Creates a new isolated PromptBar Zustand vanilla store.
 *
 * @param {Partial<PromptBarInstanceState>} overrides - Optional initial state overrides
 * @returns {ZustandVanillaStore}
 */
export function createPromptBarStore(overrides = {}) {
  return createStore((set, get) => ({
    // ── State ──────────────────────────────────────────────────────────────
    modelsMap: {},
    rawModelsMap: {},
    selectedModelId: null,
    prompt: "",
    parameterValues: {},
    elements: [],
    characters: [],
    reconciliationLog: [],
    validationErrors: {},
    isGenerating: false,
    lastSerializedRequest: null,
    activeMode: overrides.activeMode || "image",
    activeSubMode: overrides.activeSubMode || "frames",
    ...overrides,

    // ── Actions ────────────────────────────────────────────────────────────

    /**
     * Replace the available model catalog and reconcile state.
     * If selectedModelId is no longer valid, selects the first available model.
     *
     * @param {object[]} models - Array of ModelContract objects
     * @param {Record<string, object>} rawModelsMap - Raw backend models map (for inspector)
     */
    setModels: (models, rawModelsMap = {}) => {
      const nextModelsMap = {};
      const rawList = Array.isArray(models) ? models : [];
      for (const m of rawList) {
        nextModelsMap[m.id] = m;
      }

      const { selectedModelId, parameterValues, modelsMap } = get();
      let nextModelId = selectedModelId;

      if (!nextModelId || !nextModelsMap[nextModelId]) {
        nextModelId = rawList[0]?.id || null;
      }

      let nextValues = parameterValues;
      let reconciliationLog = [];

      if (nextModelId) {
        const prevDefs = selectedModelId ? (modelsMap[selectedModelId]?.parameters || {}) : {};
        const nextDefs = nextModelsMap[nextModelId]?.parameters || {};
        const result = reconcile(parameterValues, prevDefs, nextDefs);
        nextValues = result.nextValues;
        reconciliationLog = result.changes;
      }

      set({ modelsMap: nextModelsMap, rawModelsMap, selectedModelId: nextModelId, parameterValues: nextValues, reconciliationLog });
    },

    /**
     * Switch the active model and auto-reconcile parameter state.
     * @param {string} modelId
     */
    selectModel: (modelId) => {
      const { modelsMap, parameterValues, selectedModelId, prompt, elements = [], characters = [] } = get();
      if (modelId === null) {
        if (selectedModelId === null) return;
        set({ selectedModelId: null, parameterValues: {}, reconciliationLog: [] });
        return;
      }
      if (!modelsMap[modelId] || modelId === selectedModelId) return;

      const prevModel = modelsMap[selectedModelId];
      const nextModel = modelsMap[modelId];
      const prevDefs = prevModel?.parameters || {};
      const nextDefs = nextModel?.parameters || {};
      const { nextValues, changes } = reconcile(parameterValues, prevDefs, nextDefs);

      let currentPrompt = prompt || "";
      let nextElements = [...elements];
      let nextCharacters = [...characters];

      const nextCap = getModelReferenceCapability(nextModel);
      const targetKey = nextCap?.backendKey || "images";
      const idsToClean = new Set();

      // 1. Collect IDs from parameters removed or reset during reconciliation
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

      // 2. Reference capability enforcement (trim or remove references and orphan tags)
      if (!nextCap.supports || nextCap.maxRefs === 0) {
        delete nextValues.images;
        delete nextValues.reference_images;

        const oldRefItems = [
          ...(Array.isArray(parameterValues.images) ? parameterValues.images : parameterValues.images ? [parameterValues.images] : []),
          ...(Array.isArray(parameterValues.reference_images) ? parameterValues.reference_images : parameterValues.reference_images ? [parameterValues.reference_images] : []),
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
      } else {
        const rawVal = nextValues[targetKey] || (targetKey === "images" ? nextValues.reference_images : nextValues.images);
        const currentArr = Array.isArray(rawVal) ? rawVal : (rawVal ? [rawVal] : []);

        let runningUsed = 0;
        const kept = [];
        const removed = [];

        for (const item of currentArr) {
          const count = getEntityImageCount(item);
          if (runningUsed + count <= nextCap.maxRefs) {
            kept.push(item);
            runningUsed += count;
          } else {
            removed.push(item);
          }
        }

        if (removed.length > 0) {
          nextValues[targetKey] = nextCap.maxRefs === 1 ? kept[0] : (kept.length > 0 ? kept : undefined);

          removed.forEach((v) => {
            const id = getAssetId(v);
            if (id) idsToClean.add(id);
            if (v?.workflow_id) idsToClean.add(v.workflow_id);
            if (v?.workflowId) idsToClean.add(v.workflowId);
            if (v?.id) idsToClean.add(v.id);
            if (v?.asset_id) idsToClean.add(v.asset_id);
            if (v?.name) idsToClean.add(v.name);
            if (v?.displayName) idsToClean.add(v.displayName);
          });

          nextElements = nextElements.filter((e) => !idsToClean.has(e.id) && !idsToClean.has(e.workflow_id));
          nextCharacters = nextCharacters.filter((c) => !idsToClean.has(c.id) && !idsToClean.has(c.workflow_id));
        }
      }

      // 3. Clean orphan tags from prompt text directly
      if (idsToClean.size > 0) {
        currentPrompt = cleanTagsForAsset(currentPrompt, Array.from(idsToClean));
      }

      set({
        selectedModelId: modelId,
        parameterValues: nextValues,
        prompt: currentPrompt,
        elements: nextElements,
        characters: nextCharacters,
        reconciliationLog: changes,
      });
    },

    /** Update prompt text. */
    setPrompt: (prompt) => set({ prompt }),

    /** Update a single parameter value. */
    setParameter: (key, value) =>
      set((state) => ({ parameterValues: { ...state.parameterValues, [key]: value } })),

    /** Update generation loading state without touching prompt or parameterValues (FR-CORE-07). */
    setIsGenerating: (isGenerating) => set({ isGenerating }),

    /** Feature-level Entities (Elements & Characters) */
    addElement: (element) =>
      set((state) => ({ elements: addEntity(state.elements, element, "element") })),

    removeElement: (elementId) =>
      set((state) => {
        const { nextList, nextPrompt } = removeEntityWithPromptClean(state.elements, elementId, state.prompt);
        return { elements: nextList, prompt: nextPrompt };
      }),

    setElements: (elements) =>
      set(() => ({
        elements: (elements || []).map((e) => normalizeEntity(e, "element")).filter(Boolean),
      })),

    addCharacter: (character) =>
      set((state) => ({ characters: addEntity(state.characters, character, "character") })),

    removeCharacter: (characterId) =>
      set((state) => {
        const { nextList, nextPrompt } = removeEntityWithPromptClean(state.characters, characterId, state.prompt);
        return { characters: nextList, prompt: nextPrompt };
      }),

    setCharacters: (characters) =>
      set(() => ({
        characters: (characters || []).map((c) => normalizeEntity(c, "character")).filter(Boolean),
      })),

    clearEntities: () => set({ elements: [], characters: [] }),

    /** Active Mode & SubMode actions */
    setActiveMode: (activeMode) => set({ activeMode }),
    setActiveSubMode: (activeSubMode) => set({ activeSubMode }),

    /** Clears media references (images, reference_images, elements, characters) and cleans prompt tags */
    clearMediaReferences: () => {
      const { prompt, elements, characters, parameterValues } = get();
      const allOldItems = [
        ...(Array.isArray(parameterValues.images) ? parameterValues.images : parameterValues.images ? [parameterValues.images] : []),
        ...(Array.isArray(parameterValues.reference_images) ? parameterValues.reference_images : parameterValues.reference_images ? [parameterValues.reference_images] : []),
        ...(elements || []),
        ...(characters || []),
      ];

      const idsToClean = allOldItems.flatMap((item) => [
        getAssetId(item),
        item?.workflow_id,
        item?.id,
        item?.asset_id,
        item?.name,
        item?.displayName,
      ]).filter(Boolean);

      const nextValues = { ...parameterValues };
      delete nextValues.images;
      delete nextValues.reference_images;

      const nextPrompt = idsToClean.length > 0 ? cleanTagsForAsset(prompt, idsToClean) : prompt;

      set({
        parameterValues: nextValues,
        elements: [],
        characters: [],
        prompt: nextPrompt,
      });
    },

    /**
     * Serialize current state into the pass-through API payload.
     * FR-CORE-06: null, undefined, empty string values are omitted.
     *
     * @returns {{ model: string, prompt: string, parameters: Record<string, any>, elements?: string[], characters?: string[] }}
     */
    serialize: () => {
      const { selectedModelId, prompt, modelsMap, parameterValues, elements, characters } = get();
      const definitions = modelsMap[selectedModelId]?.parameters || {};
      const result = serialize(selectedModelId, prompt, definitions, parameterValues, {
        elements,
        characters,
      });
      set({ lastSerializedRequest: result });
      return result;
    },

    /** Reset prompt, parameters, and entities to model defaults. */
    reset: () => {
      const { modelsMap, selectedModelId } = get();
      const definitions = modelsMap[selectedModelId]?.parameters || {};
      const parameterValues = initializeValues(definitions);
      set({
        prompt: "",
        parameterValues,
        elements: [],
        characters: [],
        reconciliationLog: [],
        validationErrors: {},
        lastSerializedRequest: null,
      });
    },
  }));
}
