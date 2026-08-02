// [FSD Layer: features/workflows] — Domain constants and normalization helpers

export const DOMAIN_TYPES = Object.freeze({
  GENERATION: "GENERATION",
  UPLOAD: "UPLOAD",
  ELEMENT_SHEET: "ELEMENT_SHEET",
  CHARACTER: "CHARACTER",
});

export const MEDIA_STATUS = Object.freeze({
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
  PENDING: "pending",
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

export function isElementWorkflow(workflow) {
  return getWorkflowDomainType(workflow) === DOMAIN_TYPES.ELEMENT_SHEET;
}

export function isCharacterWorkflow(workflow) {
  return getWorkflowDomainType(workflow) === DOMAIN_TYPES.CHARACTER;
}

export function isUploadWorkflow(workflow) {
  return getWorkflowDomainType(workflow) === DOMAIN_TYPES.UPLOAD;
}

export function isGenerationWorkflow(workflow) {
  return getWorkflowDomainType(workflow) === DOMAIN_TYPES.GENERATION;
}

export function normalizeMediaStatus(status, url) {
  const value = String(status || "").trim().toLowerCase();
  if (value === MEDIA_STATUS.SUCCESS || value === "completed" || value === "complete") return MEDIA_STATUS.SUCCESS;
  if (value === MEDIA_STATUS.FAILED || value === "error") return MEDIA_STATUS.FAILED;
  if (value === MEDIA_STATUS.PENDING) return MEDIA_STATUS.PENDING;
  if (value === MEDIA_STATUS.PROCESSING) return MEDIA_STATUS.PROCESSING;
  return url ? MEDIA_STATUS.SUCCESS : MEDIA_STATUS.PROCESSING;
}

export function normalizeWorkflow(workflow) {
  if (!workflow) return workflow;
  const workflow_type = getWorkflowDomainType(workflow);
  return { ...workflow, workflow_type };
}

export function normalizeMedia(media) {
  if (!media) return media;
  return {
    ...media,
    status: normalizeMediaStatus(media.status, media.url || media.file_url),
  };
}

export function normalizeProjectContents(contents = {}) {
  return {
    ...contents,
    workflows: (contents.workflows || []).map(normalizeWorkflow),
    media: (contents.media || []).map(normalizeMedia),
    elements: contents.elements || [],
    characters: contents.characters || [],
  };
}

export function normalizeProjectData(data) {
  if (!data?.projectContents) return data;
  return {
    ...data,
    projectContents: normalizeProjectContents(data.projectContents),
  };
}