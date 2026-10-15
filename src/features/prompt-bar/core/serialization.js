/**
 * Prompt Bar Platform — Serialization
 *
 * Pure serialization of PromptBar state into a clean pass-through API payload.
 * No React, no DOM, no feature-specific imports.
 *
 * Contract (FR-CORE-06, FR-CORE-07):
 * - Output: { model: string, prompt: string, parameters: Record<string, any> }
 * - null, undefined, and empty string values are OMITTED from parameters
 * - Keys are never renamed or aliased
 * - State preservation (FR-CORE-07): Serialization is read-only and does NOT clear prompt or parameter state
 */

import { validateParameter } from "./reconciliation.js";
import { PARAM } from "./parameterKeys.js";

const MEDIA_PARAM_NAMES = new Set([
  PARAM.IMAGES,
  PARAM.REFERENCE_IMAGES,
  PARAM.INPUT_IMAGE,
  PARAM.LAST_FRAME,
  PARAM.INPUT_VIDEO,
  PARAM.START_FRAME,
  PARAM.END_FRAME,
]);

/**
 * Extracts a valid workflow ID from an item (object or string).
 * Strictly rejects direct HTTP/HTTPS/blob URLs to adhere to backend validation.
 *
 * @param {any} item
 * @returns {string|null}
 */
export function extractWorkflowId(item) {
  if (!item) return null;
  if (typeof item === "object") {
    const id = item.workflow_id || item.workflowId || item.id || item.asset_id;
    if (typeof id === "string" && id.trim()) {
      const clean = id.trim();
      if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("blob:")) {
        return clean;
      }
    }
    return null;
  }
  if (typeof item === "string") {
    const clean = item.trim();
    if (clean && !clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("blob:")) {
      return clean;
    }
  }
  return null;
}

/**
 * Normalizes a parameter value representing media into workflow IDs.
 *
 * @param {any} val
 * @returns {any}
 */
function normalizeMediaParamValue(val) {
  if (Array.isArray(val)) {
    return val
      .map((v) => {
        if (typeof v === "object" && v !== null) {
          return extractWorkflowId(v) || (typeof v.url === "string" && !v.url.startsWith("blob:") ? v.url : undefined);
        }
        return v;
      })
      .filter((v) => v !== undefined && v !== null && v !== "");
  }
  if (typeof val === "object" && val !== null) {
    return extractWorkflowId(val) || (typeof val.url === "string" && !val.url.startsWith("blob:") ? val.url : undefined);
  }
  return val;
}

/**
 * Serializes the current PromptBar state into a clean API payload.
 *
 * @param {string}                 modelId     - Active model id
 * @param {string}                 prompt      - Raw prompt text (will be trimmed)
 * @param {Record<string, object>} definitions - Active model parameter definitions
 * @param {Record<string, any>}    values      - Active parameter values
 * @param {object}                 [extra]     - Additional feature fields (e.g. elements, characters, references)
 * @returns {{ model: string, prompt: string, parameters: Record<string, any>, references: string[], elements?: string[], characters?: string[] }}
 */
export function serialize(modelId, prompt = "", definitions = {}, values = {}, extra = {}) {
  const parameters = {};

  for (const [name, def] of Object.entries(definitions)) {
    const val = values[name];

    // FR-CORE-06: omit null, undefined, and empty string
    if (val === undefined || val === null || val === "") continue;

    const validation = validateParameter(def, val);
    if (validation.valid) {
      const isMedia =
        MEDIA_PARAM_NAMES.has(name) ||
        def?.group === "media" ||
        def?.type === "image" ||
        def?.type === "image[]" ||
        def?.type === "video" ||
        def?.type === "video[]";

      if (isMedia) {
        parameters[name] = normalizeMediaParamValue(val);
      } else if (Array.isArray(val)) {
        parameters[name] = val.map((v) =>
          typeof v === "object" && v !== null
            ? (extractWorkflowId(v) || v.url || v)
            : v
        );
      } else if (typeof val === "object" && val !== null) {
        parameters[name] = extractWorkflowId(val) || val.url || val;
      } else {
        parameters[name] = val;
      }
    }
  }

  // Collect all active workflow IDs for root `references` field (required by backend contract)
  const referenceIdSet = new Set();

  function collectId(item) {
    const id = extractWorkflowId(item);
    if (id) {
      referenceIdSet.add(id);
    }
  }

  // 1. From media parameters declared and emitted in parameters
  for (const [k, val] of Object.entries(parameters)) {
    const def = definitions[k];
    const isMedia =
      MEDIA_PARAM_NAMES.has(k) ||
      def?.group === "media" ||
      def?.type === "image" ||
      def?.type === "image[]" ||
      def?.type === "video" ||
      def?.type === "video[]";
    if (isMedia) {
      if (Array.isArray(val)) {
        val.forEach(collectId);
      } else if (val) {
        collectId(val);
      }
    }
  }

  // 2. From extra.elements
  if (Array.isArray(extra.elements)) {
    extra.elements.forEach(collectId);
  }

  // 3. From extra.characters
  if (Array.isArray(extra.characters)) {
    extra.characters.forEach(collectId);
  }

  // 4. From extra.references
  if (Array.isArray(extra.references)) {
    extra.references.forEach(collectId);
  }

  const result = {
    ...(modelId ? { model: modelId } : {}),
    prompt: typeof prompt === "string" ? prompt.trim() : "",
    parameters,
    references: Array.from(referenceIdSet),
  };

  if (extra.elements !== undefined) {
    result.elements = Array.isArray(extra.elements)
      ? extra.elements
          .map((e) => (typeof e === "object" && e !== null ? e.workflow_id || e.id : e))
          .filter(Boolean)
      : [];
  }

  if (extra.characters !== undefined) {
    result.characters = Array.isArray(extra.characters)
      ? extra.characters
          .map((c) => (typeof c === "object" && c !== null ? c.workflow_id || c.id : c))
          .filter(Boolean)
      : [];
  }

  return result;
}
