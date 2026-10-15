/**
 * SAFE-1: Pure Core Characterization Tests
 *
 * Tests:
 * 1. Reconciliation: switching between frames, imagesList, and promptOnly models
 * 2. Serialization: golden payloads for all 3 fixture models, plus PB-K2 characterization
 * 3. Tags Service: cleanTagsForAsset edge cases, multi-id, regex special chars, whitespace cleanup
 * 4. Model Management: parameter adaptation and normalization
 */

import { describe, it, expect } from "vitest";
import { reconcile } from "../core/reconciliation.js";
import { serialize } from "../core/serialization.js";
import { cleanTagsForAsset } from "../core/tagsService.js";
import { adaptBackendParameter } from "../core/modelManagement.js";
import {
  normalizedFramesModel,
  normalizedImagesListModel,
  normalizedPromptOnlyModel,
} from "./fixtures/models.fixture.js";

describe("SAFE-1: Pure Core Characterization", () => {
  describe("1. Reconciliation", () => {
    it("switching frames to imagesList keeps aspect_ratio when valid, resets invalid values to default, and drops last_frame", () => {
      const prevValues = {
        prompt: "A scenic sunrise",
        input_image: "wf_start_123",
        last_frame: "wf_end_456",
        duration: 10,
        aspect_ratio: "16:9",
        resolution: "720p", // 720p is not in imagesList (only 1K, 2K)
      };

      const result = reconcile(
        prevValues,
        normalizedFramesModel.parameters,
        normalizedImagesListModel.parameters
      );

      expect(result.nextValues).toEqual({
        prompt: "A scenic sunrise",
        input_image: "wf_start_123", // input_image exists in both
        images: [], // normalized default for images in imagesList
        resolution: "1K", // reset from 720p to imagesList default "1K"
        aspect_ratio: "16:9", // preserved (valid in both)
      });

      // last_frame should be in removed changes
      const removedLastFrame = result.changes.find(
        (c) => c.parameter === "last_frame" && c.action === "removed"
      );
      expect(removedLastFrame).toBeDefined();
      expect(removedLastFrame.previousValue).toBe("wf_end_456");

      // duration should be in removed changes
      const removedDuration = result.changes.find(
        (c) => c.parameter === "duration" && c.action === "removed"
      );
      expect(removedDuration).toBeDefined();

      // resolution should be in reset changes
      const resetResolution = result.changes.find(
        (c) => c.parameter === "resolution" && c.action === "reset"
      );
      expect(resetResolution).toBeDefined();
      expect(resetResolution.previousValue).toBe("720p");
      expect(resetResolution.value).toBe("1K");
    });

    it("switching to promptOnly drops all media parameters", () => {
      const prevValues = {
        prompt: "A digital artwork",
        images: [{ workflow_id: "wf_ref1" }],
        input_image: "wf_ref2",
        resolution: "2K",
        aspect_ratio: "16:9",
      };

      const result = reconcile(
        prevValues,
        normalizedImagesListModel.parameters,
        normalizedPromptOnlyModel.parameters
      );

      expect(result.nextValues).toEqual({
        prompt: "A digital artwork",
        resolution: "2K", // preserved (valid in both)
        aspect_ratio: "16:9", // preserved (valid in both)
      });

      // Media parameters should be marked removed
      const removedImages = result.changes.find(
        (c) => c.parameter === "images" && c.action === "removed"
      );
      expect(removedImages).toBeDefined();

      const removedInputImage = result.changes.find(
        (c) => c.parameter === "input_image" && c.action === "removed"
      );
      expect(removedInputImage).toBeDefined();
    });
  });

  describe("2. Serialization & Golden Payloads", () => {
    it("serializes frames model with full parameters into golden payload", () => {
      const prompt = "A drone flying over forest";
      const values = {
        input_image: { workflow_id: "wf_start" },
        last_frame: { workflow_id: "wf_end" },
        duration: 10,
        aspect_ratio: "16:9",
        resolution: "1080p",
      };

      const payload = serialize(
        normalizedFramesModel.id,
        prompt,
        normalizedFramesModel.parameters,
        values
      );

      expect(payload).toEqual({
        model: "seedance_2_5",
        prompt: "A drone flying over forest",
        parameters: {
          input_image: "wf_start",
          last_frame: "wf_end",
          duration: 10,
          aspect_ratio: "16:9",
          resolution: "1080p",
        },
        references: ["wf_start", "wf_end"],
      });
    });

    it("serializes imagesList model with references into golden payload", () => {
      const prompt = "A modern architectural villa";
      const values = {
        images: [{ workflow_id: "wf_img1" }, { workflow_id: "wf_img2" }],
        resolution: "2K",
        aspect_ratio: "16:9",
      };

      const payload = serialize(
        normalizedImagesListModel.id,
        prompt,
        normalizedImagesListModel.parameters,
        values
      );

      expect(payload).toEqual({
        model: "nanobana_pro",
        prompt: "A modern architectural villa",
        parameters: {
          images: ["wf_img1", "wf_img2"],
          resolution: "2K",
          aspect_ratio: "16:9",
        },
        references: ["wf_img1", "wf_img2"],
      });
    });

    it("serializes promptOnly model without media into golden payload", () => {
      const prompt = "Abstract geometric pattern in oil painting style";
      const values = {
        resolution: "2K",
        aspect_ratio: "1:1",
      };

      const payload = serialize(
        normalizedPromptOnlyModel.id,
        prompt,
        normalizedPromptOnlyModel.parameters,
        values
      );

      expect(payload).toEqual({
        model: "seedream_v5",
        prompt: "Abstract geometric pattern in oil painting style",
        parameters: {
          resolution: "2K",
          aspect_ratio: "1:1",
        },
        references: [],
      });
    });

    it("satisfies PB-D-12 (updated from PB-K2): serialize omits undeclared media parameters", () => {
      // PB-D-12: When the selected model is promptOnly (declaring no input_image or last_frame),
      // serialize must NOT leak undeclared media parameters into parameters or references.
      const prompt = "A minimalist painting";
      const values = {
        resolution: "1K",
        aspect_ratio: "1:1",
        input_image: { workflow_id: "wf_leaked_input" },
        last_frame: { workflow_id: "wf_leaked_end" },
      };

      const payload = serialize(
        normalizedPromptOnlyModel.id,
        prompt,
        normalizedPromptOnlyModel.parameters,
        values
      );

      // Verify undeclared media parameters are NOT present:
      expect(payload.parameters.input_image).toBeUndefined();
      expect(payload.parameters.last_frame).toBeUndefined();
      expect(payload.references).toEqual([]);
      expect(payload).toEqual({
        model: "seedream_v5",
        prompt: "A minimalist painting",
        parameters: {
          resolution: "1K",
          aspect_ratio: "1:1",
        },
        references: [],
      });
    });

    it("satisfies PB-D-12: state holds stale images while model declares only input_image: images is omitted", () => {
      const prompt = "Frame generation test";
      const values = {
        input_image: { workflow_id: "wf_start_frame" },
        images: [{ workflow_id: "wf_stale_ref" }],
        duration: 5,
      };

      // Model declaring only input_image (no images)
      const modelWithInputImageOnly = {
        id: "frame_only_model",
        parameters: {
          input_image: { type: "image", group: "media" },
          duration: { type: "number", default: 5 },
        },
      };

      const payload = serialize(
        modelWithInputImageOnly.id,
        prompt,
        modelWithInputImageOnly.parameters,
        values
      );

      expect(payload.parameters.input_image).toBe("wf_start_frame");
      expect(payload.parameters.images).toBeUndefined();
      expect(payload.references).toEqual(["wf_start_frame"]);
    });

    it("satisfies PB-D-12: elements and characters contract fields remain intact", () => {
      const prompt = "Portrait with elements";
      const values = {
        resolution: "1K",
        aspect_ratio: "1:1",
      };

      const payload = serialize(
        normalizedPromptOnlyModel.id,
        prompt,
        normalizedPromptOnlyModel.parameters,
        values,
        {
          elements: [{ id: "elem_1", workflow_id: "wf_elem1" }],
          characters: [{ id: "char_1", workflow_id: "wf_char1" }],
          references: ["wf_extra_ref"],
        }
      );

      expect(payload.elements).toEqual(["wf_elem1"]);
      expect(payload.characters).toEqual(["wf_char1"]);
      expect(payload.references).toContain("wf_elem1");
      expect(payload.references).toContain("wf_char1");
      expect(payload.references).toContain("wf_extra_ref");
    });
  });

  describe("3. Tags Service: cleanTagsForAsset", () => {
    it("removes supported tag kinds for a single id and leaves other tags intact", () => {
      const prompt = "Portrait of <character:char_123> holding <element:elem_456> near <media:media_789>";
      const cleaned = cleanTagsForAsset(prompt, "elem_456");

      expect(cleaned).toBe("Portrait of <character:char_123> holding near <media:media_789>");
    });

    it("removes tags for a list of ids", () => {
      const prompt = "A photo of <MediaAsset: asset_1> and <MediaAsset: asset_2> with <MediaAsset: asset_3>";
      const cleaned = cleanTagsForAsset(prompt, ["asset_1", "asset_3"]);

      expect(cleaned).toBe("A photo of and <MediaAsset: asset_2> with");
    });

    it("cleans doubled commas and excess spaces resulting from tag removal", () => {
      const prompt = "Characters, <character:hero>, in a room";
      const cleaned = cleanTagsForAsset(prompt, "hero");

      expect(cleaned).toBe("Characters, in a room");
    });

    it("returns empty string when prompt is empty or non-string", () => {
      expect(cleanTagsForAsset("", "any_id")).toBe("");
      expect(cleanTagsForAsset(null, "any_id")).toBe("");
      expect(cleanTagsForAsset(undefined, "any_id")).toBe("");
      expect(cleanTagsForAsset(12345, "any_id")).toBe("");
    });

    it("does not break when asset id contains regex special characters", () => {
      const specialId = "asset-id.[special]+(test)*?^$";
      const prompt = `Image with <MediaAsset:${specialId}> and normal text`;
      const cleaned = cleanTagsForAsset(prompt, specialId);

      expect(cleaned).toBe("Image with and normal text");
    });
  });

  describe("4. Model Management Normalization", () => {
    it("maps input_image to image type, start_frame role, and media group", () => {
      const adapted = adaptBackendParameter("input_image", { type: "string" });
      expect(adapted.type).toBe("image");
      expect(adapted.role).toBe("start_frame");
      expect(adapted.group).toBe("media");
    });

    it("maps last_frame to image type, end_frame role, and media group", () => {
      const adapted = adaptBackendParameter("last_frame", { type: "string" });
      expect(adapted.type).toBe("image");
      expect(adapted.role).toBe("end_frame");
      expect(adapted.group).toBe("media");
    });

    it("maps images with raw array type to image[] type and reference_images role", () => {
      const adapted = adaptBackendParameter("images", { type: "array", max: 14 });
      expect(adapted.type).toBe("image[]");
      expect(adapted.role).toBe("reference_images");
      expect(adapted.group).toBe("media");
    });

    it("maps reference_images to image[] type and reference_images role", () => {
      const adapted = adaptBackendParameter("reference_images", { type: "string" });
      expect(adapted.type).toBe("image[]");
      expect(adapted.role).toBe("reference_images");
      expect(adapted.group).toBe("media");
    });

    it("maps input_video to video type and reference_video role", () => {
      const adapted = adaptBackendParameter("input_video", { type: "string" });
      expect(adapted.type).toBe("video");
      expect(adapted.role).toBe("reference_video");
      expect(adapted.group).toBe("media");
    });

    it("maps parameters with options to select type", () => {
      const adapted = adaptBackendParameter("aspect_ratio", {
        type: "string",
        values: [{ value: "1:1" }, { value: "16:9" }],
        default: "1:1",
      });
      expect(adapted.type).toBe("select");
      expect(adapted.group).toBe("generation");
    });

    it("maps number types correctly and categorizes advanced parameters", () => {
      const adapted = adaptBackendParameter("cfg_scale", { type: "number", default: 7 });
      expect(adapted.type).toBe("number");
      expect(adapted.group).toBe("advanced");
    });

    it("identifies prompt parameter and marks isPrompt flag", () => {
      const adapted = adaptBackendParameter("prompt", { type: "string" });
      expect(adapted.isPrompt).toBe(true);
    });
  });
});
