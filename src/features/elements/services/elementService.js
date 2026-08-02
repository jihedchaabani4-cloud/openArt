import { WORKFLOW_TYPES, MEDIA_STATUS } from "@/shared/constants/workflowTypes";

/**
 * [FSD Layer: features/elements/services]
 * Standalone Frontend Element Service.
 * Owns all element domain business logic, validation, reference images formatting,
 * and optimistic model creation.
 */
export const elementService = {
  /**
   * Validate inputs before sending element creation request.
   */
  validateCreate({ name, sourceImages, projectId }) {
    if (!projectId) {
      throw new Error("project_id is required to create an element");
    }
    if (!name?.trim()) {
      throw new Error("Element name is required");
    }
    if (!Array.isArray(sourceImages) || sourceImages.length === 0) {
      throw new Error("At least 1 reference image is required");
    }
  },

  /**
   * Format API payload for element creation.
   */
  buildCreatePayload({ name, sourceImages, description = "", elementType = "object", tags = [], projectId }) {
    this.validateCreate({ name, sourceImages, projectId });

    return {
      project_id: projectId,
      name: name.trim(),
      sourceImages,
      description: description?.trim() || "",
      element_type: elementType,
      tags: tags || [],
    };
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
