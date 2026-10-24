import { api } from "@/shared/api/client";
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
  validateCreate({ name, projectId, project_id }) {
    const pId = projectId || project_id;
    if (!pId) {
      throw new Error("projectId is required to create an element");
    }
    if (!name?.trim()) {
      throw new Error("Element name is required");
    }
  },

  /**
   * Format API payload for element creation (no sourceImages - creation is decoupled from image attachment).
   */
  buildCreatePayload({ name, description = "", elementType = "object", projectId, project_id }) {
    const pId = projectId || project_id;
    this.validateCreate({ name, projectId: pId });

    return {
      projectId: pId,
      project_id: pId,
      name: name.trim().replace(/^@+/, ""),
      description: description?.trim() || "",
      element_type: elementType,
      type: elementType,
    };
  },

  /**
   * Upload or attach a single reference image to an element via POST /v2/elements/:id/images.
   * Supports:
   * - File or Blob -> FormData with field 'file'
   * - Object with { file: File } -> FormData with field 'file'
   * - Object with { mediaId } -> JSON payload
   * - String or object with { imageUrl } -> JSON payload (legacy)
   */
  async addReferenceImage(elementId, item, { projectId } = {}) {
    if (!elementId) throw new Error("elementId is required to add an image");
    const pId = projectId || item?.projectId;

    const isFile = typeof File !== "undefined" && item instanceof File;
    const isBlob = !isFile && typeof Blob !== "undefined" && item instanceof Blob;
    const hasFileProp = item && typeof File !== "undefined" && item.file instanceof File;

    if (isFile || isBlob || hasFileProp) {
      const file = isFile || isBlob ? item : item.file;
      const formData = new FormData();
      formData.append("file", file);
      if (pId) formData.append("projectId", pId);
      return api.post(`/v2/elements/${elementId}/images`, formData);
    }

    if (item && item.mediaId) {
      return api.post(`/v2/elements/${elementId}/images`, { mediaId: item.mediaId, projectId: pId });
    }

    const payload = typeof item === "string" ? { imageUrl: item, projectId: pId } : { ...item, projectId: pId };
    return api.post(`/v2/elements/${elementId}/images`, payload);
  },

  /**
   * Upload or attach reference images to an element via canonical endpoint POST /v2/elements/:id/images.
   * Dispatches each item through addReferenceImage (FormData for Files, JSON mediaId for existing assets).
   */
  async attachImages(elementId, images = [], { projectId } = {}) {
    if (!elementId || !Array.isArray(images) || images.length === 0) {
      return [];
    }
    if (images.length > 6) {
      throw new Error("Maximum 6 reference images allowed per element");
    }
    const results = [];
    const errors = [];
    for (const img of images) {
      try {
        const res = await this.addReferenceImage(elementId, img, { projectId });
        results.push(res);
      } catch (err) {
        errors.push(err);
      }
    }
    if (results.length === 0 && errors.length > 0) {
      throw new Error(errors[0]?.message || "Failed to attach reference images to element");
    }
    return results;
  },

  /**
   * Explicitly set, switch, or clear the element cover / primary media via PATCH /v2/elements/:id.
   * Pass mediaId as a string to set, or null to clear.
   */
  async setElementCover(elementId, mediaId) {
    if (!elementId) {
      throw new Error("elementId is required to set element cover");
    }
    return api.patch(`/v2/elements/${elementId}`, { primaryMediaId: mediaId, coverMediaId: mediaId });
  },

  /**
   * Generic primary media setter alias for elements.
   */
  async setElementPrimaryMedia(elementId, mediaId) {
    return this.setElementCover(elementId, mediaId);
  },

  /**
   * Format API patch payload for element updates (partial).
   */
  buildPatchPayload({ name, description, guidelines, elementType, primaryMediaId }) {
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
    if (primaryMediaId !== undefined) {
      payload.primaryMediaId = primaryMediaId;
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
   * Remove a single reference image from an element via the canonical endpoint
   * DELETE /v2/elements/:elementId/images/:mediaId.
   * This only removes the association; the media row is deleted only when no
   * associations remain anywhere (orphan cleanup handled server-side).
   */
  async removeImage(elementId, mediaId) {
    if (!elementId) throw new Error("elementId is required to remove an element image");
    if (!mediaId) throw new Error("mediaId is required to remove an element image");
    return api.delete(`/v2/elements/${elementId}/images/${mediaId}`);
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
      primaryMediaId: res.workflow?.primary_media_id || res.primary_media_id || null,
      primaryMediaUrl: res.element?.primary_media_url || res.primary_media_url,
    };
  },
};

export default elementService;
