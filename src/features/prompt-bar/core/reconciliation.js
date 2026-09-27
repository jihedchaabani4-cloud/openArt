/**
 * Prompt Bar Platform — Reconciliation
 *
 * Pure reconciliation logic for model switching.
 * No React, no DOM, no feature-specific imports.
 *
 * Rules:
 * 1. If parameter exists in next model and previous value is valid → PRESERVE
 * 2. If parameter exists in next model but previous value is invalid → RESET to default
 * 3. If parameter was in previous model but not in next model → REMOVE
 * 4. If parameter is new in next model → INITIALIZE to default
 */

/**
 * Validates a single parameter value against its definition.
 *
 * @param {object} definition - ParameterDefinition
 * @param {any} value - Value to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateParameter(definition, value) {
  if (!definition) return { valid: false, error: "Missing parameter definition" };

  const { name, type, required, values, min, max } = definition;

  const isEmpty =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  if (required && isEmpty) {
    return { valid: false, error: `Parameter "${name}" is required.` };
  }
  if (isEmpty) return { valid: true };

  switch (type) {
    case "select": {
      if (!Array.isArray(values) || values.length === 0) return { valid: true };
      const isAllowed = values.some(
        (opt) => String(opt.value) === String(value) && !opt.disabled
      );
      if (!isAllowed) {
        const allowed = values.map((v) => v.value).join(", ");
        return { valid: false, error: `Value "${value}" not in allowed options: [${allowed}].` };
      }
      return { valid: true };
    }
    case "number": {
      const num = Number(value);
      if (Number.isNaN(num)) return { valid: false, error: `Value "${value}" is not a number.` };
      if (min !== undefined && num < min) return { valid: false, error: `Value ${num} is below minimum ${min}.` };
      if (max !== undefined && num > max) return { valid: false, error: `Value ${num} exceeds maximum ${max}.` };
      return { valid: true };
    }
    case "boolean":
      return { valid: true };
    default:
      return { valid: true };
  }
}

/**
 * Reconciles parameter state when switching from one model to another.
 *
 * @param {Record<string, any>}    previousValues      - Active parameter values before switch
 * @param {Record<string, object>} previousDefinitions - Definitions of previous model
 * @param {Record<string, object>} nextDefinitions     - Definitions of next model
 * @returns {{ nextValues: Record<string, any>, changes: object[] }}
 */
export function reconcile(previousValues = {}, previousDefinitions = {}, nextDefinitions = {}) {
  const nextValues = {};
  const changes = [];

  // Process all parameters in the incoming model
  for (const [name, nextDef] of Object.entries(nextDefinitions)) {
    const prevVal = previousValues[name];
    const existedInPrev = name in previousValues;

    if (existedInPrev && prevVal !== undefined && prevVal !== null) {
      const validation = validateParameter(nextDef, prevVal);
      if (validation.valid) {
        nextValues[name] = prevVal;
        changes.push({ parameter: name, action: "preserved", value: prevVal, reason: "Value is compatible with new model definition." });
      } else {
        nextValues[name] = nextDef.default;
        changes.push({ parameter: name, action: "reset", previousValue: prevVal, value: nextDef.default, reason: `Previous value incompatible (${validation.error}). Reset to default.` });
      }
    } else {
      nextValues[name] = nextDef.default;
      changes.push({ parameter: name, action: "initialized", value: nextDef.default, reason: "New parameter initialized with default." });
    }
  }

  // Identify removed parameters
  for (const name of Object.keys(previousValues)) {
    if (!(name in nextDefinitions)) {
      changes.push({ parameter: name, action: "removed", previousValue: previousValues[name], reason: "Parameter does not exist in new model." });
    }
  }

  return { nextValues, changes };
}