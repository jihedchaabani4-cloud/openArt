/**
 * Prompt Bar Platform — Sealed Core Store Factory
 *
 * Creates an isolated Zustand vanilla store per PromptBar mount.
 * Exposes ONLY semantic, invariant-enforcing commands — zero raw setters or escape hatches.
 * Single source of truth: media & entities live ONLY in parameterValues[slotKey].
 */

import { createStore } from "zustand/vanilla";
import { reconcile } from "../core/reconciliation.js";
import { serialize } from "../core/serialization.js";
import { initializeValues } from "../core/parameterState.js";
import { deriveEntitiesFromParameters } from "../core/entityService.js";
import { resolveEligibleModels } from "../core/modelManagement.js";
import { registry } from "./registry.js";
import { drainPendingActions } from "./pendingActions.js";
import { switchMode as switchModeCommand } from "./commands/switchMode.js";
import { selectModel as selectModelCommand } from "./commands/selectModel.js";
import { setSetting as setSettingCommand } from "./commands/setSetting.js";
import { attachMedia as attachMediaCommand } from "./commands/attachMedia.js";
import { removeMedia as removeMediaCommand } from "./commands/removeMedia.js";
import { swapFrames as swapFramesCommand } from "./commands/swapFrames.js";
import { clearDraft as clearDraftCommand } from "./commands/clearDraft.js";

/**
 * Creates a new isolated PromptBar Zustand vanilla store.
 *
 * @param {Partial<PromptBarInstanceState>} [overrides={}] - Optional initial state overrides
 * @param {object} [initialDeps={}] - Store dependencies ({ template, models })
 * @returns {import("zustand/vanilla").StoreApi}
 */
export function createPromptBarStore(overrides = {}, initialDeps = {}) {
  const deps = { ...initialDeps };
  if (overrides.template && !deps.template) {
    deps.template = overrides.template;
  }
  const effectiveTemplate = overrides.template || deps.template || null;
  const initialParams =
    overrides.parameterValues ||
    (effectiveTemplate?.parameters ? initializeValues(effectiveTemplate.parameters) : {});

  // Strip deprecated mutable entity arrays if passed via legacy overrides
  const { elements: _ignoredElements, characters: _ignoredCharacters, ...cleanOverrides } = overrides || {};

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
        setSetting: (key, value) => storeGet().setSetting(key, value),
        attachMedia: (args) => storeGet().attachMedia(args),
        removeMedia: (args) => storeGet().removeMedia(args),
        clearSlot: (role) => storeGet().clearSlot(role),
        swapFrames: () => storeGet().swapFrames(),
        clearDraft: () => storeGet().clearDraft(),
        setPrompt: (text) => storeGet().setPromptExternal(text),
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
      promptFillNonce: 0,
      parameterValues: initialParams,
      reconciliationLog: [],
      validationErrors: {},
      isGenerating: false,
      lastSerializedRequest: null,
      activeMode: cleanOverrides.activeMode || "image",
      activeSubMode: cleanOverrides.activeSubMode || "frames",
      pendingHydration: cleanOverrides.pendingHydration || null,
      identity: cleanOverrides.identity || null,
      template: cleanOverrides.template || deps.template || null,
      focusRequest: cleanOverrides.focusRequest || 0,
      ...cleanOverrides,

      // ── Lifecycle & Catalog Sync ───────────────────────────────────────────

      /**
       * Hydrates persisted state after mount.
       * Applies ONE consistent resolveEligibleModels rule when models are loaded;
       * otherwise stashes pendingHydration for setModels to reconcile synchronously.
       *
       * @param {object} saved
       */
      hydrate: (saved) => {
        if (!saved || typeof saved !== "object") return;
        const state = get();
        const { modelsMap, selectedModelId, parameterValues } = state;
        const tmpl = state.template || deps.template || null;
        const hasModels = Object.keys(modelsMap || {}).length > 0;
        const targetMode = saved.activeMode || state.activeMode || "image";
        const targetSubMode = saved.activeSubMode || state.activeSubMode || "frames";

        if (!hasModels) {
          const expectsModels = tmpl?.features?.models !== false;
          set({
            prompt: saved.prompt !== undefined ? saved.prompt : state.prompt,
            activeMode: targetMode,
            activeSubMode: targetSubMode,
            selectedModelId: expectsModels ? (saved.selectedModelId || selectedModelId) : null,
            parameterValues: {
              ...parameterValues,
              ...(saved.parameterValues || {}),
            },
            pendingHydration: expectsModels ? saved : null,
          });
          return;
        }

        const eligible = resolveEligibleModels(Object.values(modelsMap), {
          template: tmpl,
          activeMode: targetMode,
          activeSubMode: targetSubMode,
        });

        let targetModelId = null;
        if (saved.selectedModelId && eligible.some((m) => m.id === saved.selectedModelId)) {
          targetModelId = saved.selectedModelId;
        } else if (selectedModelId && eligible.some((m) => m.id === selectedModelId)) {
          targetModelId = selectedModelId;
        } else if (eligible.length > 0) {
          targetModelId = eligible[0].id;
        }

        const targetDefs = targetModelId ? (modelsMap[targetModelId]?.parameters || {}) : (tmpl?.parameters || {});
        const currentDefs = selectedModelId ? (modelsMap[selectedModelId]?.parameters || {}) : {};
        const savedParams = {
          ...parameterValues,
          ...(saved.parameterValues || {}),
        };

        const { nextValues, changes } = reconcile(savedParams, currentDefs, targetDefs);

        set({
          prompt: saved.prompt !== undefined ? saved.prompt : state.prompt,
          selectedModelId: targetModelId,
          parameterValues: targetModelId ? nextValues : savedParams,
          activeMode: targetMode,
          activeSubMode: targetSubMode,
          reconciliationLog: changes,
          pendingHydration: null,
        });
      },

      /**
       * Replaces the available model catalog, synchronously selects an eligible model
       * using resolveEligibleModels, reconciles parameters, and drains pendingActions
       * once models are ready.
       *
       * @param {object[]} models - Array of ModelContract objects
       * @param {Record<string, object>} [rawModelsMap={}] - Raw backend models map
       */
      setModels: (models, rawModelsMap = {}) => {
        const nextModelsMap = {};
        const rawList = Array.isArray(models) ? models : [];
        for (const m of rawList) {
          nextModelsMap[m.id] = m;
        }

        const state = get();
        const { selectedModelId, parameterValues, modelsMap, pendingHydration, identity } = state;
        const tmpl = state.template || deps.template || null;
        const nextMode = pendingHydration?.activeMode || state.activeMode || "image";
        const nextSubMode = pendingHydration?.activeSubMode || state.activeSubMode || "frames";

        const eligible = resolveEligibleModels(rawList, {
          template: tmpl,
          activeMode: nextMode,
          activeSubMode: nextSubMode,
        });

        let nextModelId = null;
        if (tmpl?.features?.models === false) {
          nextModelId = null;
        } else if (
          pendingHydration?.selectedModelId &&
          eligible.some((m) => m.id === pendingHydration.selectedModelId)
        ) {
          nextModelId = pendingHydration.selectedModelId;
        } else if (selectedModelId && eligible.some((m) => m.id === selectedModelId)) {
          nextModelId = selectedModelId;
        } else if (eligible.length > 0) {
          nextModelId = eligible[0].id;
        }

        const sourceParams = pendingHydration?.parameterValues
          ? { ...parameterValues, ...pendingHydration.parameterValues }
          : parameterValues;

        let nextValues = sourceParams;
        let reconciliationLog = [];

        if (nextModelId) {
          const prevDefs = selectedModelId ? (modelsMap[selectedModelId]?.parameters || {}) : {};
          const nextDefs = nextModelsMap[nextModelId]?.parameters || {};
          if (nextModelId !== selectedModelId || pendingHydration || !modelsMap[nextModelId]) {
            const result = reconcile(sourceParams, prevDefs, nextDefs);
            nextValues = result.nextValues;
            reconciliationLog = result.changes;
          }
        }

        set({
          modelsMap: nextModelsMap,
          rawModelsMap,
          selectedModelId: nextModelId,
          activeMode: nextMode,
          activeSubMode: nextSubMode,
          parameterValues: nextValues,
          reconciliationLog,
          pendingHydration: null,
        });

        // Drain any pending actions that were waiting for models to arrive
        if (rawList.length > 0 && identity) {
          const meta = registry.getMeta(identity);
          drainPendingActions(identity, {
            registry,
            storage: meta?.storage,
            currentProjectId: identity.projectId,
          });
        }
      },

      // ── Semantic Commands ──────────────────────────────────────────────────

      /** Switch the active model and auto-reconcile parameter state. */
      selectModel: (modelId) => {
        const res = selectModelCommand(get(), modelId, deps);
        if (res.ok && res.patch) {
          set(res.patch);
        }
        return res;
      },

      /** Atomically switches mode and subMode per PB-D-03. */
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

      /** Update prompt text from user typing (never triggers fill animation). */
      setPrompt: (prompt) => set({ prompt }),

      /**
       * Set prompt from a programmatic source (service dispatch, template action,
       * or pending queue replay). Bumps promptFillNonce in the SAME set() call so
       * the editor plays a one-shot ShineText fill sweep (PB-D-24).
       */
      setPromptExternal: (prompt) =>
        set((state) => ({ prompt, promptFillNonce: state.promptFillNonce + 1 })),

      /**
       * Update a single non-media setting parameter.
       * Validates against the active model schema and REJECTS media keys.
       */
      setSetting: (key, value) => {
        const res = setSettingCommand(get(), { key, value }, deps);
        if (res.ok && res.patch) {
          set(res.patch);
        }
        return res;
      },

      /** Attach media to a composition slot (normalizes via normalizeEntity). */
      attachMedia: (args) => {
        const res = attachMediaCommand(get(), args, deps);
        if (res.ok && res.patch) {
          set(res.patch);
        }
        return res;
      },

      /** Remove media from a composition slot or list and clean orphan prompt tags. */
      removeMedia: (args) => {
        const res = removeMediaCommand(get(), args, deps);
        if (res.ok && res.patch) {
          set(res.patch);
        }
        return res;
      },

      /** Clear an entire media slot by role and clean orphan prompt tags. */
      clearSlot: (role) => {
        const res = removeMediaCommand(get(), { role }, deps);
        if (res.ok && res.patch) {
          set(res.patch);
        }
        return res;
      },

      /** Atomically swap start and end frames in one patch. */
      swapFrames: () => {
        const res = swapFramesCommand(get(), deps);
        if (res.ok && res.patch) {
          set(res.patch);
        }
        return res;
      },

      /** Atomically clear prompt and all attached media slots while keeping non-media settings. */
      clearDraft: () => {
        const res = clearDraftCommand(get(), deps);
        if (res.ok && res.patch) {
          set(res.patch);
        }
        return res;
      },

      /** Update generation loading state without touching prompt or parameterValues (FR-CORE-07). */
      setIsGenerating: (isGenerating) => set({ isGenerating: Boolean(isGenerating) }),

      /** Begins submit lifecycle tracking. */
      beginSubmit: () => {
        const { identity } = get();
        let token = null;
        if (identity) {
          token = registry.beginSubmit(identity);
        }
        set({ isGenerating: true });
        return token;
      },

      /** Ends submit lifecycle tracking. */
      endSubmit: (token) => {
        const { identity } = get();
        if (identity && token) {
          const ended = registry.endSubmit(identity, token);
          if (!ended) return false;
        }
        set({ isGenerating: false });
        return true;
      },

      /**
       * Serialize current state into the pass-through API payload.
       * Derives elements and characters from parameterValues (single source of truth).
       */
      serialize: () => {
        const { selectedModelId, prompt, modelsMap, parameterValues, template } = get();
        const definitions =
          (selectedModelId ? modelsMap[selectedModelId]?.parameters : null) ||
          template?.parameters ||
          {};
        const { elements, characters } = deriveEntitiesFromParameters(parameterValues);
        const result = serialize(selectedModelId, prompt, definitions, parameterValues, {
          elements,
          characters,
        });
        set({ lastSerializedRequest: result });
        return result;
      },

      /** Reset prompt and parameters to model/template defaults. */
      reset: () => {
        const { modelsMap, selectedModelId, template } = get();
        const definitions =
          (selectedModelId ? modelsMap[selectedModelId]?.parameters : null) ||
          template?.parameters ||
          {};
        const parameterValues = initializeValues(definitions);
        set({
          prompt: "",
          parameterValues,
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
