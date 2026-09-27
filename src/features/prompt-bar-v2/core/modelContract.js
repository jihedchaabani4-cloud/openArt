/**
 * Model Contract & Normalization for Prompt Bar V2
 * 
 * Defines the canonical shapes for Models and Parameter Definitions,
 * transforming arbitrary model schema formats into a deterministic frontend contract.
 */

export const SUPPORTED_PARAMETER_TYPES = Object.freeze([
  "select",
  "number",
  "boolean",
  "text",
  "image",
  "video",
  "image[]",
  "video[]",
]);

/**
 * Normalizes a raw parameter definition into the canonical frontend shape.
 * 
 * @param {string} name - Parameter identifier
 * @param {object} rawParam - Raw parameter definition
 * @returns {object} Canonical parameter definition
 */
export function normalizeParameterDefinition(name, rawParam = {}) {
  const diagnostics = [];
  const type = rawParam.type || "text";

  // Check if type is known
  if (!SUPPORTED_PARAMETER_TYPES.includes(type)) {
    diagnostics.push({
      level: "warn",
      parameter: name,
      message: `Unknown parameter type "${type}". Graceful fallback will be used.`,
    });
  }

  // Derive human-readable label
  const label =
    rawParam.label ||
    name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  // Determine presentation role & group
  let role = rawParam.role;
  if (!role) {
    if (type === "image" && (name === "last_frame" || name === "end_frame")) {
      role = "end_frame";
    } else if (type === "image" && (name === "input_image" || name === "start_frame")) {
      role = "start_frame";
    } else if (type === "image[]") {
      role = "reference_images";
    } else if (type === "video[]") {
      role = "reference_videos";
    } else if (type === "video") {
      role = "reference_video";
    } else {
      role = "parameter";
    }
  }

  let group = rawParam.group;
  if (!group) {
    if (["image", "video", "image[]", "video[]"].includes(type)) {
      group = "media";
    } else if (["seed", "steps", "cfg_scale"].includes(name)) {
      group = "advanced";
    } else {
      group = "generation";
    }
  }

  // Normalize options for select/enum
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
      return {
        value: v,
        label: String(v),
        disabled: false,
      };
    });

    if (rawParam.default !== undefined) {
      const allowedValues = values.map((v) => v.value);
      if (allowedValues.length > 0 && !allowedValues.includes(rawParam.default)) {
        diagnostics.push({
          level: "warn",
          parameter: name,
          message: `Default value "${rawParam.default}" is not in allowed values: [${allowedValues.join(", ")}].`,
        });
      }
    }
  }

  // Number validation metadata
  let min = rawParam.min !== undefined ? Number(rawParam.min) : undefined;
  let max = rawParam.max !== undefined ? Number(rawParam.max) : undefined;
  let step = rawParam.step !== undefined ? Number(rawParam.step) : (type === "number" ? 1 : undefined);

  if (min !== undefined && max !== undefined && min > max) {
    diagnostics.push({
      level: "warn",
      parameter: name,
      message: `Parameter min (${min}) is greater than max (${max}).`,
    });
  }

  // Normalize default value
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
    maxCount: rawParam.max || rawParam.maxCount || (type.endsWith("[]") ? 4 : 1),
    role,
    group,
    order: rawParam.order ?? 100,
    description: rawParam.description || "",
    diagnostics,
  };
}

/**
 * Normalizes an entire model schema into the canonical frontend model contract.
 * 
 * @param {object} rawModel - Backend model manifest or fixture
 * @returns {object} Canonical model contract
 */
export function normalizeModelContract(rawModel = {}) {
  const id = rawModel.id || rawModel.key || "unknown-model";
  const name = rawModel.name || rawModel.displayName || id;
  const domain = rawModel.domain || rawModel.category || "image";
  const rawParams = rawModel.parameters || {};

  const definitions = {};
  const allDiagnostics = [];

  for (const [paramName, rawParam] of Object.entries(rawParams)) {
    const normalized = normalizeParameterDefinition(paramName, rawParam);
    definitions[paramName] = normalized;
    if (normalized.diagnostics.length > 0) {
      allDiagnostics.push(...normalized.diagnostics);
    }
  }

  return {
    id,
    name,
    domain,
    description: rawModel.description || "",
    badge: rawModel.badge,
    icon: rawModel.icon,
    parameters: definitions,
    diagnostics: allDiagnostics,
  };
}
