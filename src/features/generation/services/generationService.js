import { WORKFLOW_TYPES, MEDIA_STATUS } from "@/shared/constants/workflowTypes";

/**
 * [FSD Layer: features/generation/services]
 * Standalone Frontend Generation Service.
 * Owns all image & video generation prompt validation, parameter formatting,
 * and optimistic model creation.
 */
export const generationService = {
  /**
   * Validate inputs before sending AI generation request.
   */
  validateGenerate({ prompt, projectId }) {
    if (!projectId) {
      throw new Error("project_id is required to trigger generation");
    }
    if (!prompt?.trim()) {
      throw new Error("Prompt description is required");
    }
  },

  /**
   * Format API payload for image or video generation.
   */
  buildGeneratePayload({
    prompt,
    model = "nanobana_pro",
    aspectRatio = "1:1",
    references = [],
    isKeyframe = false,
    quality = "2K",
    count = 1,
    projectId,
    sessionId = null,
  }) {
    this.validateGenerate({ prompt, projectId });

    return {
      project_id: projectId,
      session_id: sessionId,
      prompt: prompt.trim(),
      model,
      aspect_ratio: aspectRatio,
      references: references || [],
      is_keyframe: isKeyframe,
      quality,
      count: count || 1,
      workflow_type: WORKFLOW_TYPES.GENERATION,
    };
  },

  /**
   * Build optimistic workflow object for 0ms UI update.
   */
  buildOptimisticWorkflow({ tempId, projectId, prompt }) {
    return {
      id: tempId,
      name: tempId,
      projectId,
      workflow_type: WORKFLOW_TYPES.GENERATION,
      metadata: {
        displayName: prompt?.trim()?.slice(0, 60) || "Untitled Generation",
        createTime: new Date().toISOString(),
        favorited: false,
      },
    };
  },

  /**
   * Build optimistic media placeholder item.
   */
  buildOptimisticMedia({ tempId, projectId, isVideo = false }) {
    return {
      id: `${tempId}-media`,
      workflowId: tempId,
      projectId,
      status: MEDIA_STATUS.PROCESSING,
      stepId: isVideo ? "VID" : "GEN",
      url: null,
    };
  },
};

export default generationService;
