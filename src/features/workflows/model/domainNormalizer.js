// [FSD Layer: features/workflows] — Domain constants and normalization helpers

export const DOMAIN_TYPES = Object.freeze({
  GENERATION: "GENERATION",
  UPLOAD: "UPLOAD",
  ELEMENT_SHEET: "ELEMENT_SHEET",
  CHARACTER: "CHARACTER",
});

function upper(value) {
  return String(value || "").trim().toUpperCase();
}

export function normalizeDomainType(value) {
  const type = upper(value);
  if (type === DOMAIN_TYPES.UPLOAD) return DOMAIN_TYPES.UPLOAD;
  if (type === "ELEMENT" || type === DOMAIN_TYPES.ELEMENT_SHEET) return DOMAIN_TYPES.ELEMENT_SHEET;
  if (type === DOMAIN_TYPES.CHARACTER) return DOMAIN_TYPES.CHARACTER;
  return DOMAIN_TYPES.GENERATION;
}

export function getWorkflowDomainType(workflow) {
  return normalizeDomainType(workflow?.workflow_type || workflow?.workflowType || workflow?.metadata?.workflowType);
}