// [FSD Layer: features/workflows/lib] — Single declarative source of truth for
// all Studio media, workflow, character, element, upload, collection & trash action rules.

import {
  areAllWorkflowMediaFailed,
  getWorkflowMediaItems,
  hasInFlightMedia,
  isMediaFailed,
  isMediaInFlight,
} from "./mediaStatusHelpers";

/**
 * Canonical entity type detector for workflows, media items, and collections.
 * Returns: "collection" | "character" | "element" | "upload" | "generation"
 *
 * @param {Object|null|undefined} workflow
 * @returns {"collection"|"character"|"element"|"upload"|"generation"}
 */
export function getWorkflowEntityType(workflow) {
  if (!workflow) return "generation";
  if (
    workflow.type === "collection" ||
    workflow.itemType === "collection" ||
    workflow.entity_type === "collection" ||
    workflow.entity_type === "folder" ||
    Boolean(workflow.is_collection) ||
    Boolean(workflow.is_folder)
  ) {
    return "collection";
  }
  const wType = String(workflow.workflow_type || workflow.workflowType || "").toUpperCase();
  if (
    wType === "CHARACTER" ||
    wType === "CHARACTER_SHEET" ||
    Boolean(workflow.is_character) ||
    workflow.entity_type === "character" ||
    Boolean(workflow.characterId) ||
    Boolean(workflow.character)
  ) {
    return "character";
  }
  if (
    wType === "ELEMENT" ||
    wType === "ELEMENT_SHEET" ||
    Boolean(workflow.is_element) ||
    workflow.entity_type === "element" ||
    Boolean(workflow.elementId) ||
    Boolean(workflow.element)
  ) {
    return "element";
  }
  if (wType === "UPLOAD" || workflow.feed_type === "upload") {
    return "upload";
  }
  return "generation";
}

/**
 * Resolves the canonical 4-state media lifecycle:
 * "uploading" | "processing" | "failed" | "completed"
 *
 * @param {Object} [params]
 * @param {string|null} [params.status]
 * @param {Object|null} [params.workflow]
 * @param {Object|null} [params.item]
 * @returns {"uploading"|"processing"|"failed"|"completed"}
 */
export function resolveMediaLifecycle({
  status = null,
  workflow = null,
  item = null,
} = {}) {
  if (isMediaInFlight(status) || hasInFlightMedia(workflow, item)) {
    const candidates = [
      status,
      item?.raw?.status,
      item?.status,
      item?.media_status,
      item?.mediaStatus,
      workflow?.raw?.status,
      workflow?.status,
      workflow?.media_status,
      workflow?.mediaStatus,
      ...getWorkflowMediaItems(workflow).flatMap((m) => [m?.raw?.status, m?.status]),
    ];
    const isUploading = candidates.some(
      (s) => typeof s === "string" && s.trim().toLowerCase() === "uploading"
    );
    return isUploading ? "uploading" : "processing";
  }

  if (isMediaFailed(status) || areAllWorkflowMediaFailed(workflow, item)) {
    return "failed";
  }

  return "completed";
}

const ALL_DENIED = Object.freeze({
  navigate: false,
  select: false,
  drag: false,
  openMenu: false,
  like: false,
  reusePrompt: false,
  animate: false,
  addToPrompt: false,
  addFrame: false,
  download: false,
  rename: false,
  details: false,
  publishYoutube: false,
  setCover: false,
  report: false,
  delete: false,
  restore: false,
  openInNewTab: false,
  createSubfolder: false,
  edit: false,
  move: false,
  setColor: false,
});

const ALL_ALLOWED = Object.freeze(
  Object.fromEntries(Object.keys(ALL_DENIED).map((key) => [key, true]))
);

/**
 * Lifecycle gate table — intersected with ENTITY_ACTION_RULES.
 * - uploading / processing: ZERO actions allowed (wait until finished).
 * - failed: ONLY select, openMenu, reusePrompt, delete (permanent).
 * - completed: all gates open (entity table decides which apply).
 */
export const STATUS_ACTION_RULES = Object.freeze({
  uploading: Object.freeze({ ...ALL_DENIED, deleteMode: "none" }),
  processing: Object.freeze({ ...ALL_DENIED, deleteMode: "none" }),
  failed: Object.freeze({
    ...ALL_DENIED,
    select: true,
    openMenu: true,
    reusePrompt: true,
    delete: true,
    deleteMode: "permanent",
  }),
  completed: Object.freeze({ ...ALL_ALLOWED, deleteMode: "trash" }),
});

const GENERATION_BASE = {
  ...ALL_DENIED,
  navigate: true,
  select: true,
  drag: true,
  openMenu: true,
  like: true,
  reusePrompt: true,
  animate: true,
  addToPrompt: true,
  addFrame: true,
  download: true,
  rename: true,
  details: true,
  publishYoutube: true,
  setCover: true,
  report: true,
  delete: true,
  deleteMode: null,
};

const ENTITY_SHEET_BASE = {
  ...ALL_DENIED,
  navigate: true,
  select: true,
  drag: false,
  openMenu: true,
  like: true,
  reusePrompt: true,
  animate: false,
  addToPrompt: true,
  addFrame: false,
  download: true,
  rename: true,
  details: true,
  publishYoutube: false,
  setCover: true,
  report: false,
  delete: true,
  deleteMode: null,
};

/**
 * Entity capability table — intersected with STATUS_ACTION_RULES and contextual constraints.
 */
export const ENTITY_ACTION_RULES = Object.freeze({
  generation: Object.freeze({ ...GENERATION_BASE }),
  upload: Object.freeze({ ...GENERATION_BASE, reusePrompt: false }),
  character: Object.freeze({ ...ENTITY_SHEET_BASE }),
  element: Object.freeze({ ...ENTITY_SHEET_BASE }),
  collection: Object.freeze({
    ...ALL_DENIED,
    navigate: true,
    select: true,
    drag: true,
    openMenu: true,
    like: true,
    download: true,
    openInNewTab: true,
    createSubfolder: true,
    edit: true,
    move: true,
    setColor: true,
    delete: true,
    deleteMode: "folder",
  }),
  trash: Object.freeze({
    ...ALL_DENIED,
    navigate: true,
    select: true,
    openMenu: true,
    restore: true,
    delete: true,
    deleteMode: "permanent",
  }),
});

function resolveEntityType({ entityType, workflow, item, isTrash }) {
  if (isTrash || entityType === "trash") return "trash";
  if (entityType === "folder") return "collection";
  if (entityType && ENTITY_ACTION_RULES[entityType]) return entityType;
  return getWorkflowEntityType(workflow || item);
}

/**
 * Resolves the full action capability matrix for any Studio card, menu, or handler
 * by intersecting STATUS_ACTION_RULES, ENTITY_ACTION_RULES, and contextual constraints.
 */
export function resolveStudioActions({
  entityType = null,
  workflow = null,
  item = null,
  status = null,
  isVideo = false,
  isTrash = false,
  isFrameMode = false,
  hasUrl = true,
  hasReusablePrompt = true,
  showReuse = true,
  canModelAcceptEntity = true,
  isSelectionMode = false,
  isSelected = false,
} = {}) {
  const resolvedEntityType = resolveEntityType({ entityType, workflow, item, isTrash });
  const lifecycle = resolveMediaLifecycle({ status, workflow, item });
  const statusRule = STATUS_ACTION_RULES[lifecycle];
  const entityRule = ENTITY_ACTION_RULES[resolvedEntityType];

  const isInFlight = lifecycle === "uploading" || lifecycle === "processing";
  const isFailed = lifecycle === "failed";
  const isCompleted = lifecycle === "completed";

  const deleteMode =
    statusRule.deleteMode === "none"
      ? "none"
      : entityRule.deleteMode || statusRule.deleteMode;

  const isMediaEntity =
    resolvedEntityType !== "collection" && resolvedEntityType !== "trash";
  const hasMediaUrl = isMediaEntity ? Boolean(hasUrl) : true;
  const allowSingleAction = !isSelectionMode;
  // Failed media has no generated primary media (showReuse=false), yet prompt reuse stays allowed.
  const allowPromptReuse =
    Boolean(hasReusablePrompt) && (isFailed ? true : Boolean(showReuse));

  const gate = (key) => Boolean(statusRule[key] && entityRule[key]);

  const can = {
    navigate: gate("navigate") && allowSingleAction,
    select: gate("select"),
    drag: gate("drag") && hasMediaUrl && (!isSelectionMode || Boolean(isSelected)),
    openMenu: gate("openMenu") && (!isSelectionMode || Boolean(isSelected)),
    like: gate("like") && allowSingleAction,
    reusePrompt: gate("reusePrompt") && allowSingleAction && allowPromptReuse,
    animate: gate("animate") && allowSingleAction && !isVideo && !isFrameMode && hasMediaUrl,
    addToPrompt:
      gate("addToPrompt") &&
      allowSingleAction &&
      !isVideo &&
      !isFrameMode &&
      hasMediaUrl &&
      Boolean(canModelAcceptEntity),
    addFrame:
      gate("addFrame") &&
      allowSingleAction &&
      !isVideo &&
      Boolean(isFrameMode) &&
      hasMediaUrl &&
      Boolean(canModelAcceptEntity),
    download: gate("download") && allowSingleAction && hasMediaUrl,
    rename: gate("rename") && allowSingleAction,
    details: gate("details") && allowSingleAction,
    publishYoutube: gate("publishYoutube") && allowSingleAction && Boolean(isVideo) && hasMediaUrl,
    setCover: gate("setCover") && allowSingleAction && hasMediaUrl,
    report: gate("report") && allowSingleAction,
    delete: gate("delete") && allowSingleAction,
    restore: gate("restore") && allowSingleAction,
    openInNewTab: gate("openInNewTab") && allowSingleAction,
    createSubfolder: gate("createSubfolder") && allowSingleAction,
    edit: gate("edit") && allowSingleAction,
    move: gate("move") && allowSingleAction,
    setColor: gate("setColor") && allowSingleAction,
  };

  return {
    entityType: resolvedEntityType,
    lifecycle,
    isInFlight,
    isFailed,
    isCompleted,
    deleteMode,
    can,
  };
}

/**
 * Resolves bulk selection action capabilities across workspace scopes and Trash.
 */
export function resolveBulkActionRules({
  scope = "assets",
  workflowEntries = [],
  collectionEntries = [],
} = {}) {
  const isTrash = scope === "trash";
  const hasCollections = collectionEntries.length > 0;
  const actionableWorkflowEntries = workflowEntries.filter(
    (entry) =>
      resolveStudioActions({
        workflow: entry?.workflow,
        item: entry?.item,
        status: entry?.status,
        isTrash,
      }).isCompleted
  );
  const hasActionableWorkflows = actionableWorkflowEntries.length > 0;

  return {
    actionableWorkflowEntries,
    hasActionableWorkflows,
    canDownload: !isTrash && (hasCollections || hasActionableWorkflows),
    canMove: (scope === "assets" || scope === "collection") && (hasCollections || hasActionableWorkflows),
    canLike: !isTrash && !hasCollections && hasActionableWorkflows,
    canAddToPrompt: !isTrash && !hasCollections && hasActionableWorkflows,
    canRestore: isTrash && workflowEntries.length > 0,
    canDelete: workflowEntries.length > 0 || collectionEntries.length > 0,
  };
}
