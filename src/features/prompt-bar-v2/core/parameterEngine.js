/**
 * Parameter Engine for Prompt Bar V2
 * 
 * Centralized, pure logic for:
 * - Parameter validation
 * - State reconciliation upon model switching
 * - Semantic request serialization
 */

/**
 * Validates a single parameter value against its definition.
 * 
 * @param {object} definition - Normalized parameter definition
 * @param {any} value - Value to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export function validateParameter(definition, value) {
  if (!definition) {
    return { valid: false, error: "Missing parameter definition" };
  }

  const { name, type, required, values, min, max, step, maxCount } = definition;

  // 1. Check required presence
  const isEmpty =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  if (required && isEmpty) {
    return {
      valid: false,
      error: `Parameter "${name}" is required.`,
    };
  }

  // If value is empty and not required, it's valid
  if (isEmpty) {
    return { valid: true };
  }

  // 2. Type-specific validation
  switch (type) {
    case "select": {
      if (!Array.isArray(values) || values.length === 0) {
        return { valid: true };
      }
      const isAllowed = values.some(
        (opt) => String(opt.value) === String(value) && !opt.disabled
      );
      if (!isAllowed) {
        const allowedList = values.map((v) => v.value).join(", ");
        return {
          valid: false,
          error: `Value "${value}" is not one of allowed values: [${allowedList}].`,
        };
      }
      return { valid: true };
    }

    case "number": {
      const num = Number(value);
      if (Number.isNaN(num)) {
        return {
          valid: false,
          error: `Value must be a valid number. Received "${value}".`,
        };
      }
      if (min !== undefined && num < min) {
        return {
          valid: false,
          error: `Value ${num} is less than minimum allowed (${min}).`,
        };
      }
      if (max !== undefined && num > max) {
        return {
          valid: false,
          error: `Value ${num} is greater than maximum allowed (${max}).`,
        };
      }
      if (step !== undefined && step > 0) {
        const base = min !== undefined ? min : 0;
        const remainder = Math.abs((num - base) % step);
        const epsilon = 1e-7;
        if (remainder > epsilon && Math.abs(remainder - step) > epsilon) {
          return {
            valid: false,
            error: `Value ${num} does not match step size ${step}.`,
          };
        }
      }
      return { valid: true };
    }

    case "boolean": {
      if (typeof value !== "boolean") {
        return {
          valid: false,
          error: `Value must be a boolean. Received "${typeof value}".`,
        };
      }
      return { valid: true };
    }

    case "text": {
      if (typeof value !== "string") {
        return {
          valid: false,
          error: `Value must be a string. Received "${typeof value}".`,
        };
      }
      return { valid: true };
    }

    case "image":
    case "video": {
      if (typeof value === "string" && value.trim().length > 0) {
        return { valid: true };
      }
      if (typeof value === "object" && value !== null && (value.url || value.id || value.asset_id)) {
        return { valid: true };
      }
      return {
        valid: false,
        error: `Invalid media value for "${name}".`,
      };
    }

    case "image[]":
    case "video[]": {
      if (!Array.isArray(value)) {
        return {
          valid: false,
          error: `Value for "${name}" must be an array.`,
        };
      }
      if (maxCount !== undefined && value.length > maxCount) {
        return {
          valid: false,
          error: `Maximum allowed items for "${name}" is ${maxCount}. Received ${value.length}.`,
        };
      }
      return { valid: true };
    }

    default: {
      // Unknown type - emit diagnostic but don't hard crash
      return {
        valid: true,
      };
    }
  }
}

/**
 * Validates all parameters for a model against their definitions.
 * 
 * @param {Record<string, object>} definitions - Map of parameter definitions
 * @param {Record<string, any>} values - Current parameter values
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateAllParameters(definitions = {}, values = {}) {
  const errors = {};
  let isValid = true;

  for (const [name, def] of Object.entries(definitions)) {
    const val = values[name];
    const res = validateParameter(def, val);
    if (!res.valid) {
      errors[name] = res.error || `Invalid parameter "${name}".`;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Reconciles state when switching from one model to another.
 * 
 * Rules:
 * 1. Compatible value: If the parameter exists in the next model and previous value is valid -> PRESERVE.
 * 2. Invalid value: If parameter exists in next model but previous value is invalid -> RESET to next default.
 * 3. Removed parameter: If parameter was in previous model but not in next model -> REMOVE.
 * 4. New parameter: If parameter is new in next model -> INITIALIZE to default.
 * 5. Required parameter without default: If new and required without default -> mark empty/invalid.
 * 
 * @param {Record<string, any>} previousValues - Current parameter values
 * @param {Record<string, object>} previousDefinitions - Definitions of previous model
 * @param {Record<string, object>} nextDefinitions - Definitions of next model
 * @returns {{ nextValues: Record<string, any>, changes: Array<object> }}
 */
export function reconcileState(previousValues = {}, previousDefinitions = {}, nextDefinitions = {}) {
  const nextValues = {};
  const changes = [];

  // 1. Process all parameters in the incoming model
  for (const [name, nextDef] of Object.entries(nextDefinitions)) {
    const prevVal = previousValues[name];
    const existedInPrev = name in previousValues;

    if (existedInPrev && prevVal !== undefined && prevVal !== null) {
      // Check if previous value is valid under the new definition
      const validation = validateParameter(nextDef, prevVal);

      if (validation.valid) {
        // Value survives
        nextValues[name] = prevVal;
        changes.push({
          parameter: name,
          action: "preserved",
          value: prevVal,
          reason: "Value is compatible with new model definition.",
        });
      } else {
        // Value is incompatible -> reset to next default
        const fallback = nextDef.default;
        nextValues[name] = fallback;
        changes.push({
          parameter: name,
          action: "reset",
          previousValue: prevVal,
          value: fallback,
          reason: `Previous value incompatible (${validation.error}). Reset to default.`,
        });
      }
    } else {
      // New parameter
      const fallback = nextDef.default;
      nextValues[name] = fallback;
      changes.push({
        parameter: name,
        action: "initialized",
        value: fallback,
        reason: "New parameter initialized with default.",
      });
    }
  }

  // 2. Identify removed parameters
  for (const name of Object.keys(previousValues)) {
    if (!(name in nextDefinitions)) {
      changes.push({
        parameter: name,
        action: "removed",
        previousValue: previousValues[name],
        reason: "Parameter does not exist in new model.",
      });
    }
  }

  return { nextValues, changes };
}

/**
 * Serializes valid parameter state into a semantic request payload.
 * Unsupported or invalid parameters are NEVER included.
 * 
 * @param {string} modelId - Selected model ID
 * @param {string} prompt - Prompt text
 * @param {Record<string, object>} definitions - Active model parameter definitions
 * @param {Record<string, any>} values - Active parameter values
 * @returns {{ model: string, prompt: string, parameters: Record<string, any> }}
 */
export function serializeSemanticRequest(modelId, prompt = "", definitions = {}, values = {}) {
  const parameters = {};

  for (const [name, def] of Object.entries(definitions)) {
    const val = values[name];

    // Only serialize if defined and valid
    if (val !== undefined && val !== null && val !== "") {
      const validation = validateParameter(def, val);
      if (validation.valid) {
        parameters[name] = val;
      }
    }
  }

  return {
    model: modelId,
    prompt: typeof prompt === "string" ? prompt.trim() : "",
    parameters,
  };
}
