/**
 * Prompt Bar Platform — Core Types
 *
 * Canonical type definitions for the entire Platform.
 * No React, no DOM, no feature-specific imports.
 */

import { PARAM, MEDIA_TYPES, isMediaType } from "./parameterKeys.js";

/**
 * Supported parameter types. Controls in ParameterControl.jsx map these to UI components.
 * image[] and video[] are handled by composition reference slots — ParameterControl skips them.
 */
export const SUPPORTED_PARAMETER_TYPES = Object.freeze([
  "select",
  "number",
  "boolean",
  "text",
  MEDIA_TYPES.IMAGE,
  MEDIA_TYPES.VIDEO,
  MEDIA_TYPES.IMAGE_ARRAY,
  MEDIA_TYPES.VIDEO_ARRAY,
]);

/**
 * Normalizes a raw parameter definition into the canonical frontend shape.
 *
 * @param {string} name - Parameter identifier (key)
 * @param {object} rawParam - Raw parameter definition from backend or fixture
 * @returns {object} Canonical ParameterDefinition
 */
export function normalizeParameterDefinition(name, rawParam = {}) {
  const diagnostics = [];
  const type = rawParam.type || "text";

  if (!SUPPORTED_PARAMETER_TYPES.includes(type)) {
    diagnostics.push({
      level: "warn",
      parameter: name,
      message: `Unknown parameter type "${type}". Control will be silently skipped.`,
    });
  }

  // Derive human-readable label
  const label =
    rawParam.label ||
    name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  // Role
  let role = rawParam.role;
  if (!role) {
    if (type === MEDIA_TYPES.IMAGE && (name === PARAM.LAST_FRAME || name === PARAM.END_FRAME)) {
      role = PARAM.END_FRAME;
    } else if (type === MEDIA_TYPES.IMAGE && (name === PARAM.INPUT_IMAGE || name === PARAM.START_FRAME)) {
      role = PARAM.START_FRAME;
    } else if (type === MEDIA_TYPES.IMAGE_ARRAY) {
      role = PARAM.REFERENCE_IMAGES;
    } else if (type === MEDIA_TYPES.VIDEO_ARRAY) {
      role = PARAM.REFERENCE_VIDEOS;
    } else if (type === MEDIA_TYPES.VIDEO) {
      role = "reference_video";
    } else {
      role = "parameter";
    }
  }

  // Group
  let group = rawParam.group;
  if (!group) {
    if (isMediaType(type)) {
      group = "media";
    } else if (["seed", "steps", "cfg_scale"].includes(name)) {
      group = "advanced";
    } else {
      group = "generation";
    }
  }

  // Normalize options for select
  let values = undefined;
  if (type === "select" || Array.isArray(rawParam.values)) {
    const rawValues = rawParam.values || [];
    values = rawValues.map((v) => {
      if (typeof v === "object" && v !== null) {
        return {
          value: v.value,
          label: v.label || String(v.value),
          icon: v.icon,
          disabled: !!v.disabled,
        };
      }
      return { value: v, label: String(v), disabled: false };
    });

    if (rawParam.default !== undefined) {
      const allowed = values.map((v) => v.value);
      if (allowed.length > 0 && !allowed.includes(rawParam.default)) {
        diagnostics.push({
          level: "warn",
          parameter: name,
          message: `Default "${rawParam.default}" not in allowed values: [${allowed.join(", ")}].`,
        });
      }
    }
  }

  // Number / Array bounds
  const min = rawParam.min !== undefined ? Number(rawParam.min) : undefined;
  const max = rawParam.max !== undefined
    ? Number(rawParam.max)
    : (rawParam.max_count !== undefined ? Number(rawParam.max_count) : undefined);
  const step = rawParam.step !== undefined ? Number(rawParam.step) : (type === "number" ? 1 : undefined);

  // Default value
  let defaultValue = rawParam.default;
  if (defaultValue === undefined) {
    if (type === "select" && values && values.length > 0) {
      defaultValue = values[0].value;
    } else if (type === "boolean") {
      defaultValue = false;
    } else if (type === "image[]" || type === "video[]") {
      defaultValue = [];
    } else if (type === "number" && min !== undefined) {
      defaultValue = min;
    }
  }

  return {
    name,
    label,
    type,
    required: Boolean(rawParam.required),
    default: defaultValue,
    values,
    min,
    max,
    step,
    maxCount: rawParam.maxCount || max || (type.endsWith("[]") ? 4 : 1),
    role,
    group,
    order: rawParam.order ?? 100,
    description: rawParam.description || "",
    diagnostics,
  };
}
