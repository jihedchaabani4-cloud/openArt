/**
 * T2: pruneMedia Pure Function Unit Tests
 *
 * Matrix of reasons x 3 fixture models x filled/empty states per PB-D-03.
 */

import { describe, it, expect } from "vitest";
import { pruneMedia } from "../core/media.js";
import {
  normalizedFramesModel,
  normalizedImagesListModel,
  normalizedPromptOnlyModel,
} from "./fixtures/models.fixture.js";

describe("T2: pruneMedia Pure Media Transitions (PB-D-03)", () => {
  const sampleStartImage = { workflow_id: "wf_start", id: "asset_start", type: "image" };
  const sampleEndImage = { workflow_id: "wf_end", id: "asset_end", type: "image" };
  const sampleRefImages = [
    { workflow_id: "wf_ref1", id: "asset_ref1", type: "image" },
    { workflow_id: "wf_ref2", id: "asset_ref2", type: "image" },
    { workflow_id: "wf_ref3", id: "asset_ref3", type: "image" },
  ];

  describe("1. mode-change", () => {
    it("removes all declared media parameters between image and video/frames", () => {
      // Model A (image model with images or input_image) -> Model B (video frames model)
      const values = {
        input_image: sampleStartImage,
        aspect_ratio: "16:9",
        resolution: "1080p",
      };

      const result = pruneMedia({
        parameterValues: values,
        prevModel: normalizedImagesListModel,
        nextModel: normalizedFramesModel,
        reason: "mode-change",
      });

      // input_image was a media parameter -> must be removed! (Resolves PB-K1 collision)
      expect(result.parameterValues.input_image).toBeUndefined();
      // Non-media parameters untouched
      expect(result.parameterValues.aspect_ratio).toBe("16:9");
      expect(result.parameterValues.resolution).toBe("1080p");

      // Removed asset IDs collected
      expect(result.removed).toEqual([
        { key: "input_image", assetIds: ["wf_start"] },
      ]);
    });

    it("removes start and end frames when switching from video/frames to video/reference", () => {
      const values = {
        input_image: sampleStartImage,
        last_frame: sampleEndImage,
        duration: 10,
      };

      const result = pruneMedia({
        parameterValues: values,
        prevModel: normalizedFramesModel,
        nextModel: normalizedImagesListModel,
        reason: "mode-change",
      });

      expect(result.parameterValues.input_image).toBeUndefined();
      expect(result.parameterValues.last_frame).toBeUndefined();
      expect(result.parameterValues.duration).toBe(10);

      const removedKeys = result.removed.map((r) => r.key);
      expect(removedKeys).toContain("input_image");
      expect(removedKeys).toContain("last_frame");

      const allAssetIds = result.removed.flatMap((r) => r.assetIds);
      expect(allAssetIds).toContain("wf_start");
      expect(allAssetIds).toContain("wf_end");
    });

    it("handles empty parameter values cleanly on mode-change", () => {
      const result = pruneMedia({
        parameterValues: {},
        prevModel: normalizedFramesModel,
        nextModel: normalizedImagesListModel,
        reason: "mode-change",
      });

      expect(result.parameterValues).toEqual({});
      expect(result.removed).toEqual([]);
    });
  });

  describe("2. model-change inside same mode", () => {
    it("keeps compatible media parameters when both models declare them", () => {
      // Model 1 declares images, Model 2 declares images with max >= current
      const values = {
        images: [sampleRefImages[0], sampleRefImages[1]],
        aspect_ratio: "1:1",
      };

      const nextModelSameType = {
        id: "another_images_model",
        parameters: {
          images: { type: "image[]", max: 4 },
          aspect_ratio: { type: "select" },
        },
      };

      const result = pruneMedia({
        parameterValues: values,
        prevModel: normalizedImagesListModel,
        nextModel: nextModelSameType,
        reason: "model-change",
      });

      expect(result.parameterValues.images).toEqual([sampleRefImages[0], sampleRefImages[1]]);
      expect(result.parameterValues.aspect_ratio).toBe("1:1");
      expect(result.removed).toEqual([]);
    });

    it("trims list to the next model's max and collects asset IDs of trimmed items", () => {
      const values = {
        images: [...sampleRefImages], // 3 items
        aspect_ratio: "1:1",
      };

      // Next model only allows max: 1
      const modelWithMax1 = {
        id: "model_max_1",
        parameters: {
          images: { type: "image[]", max: 1 },
        },
      };

      const result = pruneMedia({
        parameterValues: values,
        prevModel: normalizedImagesListModel,
        nextModel: modelWithMax1,
        reason: "model-change",
      });

      // Kept only first item
      expect(result.parameterValues.images).toEqual([sampleRefImages[0]]);
      // Removed items 1 and 2
      expect(result.removed).toEqual([
        { key: "images", assetIds: ["wf_ref2", "wf_ref3"] },
      ]);
    });

    it("drops media parameters when switching to prompt-only model", () => {
      const values = {
        input_image: sampleStartImage,
        last_frame: sampleEndImage,
        aspect_ratio: "16:9",
      };

      const result = pruneMedia({
        parameterValues: values,
        prevModel: normalizedFramesModel,
        nextModel: normalizedPromptOnlyModel,
        reason: "model-change",
      });

      expect(result.parameterValues.input_image).toBeUndefined();
      expect(result.parameterValues.last_frame).toBeUndefined();
      expect(result.parameterValues.aspect_ratio).toBe("16:9");

      const removedKeys = result.removed.map((r) => r.key);
      expect(removedKeys).toContain("input_image");
      expect(removedKeys).toContain("last_frame");

      const allAssetIds = result.removed.flatMap((r) => r.assetIds);
      expect(allAssetIds).toContain("wf_start");
      expect(allAssetIds).toContain("wf_end");
    });

    it("drops incompatible media parameter types (e.g. image[] to image)", () => {
      const values = {
        images: [sampleRefImages[0]],
      };

      const modelWithSingleImageOnly = {
        id: "single_img_model",
        parameters: {
          images: { type: "image" }, // not image[]
        },
      };

      const result = pruneMedia({
        parameterValues: values,
        prevModel: normalizedImagesListModel,
        nextModel: modelWithSingleImageOnly,
        reason: "model-change",
      });

      expect(result.parameterValues.images).toBeUndefined();
      expect(result.removed).toEqual([
        { key: "images", assetIds: ["wf_ref1"] },
      ]);
    });

    it("leaves non-media parameters completely untouched", () => {
      const values = {
        seed: 42,
        prompt_strength: 0.8,
        custom_toggle: true,
      };

      const result = pruneMedia({
        parameterValues: values,
        prevModel: normalizedFramesModel,
        nextModel: normalizedImagesListModel,
        reason: "model-change",
      });

      expect(result.parameterValues).toEqual(values);
      expect(result.removed).toEqual([]);
    });
  });
});
