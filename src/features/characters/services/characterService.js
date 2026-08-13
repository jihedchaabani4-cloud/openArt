/**
 * [FSD Layer: features/characters/services]
 * Standalone Frontend Character Service.
 * Owns character domain validation and API payload formatting.
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
  buildCreatePayload({ name, prompt, references = [], projectId }) {
    this.validateCreate({ name, prompt, projectId });

    return {
      project_id: projectId,
      name: name?.trim() || prompt?.slice(0, 40) || "Untitled Character",
      prompt: prompt?.trim() || "",
      references: Array.isArray(references) ? references : [],
    };
  },
};

export default characterService;

