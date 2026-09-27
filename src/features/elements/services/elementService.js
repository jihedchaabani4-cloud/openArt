import { WORKFLOW_TYPES, MEDIA_STATUS } from "@/shared/constants/workflowTypes";

/**
 * [FSD Layer: features/elements/services]
 * Standalone Frontend Element Service.
 * Canonical owner of all element domain logic, payload formatting,
 * client-side file reading, and data normalization.
 */
export const elementService = {
  /**
   * Validate inputs before sending element creation request.
   */
  validateCreate({ name, sourceImages, projectId, project_id }) {
    const pId = projectId || project_id;
    if (!pId) {
      throw new Error("projectId is required to create an element");
    }
    if (!name?.trim()) {
      throw new Error("Element name is required");
    }
    if (!Array.isArray(sourceImages) || sourceImages.length === 0) {
      throw new Error("At least 1 reference image is required");
    }
    if (sourceImages.length > 6) {
      throw new Error("Maximum 6 reference images allowed");
    }
  },

  /**
   * Format API payload for element creation.
   */
  buildCreatePayload({ name, sourceImages, description = "", elementType = "object", projectId, project_id }) {
    const pId = projectId || project_id;
    this.validateCreate({ name, sourceImages, projectId: pId });

    return {
      projectId: pId,
      project_id: pId,
      name: name.trim().replace(/^@+/, ""),
      sourceImages,
      description: description?.trim() || "",
      element_type: elementType,
      type: elementType,
    };
  },

  /**
   * Format API patch payload for element updates (partial).
   */
  buildPatchPayload({ name, description, guidelines, elementType }) {
    const payload = {};
    if (name !== undefined) {
      payload.name = String(name || "").trim().replace(/^@+/, "");
    }
    if (description !== undefined) {
      payload.description = description == null ? null : String(description).trim();
    }
    if (guidelines !== undefined) {
      payload.guidelines = typeof guidelines === "string" ? guidelines.trim() : String(guidelines || "").trim();
    }
    if (elementType !== undefined) {
      payload.element_type = elementType;
    }
    return payload;
  },

  /**
   * Client-side helper: convert a single File to a Base64 Data URL.
   */
  async readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Client-side helper: convert multiple Files to Base64 Data URLs.
   */
  async readFilesAsDataUrls(files) {
    const results = await Promise.all(
      Array.from(files).map((f) =>
        this.readFileAsDataUrl(f).catch(() => null)
      )
    );
    return results.filter(Boolean);
  },

  /**
   * Normalize an element name (removes leading '@' and trims).
   */
  cleanElementName(raw) {
    return String(raw || "").replace(/^@+/, "").trim();
  },

  /**
   * Clean workflow ID or name (removes 'workflows/' prefix).
   */
  cleanWorkflowId(id) {
    return String(id || "").replace(/^workflows\//, "");
  },

  /**
   * Build optimistic workflow object for 0ms UI update.
   */
  buildOptimisticWorkflow({ tempId, projectId, name }) {
    return {
      id: tempId,
      name: tempId,
      projectId,
      workflow_type: WORKFLOW_TYPES.ELEMENT,
      metadata: {
        displayName: name?.trim() || "Untitled Element",
        createTime: new Date().toISOString(),
        favorited: false,
      },
    };
  },

  /**
   * Build optimistic media placeholder item.
   */
  buildOptimisticMedia({ tempId, projectId }) {
    return {
      id: `${tempId}-media`,
      workflowId: tempId,
      projectId,
      status: MEDIA_STATUS.PROCESSING,
      stepId: "CAE",
      url: null,
    };
  },

  /**
   * Transform API response to canonical element domain format.
   */
  transformResponse(res) {
    return {
      elementId: res.element?.id || res.id,
      workflowId: res.element?.workflow_id || res.workflow_id || res.id,
      primaryMediaId: res.element?.primary_media_id,
      primaryMediaUrl: res.element?.primary_media_url || res.primary_media_url,
    };
  },
};

export default elementService;
