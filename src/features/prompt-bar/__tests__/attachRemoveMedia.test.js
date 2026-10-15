/**
 * T5: attachMedia and removeMedia Commands & Store Actions Tests
 *
 * Store-level tests (no React) verifying pure media attachment and removal.
 */

import { describe, it, expect, vi } from "vitest";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import {
  normalizedFramesModel,
  normalizedImagesListModel,
} from "./fixtures/models.fixture.js";
import { REASONS } from "../core/commandResult.js";

describe("T5: attachMedia & removeMedia Commands", () => {
  const modelsMap = {
    [normalizedFramesModel.id]: normalizedFramesModel,
    [normalizedImagesListModel.id]: normalizedImagesListModel,
  };

  function createTestStore(overrides = {}) {
    return createPromptBarStore(
      {
        modelsMap,
        selectedModelId: normalizedFramesModel.id,
        activeMode: "video",
        activeSubMode: "frames",
        ...overrides,
      },
      {
        template: generatedMediaTemplate,
      }
    );
  }

  describe("attachMedia", () => {
    it("on frames model: start writes input_image, end writes last_frame", () => {
      const store = createTestStore();
      const listener = vi.fn();
      store.subscribe(listener);

      // Attach start frame
      const resStart = store.getState().attachMedia({
        role: "start",
        value: { workflow_id: "wf_start_1", url: "https://example.com/start.png" },
      });

      expect(resStart.ok).toBe(true);
      expect(store.getState().parameterValues.input_image).toEqual(
        expect.objectContaining({ workflow_id: "wf_start_1" })
      );
      expect(listener).toHaveBeenCalledTimes(1);

      // Attach end frame
      const resEnd = store.getState().attachMedia({
        role: "end",
        value: { workflow_id: "wf_end_1", url: "https://example.com/end.png" },
      });

      expect(resEnd.ok).toBe(true);
      expect(store.getState().parameterValues.last_frame).toEqual(
        expect.objectContaining({ workflow_id: "wf_end_1" })
      );
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("on images-list model: reference appends to images array", () => {
      const store = createTestStore({
        selectedModelId: normalizedImagesListModel.id,
        activeMode: "image",
        activeSubMode: "frames",
      });

      const res1 = store.getState().attachMedia({
        role: "reference",
        value: { workflow_id: "ref_1", url: "https://example.com/ref1.png" },
      });
      expect(res1.ok).toBe(true);
      expect(store.getState().parameterValues.images).toHaveLength(1);
      expect(store.getState().parameterValues.images[0].workflow_id).toBe("ref_1");

      const res2 = store.getState().attachMedia({
        role: "reference",
        value: { workflow_id: "ref_2", url: "https://example.com/ref2.png" },
      });
      expect(res2.ok).toBe(true);
      expect(store.getState().parameterValues.images).toHaveLength(2);
      expect(store.getState().parameterValues.images[1].workflow_id).toBe("ref_2");
    });

    it("returns fail(NO_SLOT_FOR_ROLE) if role does not exist in current mode", () => {
      const store = createTestStore({
        activeMode: "image",
      });

      const res = store.getState().attachMedia({
        role: "end", // image mode does not have "end" slot
        value: { workflow_id: "wf_end" },
      });

      expect(res.ok).toBe(false);
      expect(res.reason).toBe(REASONS.NO_SLOT_FOR_ROLE);
      expect(store.getState().parameterValues.last_frame).toBeUndefined();
    });

    it("returns fail(DUPLICATE_MEDIA) and keeps state unchanged", () => {
      const store = createTestStore({
        selectedModelId: normalizedImagesListModel.id,
        activeMode: "image",
        parameterValues: {
          images: [{ workflow_id: "ref_existing" }],
        },
      });

      const res = store.getState().attachMedia({
        role: "reference",
        value: { workflow_id: "ref_existing" },
      });

      expect(res.ok).toBe(false);
      expect(res.reason).toBe(REASONS.DUPLICATE_MEDIA);
      expect(store.getState().parameterValues.images).toHaveLength(1);
    });

    it("returns fail(MAX_MEDIA_REACHED) when quota is exceeded", () => {
      // Create a model with max 1 image
      const singleImageModel = {
        id: "single_image_model",
        name: "Single Image Model",
        domain: "image",
        parameters: {
          images: { type: "image[]", max: 1 },
        },
      };

      const store = createPromptBarStore(
        {
          modelsMap: { [singleImageModel.id]: singleImageModel },
          selectedModelId: singleImageModel.id,
          activeMode: "image",
          parameterValues: {
            images: [{ workflow_id: "ref_one" }],
          },
        },
        { template: generatedMediaTemplate }
      );

      const res = store.getState().attachMedia({
        role: "reference",
        value: { workflow_id: "ref_two" },
      });

      expect(res.ok).toBe(false);
      expect(res.reason).toBe(REASONS.MAX_MEDIA_REACHED);
      expect(store.getState().parameterValues.images).toHaveLength(1);
    });

    it("returns fail(TYPE_NOT_ALLOWED) when attaching video to image-only slot", () => {
      const store = createTestStore({
        selectedModelId: normalizedImagesListModel.id,
        activeMode: "image",
      });

      const res = store.getState().attachMedia({
        role: "reference",
        value: { workflow_id: "vid_1", type: "video" },
      });

      expect(res.ok).toBe(false);
      expect(res.reason).toBe(REASONS.TYPE_NOT_ALLOWED);
    });
  });

  describe("removeMedia", () => {
    it("removes single parameter value and cleans its tag from prompt", () => {
      const store = createTestStore({
        prompt: "A drone shot starting from <media:start_123> zooming out",
        parameterValues: {
          input_image: { workflow_id: "start_123" },
          aspect_ratio: "16:9",
        },
      });

      const listener = vi.fn();
      store.subscribe(listener);

      const res = store.getState().removeMedia({ role: "start" });

      expect(res.ok).toBe(true);
      expect(store.getState().parameterValues.input_image).toBeUndefined();
      expect(store.getState().prompt).toBe("A drone shot starting from zooming out");
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("removes single item from a list parameter and cleans its tag", () => {
      const store = createTestStore({
        selectedModelId: normalizedImagesListModel.id,
        activeMode: "image",
        prompt: "Art of <media:ref_a> and <media:ref_b>",
        parameterValues: {
          images: [
            { workflow_id: "ref_a", name: "A" },
            { workflow_id: "ref_b", name: "B" },
          ],
        },
      });

      const res = store.getState().removeMedia({
        role: "reference",
        value: { workflow_id: "ref_a" },
      });

      expect(res.ok).toBe(true);
      expect(store.getState().parameterValues.images).toHaveLength(1);
      expect(store.getState().parameterValues.images[0].workflow_id).toBe("ref_b");
      expect(store.getState().prompt).toBe("Art of and <media:ref_b>");
    });
  });
});
