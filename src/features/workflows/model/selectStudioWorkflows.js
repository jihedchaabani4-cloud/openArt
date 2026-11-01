import { resolveMainMedia } from "@/features/workflows/core/resolveMediaRef";
import { getGenerationConfig } from "@/shared/lib/referenceUtils";

/**
 * Indexes media items by workflow ID.
 * Supports both canonical workflow ID and prefixed 'workflows/<id>' format.
 *
 * @param {Array} media
 * @returns {Record<string, Array>}
 */
export function groupMediaByWorkflow(media = []) {
  const map = {};
  for (const m of media) {
    const wfId = m.workflowId || m.workflow_id || m.workflowName;
    if (!wfId) continue;
    (map[wfId] ??= []).push(m);
    const cleanId = String(wfId).replace(/^workflows\//, "");
    if (cleanId !== wfId) {
      (map[cleanId] ??= []).push(m);
    }
  }
  return map;
}

/**
 * Resolves generation configuration, model, and upload status for a workflow.
 *
 * @param {Array} wfItems
 * @returns {{ config: Object, model: string, isUpload: boolean }}
 */
export function resolveConfig(wfItems = []) {
  const sortedItems = [...wfItems].sort(
    (a, b) =>
      new Date(b.metadata?.createTime || b.create_time || 0) -
      new Date(a.metadata?.createTime || a.create_time || 0)
  );

  const caeItem = sortedItems.find((i) => i.workflowStepId === "CAE");
  const latestEditItem = sortedItems.find(
    (i) => i.generationConfig || i.mediaMetadata?.requestData
  );
  const firstMedia = sortedItems[0] || {};

  const sourceItem = caeItem || latestEditItem || firstMedia;
  const config = getGenerationConfig(sourceItem) || {};
  const model = config.model_name || config.model || "";
  const isUpload =
    !model &&
    !config.prompt &&
    (sourceItem.asset_type === "upload" ||
      sourceItem.asset_id ||
      sourceItem.workflowStepId === "upload");

  return {
    config: {
      ...config,
      references: config.references || [],
    },
    model,
    isUpload,
  };
}

/**
 * Unified Studio Workflow Selector.
 * Single source of truth for workflow filtering, searching, and sorting across all Cinema Studio pages.
 *
 * Predictable filtering pipeline:
 * 1. Data source selection (active workflows vs trashed workflows)
 * 2. Type filtering ('all', 'generation', 'upload', 'element', 'character', etc.)
 * 3. Search (case-insensitive across workflow title, prompt, description, guidelines)
 * 4. Favorites / Liked
 * 5. Media types / models (if provided in filters)
 * 6. Sorting (newest vs oldest)
 *
 * @param {Object} projectContents - projectContents from useProjectData
 * @param {Object} [options]
 * @param {string} [options.type='all'] - 'all' | 'generation' | 'upload' | 'element' | 'character' | string
 * @param {string} [options.domain] - Legacy alias for 'assets' | 'elements' | 'characters' | 'trash'
 * @param {string} [options.lifecycle='active'] - 'active' | 'trash'
 * @param {string} [options.search=''] - Search term
 * @param {boolean} [options.liked=false] - Filter by favorites
 * @param {string} [options.sort='newest'] - 'newest' | 'oldest'
 * @param {Object} [options.filters={}] - Extended filters object
 * @param {boolean} [options.showUploaded=true] - Whether to include uploads when filtering assets
 * @returns {Array} Filtered and decorated workflows
 */
export function selectStudioWorkflows(projectContents, options = {}) {
  if (!projectContents || typeof projectContents !== "object") {
    return [];
  }

  const {
    type: propType,
    domain,
    lifecycle: propLifecycle,
    search: propSearch,
    liked: propLiked,
    sort: propSort,
    filters = {},
    showUploaded = true,
  } = options;

  // Resolve lifecycle (Trash vs Active)
  const isTrashLifecycle =
    propLifecycle === "trash" ||
    domain === "trash" ||
    options.isTrash === true;

  // Resolve target type
  let targetType = propType;
  if (!targetType) {
    if (domain === "assets" || domain === "generations") {
      targetType = "generation_or_upload";
    } else if (domain === "elements") {
      targetType = "element";
    } else if (domain === "characters") {
      targetType = "character";
    } else {
      targetType = "all";
    }
  }

  // Resolve search query
  const rawSearch = propSearch ?? filters.prompt ?? options.prompt ?? "";
  const searchQuery = String(rawSearch).trim().toLowerCase();

  // Resolve liked / favorites
  const isLiked = Boolean(propLiked ?? filters.liked);

  // Resolve sort order
  const sortOrder = propSort || filters.sort || "newest";

  // ── 1. TRASH LIFECYCLE ─────────────────────────────────────────────────────
  if (isTrashLifecycle) {
    const rawTrash = projectContents.trashedWorkflows ?? [];
    let result = rawTrash.map((w) => ({
      ...w,
      id: w.id || w.name,
      name: w.name || w.id,
      display_name: w.display_name || w.metadata?.displayName || w.name || "Untitled Workflow",
      deleted_at: w.deleted_at || w.metadata?.deleted_at,
    }));

    if (searchQuery) {
      result = result.filter((w) => {
        const name = (w.display_name || w.name || "").toLowerCase();
        const type = (w.workflow_type || w.category || "").toLowerCase();
        const prompt = (
          w.generationConfig?.prompt ||
          w.items?.[0]?.generationConfig?.prompt ||
          w.metadata?.prompt ||
          w.prompt ||
          ""
        ).toLowerCase();
        const desc = (w.description || w.metadata?.description || "").toLowerCase();
        const guidelines = (w.guidelines || w.metadata?.guidelines || "").toLowerCase();

        return (
          name.includes(searchQuery) ||
          type.includes(searchQuery) ||
          prompt.includes(searchQuery) ||
          desc.includes(searchQuery) ||
          guidelines.includes(searchQuery)
        );
      });
    }

    result.sort((a, b) => {
      const tA = new Date(a.deleted_at || a.metadata?.createTime || 0).getTime();
      const tB = new Date(b.deleted_at || b.metadata?.createTime || 0).getTime();
      return sortOrder === "oldest" ? tA - tB : tB - tA;
    });

    return result;
  }

  // ── 2. ACTIVE LIFECYCLE ────────────────────────────────────────────────────
  const rawWorkflows = projectContents.workflows ?? [];
  const rawMedia = projectContents.media ?? [];
  const rawElements = projectContents.elements ?? [];
  const rawCharacters = projectContents.characters ?? [];

  const mediaByWorkflow = groupMediaByWorkflow(rawMedia);

  const elementMap = new Map();
  for (const e of rawElements) {
    if (e.workflow_id) elementMap.set(e.workflow_id, e);
    if (e.id) elementMap.set(e.id, e);
  }

  const characterMap = new Map();
  for (const c of rawCharacters) {
    if (c.workflow_id) characterMap.set(c.workflow_id, c);
    if (c.id) characterMap.set(c.id, c);
  }

  // Phase A: Decorate and classify each active workflow
  const decoratedWorkflows = rawWorkflows.map((wf) => {
    const wfId = wf.id || wf.name || "";
    const cleanWfId = String(wfId).replace(/^workflows\//, "");
    const primaryId =
      wf.primary_media_id || wf.primaryMediaId || wf.metadata?.primaryMediaId;

    let wfItems =
      (wf.items?.length > 0 ? wf.items : (wf.media?.length > 0 ? wf.media : null)) ??
      mediaByWorkflow[wf.name] ??
      mediaByWorkflow[wf.id] ??
      mediaByWorkflow[cleanWfId] ??
      [];

    if (wfItems.length === 0 && primaryId) {
      const matched = rawMedia.find((m) => (m.id || m.name) === primaryId);
      if (matched) wfItems = [matched];
    }

    const wTypeRaw = String(wf.workflow_type || wf.workflowType || "").toUpperCase();

    // 1. Element Workflow
    if (wTypeRaw === "ELEMENT_SHEET" || wTypeRaw === "ELEMENT") {
      const elem = elementMap.get(wf.id) || elementMap.get(wf.name) || wf.element || {};
      const status =
        wfItems[0]?.status || wf.status || (wfItems[0]?.url ? "success" : "processing");
      const rawGuidelines = elem.guidelines ?? wf.guidelines ?? wf.metadata?.guidelines ?? "";
      const cleanGuidelines = Array.isArray(rawGuidelines)
        ? rawGuidelines.join("\n")
        : String(rawGuidelines || "");

      return {
        ...wf,
        id: wf.name || wf.id,
        name: wf.name || wf.id,
        display_name: wf.display_name || wf.metadata?.displayName || wf.name || "Untitled Element",
        category: "element",
        element: elem,
        element_type: elem.element_type || "object",
        description: elem.description || "",
        guidelines: cleanGuidelines,
        items: wfItems,
        status,
        isMultiMedia: wfItems.length > 1,
        is_liked: !!wf.metadata?.favorited,
      };
    }

    // 2. Character Workflow
    if (wTypeRaw === "CHARACTER" || wTypeRaw === "CHARACTER_SHEET") {
      const char = characterMap.get(wf.id) || characterMap.get(wf.name) || wf.character || {};
      const characterWf = { ...wf, workflow_type: "CHARACTER" };
      const resolved = resolveMainMedia(characterWf, wfItems);
      const mainMedia = resolved?.raw || resolved || null;

      let status = "processing";
      if (resolved) {
        if (resolved.status === "failed") {
          status = "failed";
        } else if (resolved.status === "processing") {
          status = "processing";
        } else if (
          resolved.status === "ready" ||
          resolved.status === "completed" ||
          Boolean(resolved.url)
        ) {
          status = "completed";
        }
      }

      const primaryUrl =
        resolved?.url || mainMedia?.url || mainMedia?.file_url || wf.url || null;

      const charName = char.name || char.title || "";
      const charDesc = char.description || char.character_info || "";

      return {
        ...wf,
        id: wf.name || wf.id,
        name: wf.name || wf.id,
        display_name: wf.display_name || wf.metadata?.displayName || charName || wf.name || "Untitled Character",
        category: "character",
        character: char,
        character_name: charName,
        description: charDesc || wf.description || "",
        items: wfItems,
        mainMedia,
        primary_media_url: primaryUrl,
        status,
        isMultiMedia: wfItems.length > 1,
        is_liked: !!wf.metadata?.favorited,
      };
    }

    // 3. Generation or Upload Workflow
    const { config, isUpload: configIsUpload } = resolveConfig(wfItems);
    const isWfUpload =
      wTypeRaw === "UPLOAD" ||
      wf.type === "upload" ||
      wf.is_upload ||
      configIsUpload;

    const category = isWfUpload ? "upload" : "generation";

    return {
      ...wf,
      id: wf.name || wf.id,
      name: wf.name || wf.id,
      display_name: wf.display_name || wf.metadata?.displayName || wf.name || "Untitled Workflow",
      category,
      type: isWfUpload ? "upload" : "generation",
      items: wfItems.map((item) => ({
        ...item,
        asset_id: item.name || item.id,
        workflowStepId: item.workflowStepId || (isWfUpload ? "upload" : item.workflowStepId),
      })),
      isMultiMedia: wfItems.length > 1,
      is_liked: !!wf.metadata?.favorited,
      generationConfig: config,
    };
  });

  // Phase B: Filter by type
  let filtered = decoratedWorkflows.filter((wf) => {
    if (targetType === "all") return true;

    if (targetType === "generation_or_upload") {
      if (wf.category !== "generation" && wf.category !== "upload") return false;
      if (!showUploaded && wf.category === "upload") return false;
      return true;
    }

    if (targetType === "generation") return wf.category === "generation";
    if (targetType === "upload") return wf.category === "upload";
    if (targetType === "element") return wf.category === "element";
    if (targetType === "character") return wf.category === "character";

    // Custom workflow type matching
    const wType = String(wf.workflow_type || wf.workflowType || "").toLowerCase();
    return wType === targetType.toLowerCase() || wf.category === targetType.toLowerCase();
  });

  // Phase C: Filter by search query
  if (searchQuery) {
    filtered = filtered.filter((wf) => {
      const name = (wf.display_name || wf.name || "").toLowerCase();
      const prompt = (
        wf.generationConfig?.prompt ||
        wf.items?.[0]?.generationConfig?.prompt ||
        wf.items?.[0]?.metadata?.prompt ||
        wf.items?.[0]?.prompt ||
        wf.metadata?.prompt ||
        wf.prompt ||
        ""
      ).toLowerCase();
      const desc = (wf.description || wf.character?.description || wf.element?.description || "").toLowerCase();
      const guidelines = (wf.guidelines || wf.element?.guidelines || "").toLowerCase();
      const type = (wf.workflow_type || wf.workflowType || wf.category || "").toLowerCase();
      const elemType = (wf.element_type || "").toLowerCase();
      const charName = (wf.character_name || wf.character?.name || wf.character?.title || "").toLowerCase();

      return (
        name.includes(searchQuery) ||
        prompt.includes(searchQuery) ||
        desc.includes(searchQuery) ||
        guidelines.includes(searchQuery) ||
        type.includes(searchQuery) ||
        elemType.includes(searchQuery) ||
        charName.includes(searchQuery)
      );
    });
  }

  // Phase D: Filter by favorites / liked
  if (isLiked) {
    filtered = filtered.filter((wf) => wf.is_liked || wf.metadata?.favorited);
  }

  // Phase E: Filter by media type (image vs video)
  if (filters.types?.length > 0) {
    filtered = filtered.filter((wf) => {
      return wf.items?.some((m) => {
        const itemType = m.image ? "image" : m.video ? "video" : null;
        return filters.types.includes(itemType);
      });
    });
  }

  // Phase F: Filter by model
  if (filters.models?.length > 0) {
    filtered = filtered.filter((wf) => {
      const model = wf.generationConfig?.model || wf.generationConfig?.model_name;
      return filters.models.includes(model);
    });
  }

  // Phase G: Sort
  filtered.sort((a, b) => {
    const tA = new Date(a.metadata?.createTime || a.create_time || 0).getTime();
    const tB = new Date(b.metadata?.createTime || b.create_time || 0).getTime();
    return sortOrder === "oldest" ? tA - tB : tB - tA;
  });

  return filtered;
}
