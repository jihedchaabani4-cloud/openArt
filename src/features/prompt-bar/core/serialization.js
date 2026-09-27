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

/**
 * Serializes the current PromptBar state into a clean API payload.
 *
 * @param {string}                 modelId     - Active model id
 * @param {string}                 prompt      - Raw prompt text (will be trimmed)
 * @param {Record<string, object>} definitions - Active model parameter definitions
 * @param {Record<string, any>}    values      - Active parameter values
 * @param {object}                 [extra]     - Additional feature fields (e.g. elements, characters)
 * @returns {{ model: string, prompt: string, parameters: Record<string, any>, elements?: string[], characters?: string[] }}
 */
export function serialize(modelId, prompt = "", definitions = {}, values = {}, extra = {}) {
  const parameters = {};

  for (const [name, def] of Object.entries(definitions)) {
    const val = values[name];

    // FR-CORE-06: omit null, undefined, and empty string
    if (val === undefined || val === null || val === "") continue;

    const validation = validateParameter(def, val);
    if (validation.valid) {
      if (Array.isArray(val)) {
        parameters[name] = val.map((v) =>
          typeof v === "object" && v !== null
            ? (v.workflow_id || v.workflowId || v.id || v.asset_id || v.url || v)
            : v
        );
      } else if (typeof val === "object" && val !== null) {
        parameters[name] = val.workflow_id || val.workflowId || val.id || val.asset_id || val.url || val;
      } else {
        parameters[name] = val;
      }
    }
  }

  // Include media parameters present in values even if omitted from model definitions
  for (const [name, val] of Object.entries(values)) {
    if (parameters[name] !== undefined) continue;
    if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) continue;
    if (name === "images" || name === "reference_images" || name === "input_image") {
      if (Array.isArray(val)) {
        parameters[name] = val.map((v) =>
          typeof v === "object" && v !== null
            ? (v.workflow_id || v.workflowId || v.id || v.asset_id || v.url || v)
            : v
        );
      } else if (typeof val === "object" && val !== null) {
        parameters[name] = val.workflow_id || val.workflowId || val.id || val.asset_id || val.url || val;
      } else {
        parameters[name] = val;
      }
    }
  }

  const result = {
    model: modelId,
    prompt: typeof prompt === "string" ? prompt.trim() : "",
    parameters,
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
