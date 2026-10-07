import { api } from "@/shared/api/client";

/**
 * [FSD Layer: features/characters/services]
 * Standalone Frontend Character Service.
 * Owns all character domain business logic, validation, API communication,
 * optimistic cache models, and media upload/download helpers.
 */
export const characterService = {
  // ── Validation ─────────────────────────────────────────────────────────────

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

  // ── Payload & Cache Builders ───────────────────────────────────────────────

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

  /**
   * Build optimistic workflow container for instant 0ms UI response.
   */
  buildOptimisticWorkflow({ id, name, prompt, projectId }) {
    return {
      id,
      name: id,
      projectId,
      workflow_type: "CHARACTER",
      metadata: {
        displayName: name || prompt || "Untitled Character",
        createTime: new Date().toISOString(),
        favorited: false,
      },
    };
  },

  /**
   * Build optimistic media row placeholder.
   */
  buildOptimisticMedia({ id, workflowId, projectId, prompt }) {
    return {
      id: `${id}-sheet`,
      name: `${id}-sheet`,
      url: null,
      status: "pending",
      projectId,
      workflowId,
      workflowStepId: "character_sheet",
      step_id: "character_sheet",
      mediaMetadata: {
        createTime: new Date().toISOString(),
        visibility: "PRIVATE",
      },
      generationConfig: {
        prompt,
      },
    };
  },

  /**
   * Build optimistic character row.
   */
  buildOptimisticCharacter({ id, workflowId, projectId, name, prompt }) {
    return {
      id,
      workflow_id: workflowId || id,
      project_id: projectId,
      name: name || "Untitled Character",
      title: name || "Untitled Character",
      description: prompt || "",
      character_info: prompt || "",
    };
  },

  // ── API Operations ─────────────────────────────────────────────────────────

  /**
   * Create a new character workflow + entity
   */
  async createCharacter(payload) {
    const res = await api.post("/characters/create", payload);
    if (res?.error) throw new Error(res.message || "Character creation failed");
    return res;
  },

  /**
   * Update character fields (name, description, character_info, etc.)
   */
  async updateCharacter(characterId, characterData) {
    const cleanId = String(characterId || "").replace(/^workflows\//, "");
    const res = await api.patch(`/characters/${cleanId}`, characterData);
    if (res && res.ok === false) throw new Error(res.message || "Failed to update character");
    return res;
  },

  /**
   * Delete character workflow and associated data
   */
  async deleteCharacter(characterId) {
    const cleanId = String(characterId || "").replace(/^workflows\//, "");
    const res = await api.delete(`/characters/${cleanId}`);
    return res;
  },

  /**
   * Set or upload character turnaround sheet media.
   * Accepts: raw File (via FormData), dataUrl, external imageUrl, or mediaId.
   */
  async setSheetMedia({ characterId, mediaId, imageUrl, file, formData, projectId }) {
    const cleanId = String(characterId || "").replace(/^workflows\//, "");
    let body;
    if (typeof FormData !== "undefined" && (formData instanceof FormData || file instanceof FormData)) {
      body = formData || file;
    } else if (file) {
      body = new FormData();
      body.append("file", file);
      if (projectId) body.append("projectId", projectId);
    } else {
      body = { mediaId, imageUrl, projectId };
    }

    const res = await api.post(`/characters/${cleanId}/sheet-media`, body);
    if (res && res.ok === false) throw new Error(res.message || "Failed to update character body sheet");
    return res;
  },

  /**
   * Attach a detail reference image to the character.
   * Accepts: raw File (via FormData), dataUrl, external imageUrl, or mediaId.
   */
  async addDetailMedia({ characterId, mediaId, imageUrl, file, formData, projectId }) {
    const cleanId = String(characterId || "").replace(/^workflows\//, "");
    let body;
    if (typeof FormData !== "undefined" && (formData instanceof FormData || file instanceof FormData)) {
      body = formData || file;
    } else if (file) {
      body = new FormData();
      body.append("file", file);
      if (projectId) body.append("projectId", projectId);
    } else {
      body = { mediaId, imageUrl, projectId };
    }

    const res = await api.post(`/characters/${cleanId}/media`, body);
    if (res && res.ok === false) throw new Error(res.message || "Failed to add detail image");
    return res;
  },

  /**
   * Remove a detail reference image from character
   */
  async removeDetailMedia({ characterId, mediaId }) {
    const cleanId = String(characterId || "").replace(/^workflows\//, "");
    const res = await api.delete(`/characters/${cleanId}/media/${mediaId}`);
    return res;
  },

  /**
   * Generate or re-generate turnaround sheet via AI worker
   */
  async generateSheet({ characterId, prompt, references, projectId }) {
    const cleanId = String(characterId || "").replace(/^workflows\//, "");
    const res = await api.post(`/characters/${cleanId}/generate-sheet`, {
      prompt,
      references,
      projectId,
    });
    if (!res?.ok) throw new Error(res.message || "Failed to generate character sheet");
    return res;
  },

  /**
   * Generate character prompt description using AI Art Director
   */
  async generateDescription({ concept, archetype, style }) {
    const res = await api.post("/characters/generate-description", { concept, archetype, style });
    if (res?.error) throw new Error(res.message || "Failed to generate character description");
    return res;
  },

  // ── Media Utilities ────────────────────────────────────────────────────────

  /**
   * Download image helper with automatic blob conversion and safe filename
   */
  async downloadImage({ url, filename = "character_sheet.png" }) {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objUrl);
    } catch (err) {
      console.error("Failed to download character image:", err);
      window.open(url, "_blank");
    }
  },
};

export default characterService;
