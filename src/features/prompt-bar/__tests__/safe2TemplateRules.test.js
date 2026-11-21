/**
 * SAFE-2: Template Rules Characterization Tests
 *
 * Tests:
 * 1. resolveParameterMapping table tests across 6 model shapes and 4 roles (including PB-K1 collision)
 * 2. filterEligibleModels capability-based filtering across modes/subModes and list isolation
 * 3. COMPOSITION_REQUIREMENTS exact slot declarations per mode & subMode
 * 4. Template immutability and layout configurations (generatedMediaTemplate, characterTemplate)
 */

import { describe, it, expect } from "vitest";
import {
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
  generatedMediaTemplate,
} from "../templates/generatedMedia.template.js";
import { characterTemplate } from "../templates/character.template.js";
import {
  normalizedFramesModel,
  normalizedImagesListModel,
  normalizedPromptOnlyModel,
} from "./fixtures/models.fixture.js";

const modelWithStartFrame = {
  id: "model_start_frame",
  domain: "video",
  parameters: {
    prompt: { type: "text" },
    start_frame: { type: "image", role: "start_frame" },
  },
};

const modelWithLastImage = {
  id: "model_last_image",
  domain: "video",
  parameters: {
    prompt: { type: "text" },
    last_image: { type: "image", role: "end_frame" },
  },
};

const modelWithRefImages = {
  id: "model_ref_images",
  domain: "image",
  parameters: {
    prompt: { type: "text" },
    reference_images: { type: "image[]", role: "reference_images" },
  },
};

const modelImg2ImgCollision = {
  id: "model_img2img_collision",
  domain: "image",
  parameters: {
    prompt: { type: "text" },
    input_image: { type: "image", role: "start_frame" },
  },
};

describe("SAFE-2: Template Rules Characterization", () => {
  describe("1. resolveParameterMapping table test", () => {
    const tableCases = [
      { model: normalizedFramesModel, role: "start", expected: "input_image" },
      { model: normalizedFramesModel, role: "end", expected: "last_frame" },
      { model: normalizedFramesModel, role: "reference", expected: null },
      { model: normalizedFramesModel, role: "unknown", expected: null },

      { model: normalizedImagesListModel, role: "start", expected: "input_image" },
      { model: normalizedImagesListModel, role: "end", expected: null },
      { model: normalizedImagesListModel, role: "reference", expected: "images" },
      { model: normalizedImagesListModel, role: "unknown", expected: null },

      { model: normalizedPromptOnlyModel, role: "start", expected: "input_image" },
      { model: normalizedPromptOnlyModel, role: "end", expected: null },
      { model: normalizedPromptOnlyModel, role: "reference", expected: null },
      { model: normalizedPromptOnlyModel, role: "unknown", expected: null },

      { model: modelWithStartFrame, role: "start", expected: "start_frame" },
      { model: modelWithStartFrame, role: "end", expected: null },
      { model: modelWithStartFrame, role: "reference", expected: null },
      { model: modelWithStartFrame, role: "unknown", expected: null },

      { model: modelWithLastImage, role: "start", expected: "input_image" },
      { model: modelWithLastImage, role: "end", expected: "last_image" },
      { model: modelWithLastImage, role: "reference", expected: null },
      { model: modelWithLastImage, role: "unknown", expected: null },

      { model: modelWithRefImages, role: "start", expected: "input_image" },
      { model: modelWithRefImages, role: "end", expected: null },
      { model: modelWithRefImages, role: "reference", expected: "reference_images" },
      { model: modelWithRefImages, role: "unknown", expected: null },
    ];

    tableCases.forEach(({ model, role, expected }) => {
      it(`maps role "${role}" for model "${model.id}" to "${expected}"`, () => {
        expect(resolveParameterMapping(model, role)).toBe(expected);
      });
    });

    it("pins PB-K1: image domain model with input_image maps both start and reference to input_image", () => {
      const startKey = resolveParameterMapping(modelImg2ImgCollision, "start");
      const refKey = resolveParameterMapping(modelImg2ImgCollision, "reference");

      expect(startKey).toBe("input_image");
      expect(refKey).toBe("input_image");
      expect(startKey).toBe(refKey);
    });
  });

  describe("2. filterEligibleModels", () => {
    const allModels = [
      normalizedFramesModel,
      normalizedImagesListModel,
      normalizedPromptOnlyModel,
    ];

    it("returns all image models when in image mode and no references attached", () => {
      const eligible = filterEligibleModels(allModels, "image", null, {});
      expect(eligible.map((m) => m.id)).toEqual(["nanobana_pro", "seedream_v5"]);
    });

    it("narrows to reference-capable image models when references are attached", () => {
      const eligibleWithImages = filterEligibleModels(allModels, "image", null, {
        images: [{ workflow_id: "wf_1" }],
      });
      expect(eligibleWithImages.map((m) => m.id)).toEqual(["nanobana_pro"]);

      const eligibleWithInputImage = filterEligibleModels(allModels, "image", null, {
        input_image: "wf_1",
      });
      expect(eligibleWithInputImage.map((m) => m.id)).toEqual(["nanobana_pro"]);
    });

    it("returns only frame models for video mode with frames subMode", () => {
      const eligible = filterEligibleModels(allModels, "video", "frames");
      expect(eligible.map((m) => m.id)).toEqual(["seedance_2_5"]);
    });

    it("returns only reference-capable video models for video mode with reference subMode", () => {
      const eligible = filterEligibleModels(allModels, "video", "reference");
      expect(eligible).toEqual([]);
    });

    it("filters only the models list passed as argument (isolated, not global)", () => {
      const isolatedList = [normalizedPromptOnlyModel];
      const eligible = filterEligibleModels(isolatedList, "image", null, {});
      expect(eligible.map((m) => m.id)).toEqual(["seedream_v5"]);
    });
  });

  describe("3. COMPOSITION_REQUIREMENTS", () => {
    it("declares exact slots for image mode", () => {
      expect(COMPOSITION_REQUIREMENTS.image).toEqual([
        { role: "reference", label: "Reference", accepts: "image/*" },
      ]);
    });

    it("declares exact slots for video frames subMode", () => {
      expect(COMPOSITION_REQUIREMENTS.video.frames).toEqual([
        { role: "start", label: "Start", accepts: "image/*" },
        { role: "end", label: "End", accepts: "image/*" },
      ]);
    });

    it("declares exact slots for video reference subMode", () => {
      expect(COMPOSITION_REQUIREMENTS.video.reference).toEqual([
        { role: "reference", label: "Reference", accepts: "image/*" },
      ]);
    });
  });

  describe("4. Template contracts and layout configurations", () => {
    it("generatedMediaTemplate is frozen and exposes declared layout flags", () => {
      expect(Object.isFrozen(generatedMediaTemplate)).toBe(true);
      expect(generatedMediaTemplate.id).toBe("generated-media");
      expect(generatedMediaTemplate.layout).toEqual({
        showPromptInput: true,
        showModelSelector: true,
        showParameterDrawer: true,
        showAttachmentBar: true,
        showModeSelector: true,
      });
    });

    it("characterTemplate is frozen and exposes declared layout flags", () => {
      expect(Object.isFrozen(characterTemplate)).toBe(true);
      expect(characterTemplate.id).toBe("character");
      expect(characterTemplate.layout).toEqual({
        showPromptInput: true,
        showModelSelector: false,
        showParameterDrawer: false,
        showAttachmentBar: true,
        showModeSelector: false,
      });
    });
  });
});
