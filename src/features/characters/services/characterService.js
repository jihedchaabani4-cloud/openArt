import { WORKFLOW_TYPES, MEDIA_STATUS } from "@/shared/constants/workflowTypes";

/**
 * [FSD Layer: features/characters/services]
 * Standalone Frontend Character Service.
 * Owns all character domain business logic, validation, payload formatting,
 * and optimistic model creation.
 */
export const characterService = {
  /**
   * Validate inputs before sending character creation request.
   */
  validateCreate({ name, prompt, projectId }) {
    if (!projectId) {
      throw new Error("project_id is required to create a character");
    }
    if (!name?.trim() && !prompt?.trim()) {
      throw new Error("Character name or prompt description is required");
    }
  },

  /**
   * Format API payload for character creation.
   */
  buildCreatePayload({ name, prompt, references = [], style = "realistic", projectId }) {
    this.validateCreate({ name, prompt, projectId });

    return {
      project_id: projectId,
      name: name?.trim() || prompt?.slice(0, 40) || "Untitled Character",
      prompt: prompt?.trim() || "",
      references: references || [],
      style: style || "realistic",
    };
  },

  /**
   * Build optimistic workflow object for 0ms UI update.
   */
  buildOptimisticWorkflow({ tempId, projectId, name, prompt }) {
    return {
      id: tempId,
      name: tempId,
      projectId,
      workflow_type: WORKFLOW_TYPES.CHARACTER,
      metadata: {
        displayName: name?.trim() || prompt?.slice(0, 40) || "Untitled Character",
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
      stepId: "character_sheet",
      url: null,
    };
  },

  /**
   * Transform API response to canonical character domain format.
   */
  transformResponse(res) {
    return {
      runId: res.runId,
      workflowId: res.v1WorkflowId || res.workflowId || res.id,
      mediaId: res.v1MediaId || res.mediaId,
      projectId: res.projectId,
    };
  },
};

export default characterService;
