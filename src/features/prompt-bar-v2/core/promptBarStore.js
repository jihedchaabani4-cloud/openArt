import { create } from "zustand";
import { normalizeModelContract } from "./modelContract.js";
import {
  validateParameter,
  validateAllParameters,
  reconcileState,
  serializeSemanticRequest,
} from "./parameterEngine.js";
import { ALL_TEST_MODELS } from "../fixtures/testModels.js";

/**
 * Creates and normalizes initial models map.
 */
function createNormalizedModelsMap(rawModels) {
  const map = {};
  for (const raw of rawModels) {
    const norm = normalizeModelContract(raw);
    map[norm.id] = norm;
  }
  return map;
}

const initialModelsMap = createNormalizedModelsMap(ALL_TEST_MODELS);
const defaultModelId = ALL_TEST_MODELS[0]?.id || "";
const defaultModel = initialModelsMap[defaultModelId];

// Initialize initial parameters using defaults
const initialValues = {};
if (defaultModel?.parameters) {
  for (const [name, def] of Object.entries(defaultModel.parameters)) {
    if (def.default !== undefined) {
      initialValues[name] = def.default;
    }
  }
}

/**
 * usePromptBarV2Store
 * Generic state store for Prompt Bar V2.
 * Purely data-driven with no hardcoded model or provider logic.
 */
export const usePromptBarV2Store = create((set, get) => ({
  modelsMap: initialModelsMap,
  rawModelsMap: {},
  selectedModelId: defaultModelId,
  prompt: "",
  parameterValues: initialValues,
  reconciliationLog: [],
  validationErrors: {},
  isGenerating: false,
  lastSerializedRequest: null,

  /**
   * Set list of available models and optional raw backend objects.
   */
  setModels: (models, rawModelsMap = {}) => {
    let nextModelsMap = {};
    if (Array.isArray(models)) {
      for (const m of models) {
        const norm = m.parameters ? m : normalizeModelContract(m);
        nextModelsMap[norm.id] = norm;
      }
    } else if (typeof models === "object" && models !== null) {
      nextModelsMap = models;
    }

    const { selectedModelId, parameterValues, modelsMap: prevModelsMap } = get();
    const modelIds = Object.keys(nextModelsMap);
    if (modelIds.length === 0) {
      set({ modelsMap: {}, rawModelsMap: {} });
      return;
    }

    const activeId = nextModelsMap[selectedModelId] ? selectedModelId : modelIds[0];
    const activeModel = nextModelsMap[activeId];
    const activeDefs = activeModel?.parameters || {};

    const prevModel = prevModelsMap[selectedModelId];
    const prevDefs = prevModel?.parameters || {};

    const { nextValues, changes } = reconcileState(parameterValues, prevDefs, activeDefs);
    const { errors } = validateAllParameters(activeDefs, nextValues);

    set({
      modelsMap: nextModelsMap,
      rawModelsMap,
      selectedModelId: activeId,
      parameterValues: nextValues,
      reconciliationLog: changes,
      validationErrors: errors,
    });
  },

  /**
   * Select a new model. Triggers pure reconciliation.
   */
  selectModel: (nextModelId) => {
    const { modelsMap, selectedModelId, parameterValues } = get();
    if (Object.is(nextModelId, selectedModelId)) return;

    const prevModel = modelsMap[selectedModelId];
    const nextModel = modelsMap[nextModelId];

    if (!nextModel) {
      console.warn(`[PromptBarV2] Model "${nextModelId}" not found in registered models.`);
      return;
    }

    const prevDefs = prevModel?.parameters || {};
    const nextDefs = nextModel?.parameters || {};

    const { nextValues, changes } = reconcileState(parameterValues, prevDefs, nextDefs);
    const { errors } = validateAllParameters(nextDefs, nextValues);

    set({
      selectedModelId: nextModelId,
      parameterValues: nextValues,
      reconciliationLog: changes,
      validationErrors: errors,
    });
  },

  /**
   * Set a single parameter value.
   */
  setParameter: (name, value) => {
    const { modelsMap, selectedModelId, parameterValues, validationErrors } = get();
    const currentModel = modelsMap[selectedModelId];
    const def = currentModel?.parameters?.[name];

    const nextValues = { ...parameterValues, [name]: value };

    // Validate updated parameter
    const nextErrors = { ...validationErrors };
    if (def) {
      const res = validateParameter(def, value);
      if (!res.valid) {
        nextErrors[name] = res.error;
      } else {
        delete nextErrors[name];
      }
    }

    set({
      parameterValues: nextValues,
      validationErrors: nextErrors,
    });
  },

  /**
   * Reset a single parameter to default.
   */
  resetParameter: (name) => {
    const { modelsMap, selectedModelId } = get();
    const currentModel = modelsMap[selectedModelId];
    const def = currentModel?.parameters?.[name];

    if (def) {
      get().setParameter(name, def.default);
    }
  },

  /**
   * Reset all parameters of current model to default.
   */
  resetAllParameters: () => {
    const { modelsMap, selectedModelId } = get();
    const currentModel = modelsMap[selectedModelId];
    const defs = currentModel?.parameters || {};

    const nextValues = {};
    for (const [name, def] of Object.entries(defs)) {
      if (def.default !== undefined) {
        nextValues[name] = def.default;
      }
    }

    const { errors } = validateAllParameters(defs, nextValues);

    set({
      parameterValues: nextValues,
      validationErrors: errors,
      reconciliationLog: [
        {
          parameter: "*",
          action: "reset_all",
          reason: "User reset all parameters to default.",
        },
      ],
    });
  },

  /**
   * Set prompt text. Kept completely isolated from parameter engine.
   */
  setPrompt: (prompt) => {
    set({ prompt });
  },

  /**
   * Run validation on all current parameters.
   */
  validate: () => {
    const { modelsMap, selectedModelId, parameterValues } = get();
    const currentModel = modelsMap[selectedModelId];
    const defs = currentModel?.parameters || {};

    const { isValid, errors } = validateAllParameters(defs, parameterValues);
    set({ validationErrors: errors });
    return { isValid, errors };
  },

  /**
   * Serializes current state into semantic request.
   */
  serialize: () => {
    const { modelsMap, selectedModelId, prompt, parameterValues } = get();
    const currentModel = modelsMap[selectedModelId];
    const defs = currentModel?.parameters || {};

    const request = serializeSemanticRequest(selectedModelId, prompt, defs, parameterValues);
    set({ lastSerializedRequest: request });
    return request;
  },

  /**
   * Set arbitrary test values (used by debug panel).
   */
  setTestValues: (newValues) => {
    const { modelsMap, selectedModelId } = get();
    const currentModel = modelsMap[selectedModelId];
    const defs = currentModel?.parameters || {};

    const { errors } = validateAllParameters(defs, newValues);
    set({
      parameterValues: { ...newValues },
      validationErrors: errors,
    });
  },

  /**
   * Clear all media reference items.
   */
  clearReferences: () => {
    const { modelsMap, selectedModelId, parameterValues } = get();
    const currentModel = modelsMap[selectedModelId];
    const defs = currentModel?.parameters || {};

    const nextValues = { ...parameterValues };
    for (const [name, def] of Object.entries(defs)) {
      if (["image", "video"].includes(def.type)) {
        delete nextValues[name];
      } else if (["image[]", "video[]"].includes(def.type)) {
        nextValues[name] = [];
      }
    }

    set({ parameterValues: nextValues });
  },
}));
