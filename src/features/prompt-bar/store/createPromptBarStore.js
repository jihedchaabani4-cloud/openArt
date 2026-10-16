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
import { reconcile } from "../core/reconciliation.js";
import { serialize } from "../core/serialization.js";
import { initializeValues } from "../core/parameterState.js";
import {
  addEntity,
  normalizeEntity,
  removeEntityWithPromptClean,
} from "../core/entityService.js";
import { cleanTagsForAsset, getAssetId } from "../core/tagsService.js";
import { registry } from "./registry.js";
import { switchMode as switchModeCommand } from "./commands/switchMode.js";
import { selectModel as selectModelCommand } from "./commands/selectModel.js";
import { attachMedia as attachMediaCommand } from "./commands/attachMedia.js";
import { removeMedia as removeMediaCommand } from "./commands/removeMedia.js";

/**
 * Creates a new isolated PromptBar Zustand vanilla store.
 *
 * @param {Partial<PromptBarInstanceState>} overrides - Optional initial state overrides
 * @param {object} [initialDeps={}] - Store dependencies (template, models)
 * @returns {ZustandVanillaStore}
 */
export function createPromptBarStore(overrides = {}, initialDeps = {}) {
  const deps = { ...initialDeps };
  if (overrides.template && !deps.template) {
    deps.template = overrides.template;
  }
  const effectiveTemplate = overrides.template || deps.template || null;
  const initialParams = overrides.parameterValues || (effectiveTemplate?.parameters ? initializeValues(effectiveTemplate.parameters) : {});
  let cachedTemplate = null;
  let cachedActions = null;
  let storeGet = null;
  let storeSet = null;

  function getOrComputeActions() {
    const tmpl = (storeGet ? storeGet().template : null) || deps.template;
    if (tmpl === cachedTemplate && cachedActions !== null) {
      return cachedActions;
    }
    cachedTemplate = tmpl;
    if (tmpl && typeof tmpl.createActions === "function" && storeGet && storeSet) {
      cachedActions = tmpl.createActions({
        getState: storeGet,
        setState: storeSet,
        store: { getState: storeGet, setState: storeSet },
        switchMode: (mode, subMode) => storeGet().switchMode(mode, subMode),
        selectModel: (modelId) => storeGet().selectModel(modelId),
        attachMedia: (args) => storeGet().attachMedia(args),
        removeMedia: (args) => storeGet().removeMedia(args),
        setPrompt: (text) => storeGet().setPrompt(text),
        setParametersBatch: (params) => storeGet().setParametersBatch(params),
      });
    } else {
      cachedActions = {};
    }
    return cachedActions;
  }

  const store = createStore((set, get) => {
    storeGet = get;
    storeSet = set;

    return {
    // ── State ──────────────────────────────────────────────────────────────
    modelsMap: {},
    rawModelsMap: {},
    selectedModelId: null,
    prompt: "",
    parameterValues: initialParams,
    elements: [],
    characters: [],
    reconciliationLog: [],
    validationErrors: {},
    isGenerating: false,
    lastSerializedRequest: null,
    activeMode: overrides.activeMode || "image",
    activeSubMode: overrides.activeSubMode || "frames",
    pendingHydration: overrides.pendingHydration || null,
    identity: overrides.identity || null,
    template: overrides.template || deps.template || null,
    focusRequest: overrides.focusRequest || 0,
    ...overrides,

    // ── Actions ────────────────────────────────────────────────────────────

    /**
     * Hydrates persisted state after mount.
     * If modelsMap is empty, stores as pendingHydration for setModels to consume.
     * @param {object} saved
     */
    hydrate: (saved) => {
      if (!saved || typeof saved !== "object") return;
      const { modelsMap, selectedModelId, parameterValues } = get();
      const hasModels = Object.keys(modelsMap).length > 0;

      if (!hasModels) {
        set({
          prompt: saved.prompt !== undefined ? saved.prompt : get().prompt,
          elements: Array.isArray(saved.elements) ? saved.elements : get().elements,
          characters: Array.isArray(saved.characters) ? saved.characters : get().characters,
          activeMode: saved.activeMode || get().activeMode,
          activeSubMode: saved.activeSubMode || get().activeSubMode,
          selectedModelId: saved.selectedModelId || selectedModelId,
          parameterValues: {
            ...parameterValues,
            ...(saved.parameterValues || {}),
          },
          pendingHydration: saved,
        });
        return;
      }

      let targetModelId = selectedModelId;
      if (saved.selectedModelId && modelsMap[saved.selectedModelId]) {
        targetModelId = saved.selectedModelId;
      }

      const targetDefs = modelsMap[targetModelId]?.parameters || {};
      const currentDefs = selectedModelId ? (modelsMap[selectedModelId]?.parameters || {}) : {};
      const savedParams = {
        ...parameterValues,
        ...(saved.parameterValues || {}),
      };

      const { nextValues, changes } = reconcile(savedParams, currentDefs, targetDefs);

      set({
        prompt: saved.prompt !== undefined ? saved.prompt : get().prompt,
        selectedModelId: targetModelId,
        parameterValues: {
          ...savedParams,
          ...nextValues,
        },
        elements: Array.isArray(saved.elements) ? saved.elements : get().elements,
        characters: Array.isArray(saved.characters) ? saved.characters : get().characters,
        activeMode: saved.activeMode || get().activeMode,
        activeSubMode: saved.activeSubMode || get().activeSubMode,
        reconciliationLog: changes,
        pendingHydration: null,
      });
    },

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

      const { selectedModelId, parameterValues, modelsMap, pendingHydration } = get();
      let nextModelId = selectedModelId;

      if (pendingHydration?.selectedModelId && nextModelsMap[pendingHydration.selectedModelId]) {
        nextModelId = pendingHydration.selectedModelId;
      } else if (!nextModelId || !nextModelsMap[nextModelId]) {
        nextModelId = rawList[0]?.id || null;
      }

      const sourceParams = pendingHydration?.parameterValues
        ? { ...parameterValues, ...pendingHydration.parameterValues }
        : parameterValues;

      let nextValues = sourceParams;
      let reconciliationLog = [];

      if (nextModelId && nextModelId !== selectedModelId) {
        const prevDefs = selectedModelId ? (modelsMap[selectedModelId]?.parameters || {}) : {};
        const nextDefs = nextModelsMap[nextModelId]?.parameters || {};
        const result = reconcile(sourceParams, prevDefs, nextDefs);
        nextValues = {
          ...sourceParams,
          ...result.nextValues,
        };
        reconciliationLog = result.changes;
      } else if (nextModelId && !selectedModelId) {
        const nextDefs = nextModelsMap[nextModelId]?.parameters || {};
        const result = reconcile(sourceParams, {}, nextDefs);
        nextValues = {
          ...sourceParams,
          ...result.nextValues,
        };
        reconciliationLog = result.changes;
      } else {
        nextValues = sourceParams;
      }

      set({
        modelsMap: nextModelsMap,
        rawModelsMap,
        selectedModelId: nextModelId,
        parameterValues: nextValues,
        reconciliationLog,
        pendingHydration: null,
      });
    },

    /**
     * Switch the active model and auto-reconcile parameter state.
     * @param {string} modelId
     */
    selectModel: (modelId) => {
      const res = selectModelCommand(get(), modelId, deps);
      if (res.ok && res.patch) {
        set(res.patch);
      }
    },

    /** Update prompt text. */
    setPrompt: (prompt) => set({ prompt }),

    /** Update a single parameter value. */
    setParameter: (key, value) =>
      set((state) => ({ parameterValues: { ...state.parameterValues, [key]: value } })),

    /** Update generation loading state without touching prompt or parameterValues (FR-CORE-07). */
    setIsGenerating: (isGenerating) => set({ isGenerating: Boolean(isGenerating) }),

    /**
     * Begins submit lifecycle tracking.
     * Sets isGenerating true and registers with external registry tracking.
     * @returns {string|null} token
     */
    beginSubmit: () => {
      const { identity } = get();
      let token = null;
      if (identity) {
        token = registry.beginSubmit(identity);
      }
      set({ isGenerating: true });
      return token;
    },

    /**
     * Ends submit lifecycle tracking.
     * Validates in-flight token; if token is old or unrecognized, does nothing.
     * Sets isGenerating false when successful.
     * @param {string} [token]
     * @returns {boolean}
     */
    endSubmit: (token) => {
      const { identity } = get();
      if (identity && token) {
        const ended = registry.endSubmit(identity, token);
        if (!ended) return false;
      }
      set({ isGenerating: false });
      return true;
    },

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

    /**
     * Atomically switches mode and subMode per PB-D-03.
     * Selects eligible model, reconciles parameters, prunes media, cleans tags, and sets in a single notification.
     * @param {string|object} modeOrOptions
     * @param {string} [maybeSubMode]
     * @returns {import("../core/commandResult.js").CommandResult}
     */
    switchMode: (modeOrOptions, maybeSubMode) => {
      const args =
        typeof modeOrOptions === "object" && modeOrOptions !== null
          ? modeOrOptions
          : { mode: modeOrOptions, subMode: maybeSubMode };

      const res = switchModeCommand(get(), args, deps);
      if (res.ok && res.patch) {
        set(res.patch);
      }
      return res;
    },

    /** Active Mode & SubMode actions */
    setActiveMode: (activeMode) => set({ activeMode }),
    setActiveSubMode: (activeSubMode) => {
      const state = get();
      if (state.activeSubMode === activeSubMode) return;
      if (typeof state.switchMode === "function") {
        state.switchMode({ subMode: activeSubMode });
      } else {
        set({ activeSubMode });
      }
    },

    /** Deprecated shim (PB-D-23): first template wins; ignored if template was already set. */
    setTemplate: (template) => {
      if (!template) return;
      if (deps.template || get().template) {
        return;
      }
      deps.template = template;
      set({ template });
    },

    /**
     * Attach media to a composition slot per PB-D-03.
     * @param {object} args - { role, value }
     * @returns {import("../core/commandResult.js").CommandResult}
     */
    attachMedia: (args) => {
      const res = attachMediaCommand(get(), args, deps);
      if (res.ok && res.patch) {
        set(res.patch);
      }
      return res;
    },

    /**
     * Remove media from a composition slot or list per PB-D-03.
     * @param {object} args - { role, value }
     * @returns {import("../core/commandResult.js").CommandResult}
     */
    removeMedia: (args) => {
      const res = removeMediaCommand(get(), args, deps);
      if (res.ok && res.patch) {
        set(res.patch);
      }
      return res;
    },

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
      const { selectedModelId, prompt, modelsMap, parameterValues, elements, characters, template } = get();
      const definitions = (selectedModelId ? modelsMap[selectedModelId]?.parameters : null) || template?.parameters || {};
      const result = serialize(selectedModelId, prompt, definitions, parameterValues, {
        elements,
        characters,
      });
      set({ lastSerializedRequest: result });
      return result;
    },

    /** Reset prompt, parameters, and entities to model defaults. */
    reset: () => {
      const { modelsMap, selectedModelId, template } = get();
      const definitions = (selectedModelId ? modelsMap[selectedModelId]?.parameters : null) || template?.parameters || {};
      const parameterValues = initializeValues(definitions);
      set({
        prompt: "",
        parameterValues,
        elements: [],
        characters: [],
        reconciliationLog: [],
        validationErrors: {},
        lastSerializedRequest: null,
        focusRequest: 0,
      });
    },

    /** Requests focus on the prompt editor without DOM query. */
    requestFocus: () => {
      set((state) => ({
        focusRequest: (state.focusRequest || 0) + 1,
      }));
    },

    /**
     * Updates multiple parameter values in batch.
     * @param {Record<string, any>} newParams
     */
    setParametersBatch: (newParams) => {
      set((state) => ({
        parameterValues: {
          ...state.parameterValues,
          ...newParams,
        },
      }));
    },

    _store: { getState: get, setState: set },

    /** Dynamic actions provided by the template */
    get actions() {
      return getOrComputeActions();
    },

    animateMedia: (media, options) => {
      const act = getOrComputeActions();
      return act.animateMedia ? act.animateMedia(media, options) : undefined;
    },

    addReference: (media) => {
      const act = getOrComputeActions();
      return act.addReference ? act.addReference(media) : undefined;
    },

    applyGeneration: (old) => {
      const act = getOrComputeActions();
      return act.applyGeneration ? act.applyGeneration(old) : undefined;
    },
  };
});

  Object.defineProperty(store, "actions", {
    get: getOrComputeActions,
    enumerable: true,
  });

  return store;
}
