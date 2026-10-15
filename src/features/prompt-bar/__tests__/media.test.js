/**
 * Contract tests for pure media functions (Task C5).
 */

import { describe, it, expect } from "vitest";
import {
  getActiveSlots,
  getSlotMaxRefs,
  getModelReferenceCapability,
} from "../core/media.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import {
  normalizedFramesModel,
  normalizedImagesListModel,
  normalizedPromptOnlyModel,
} from "./fixtures/models.fixture.js";

describe("C5: media.js slots and limits contract", () => {
  describe("getActiveSlots", () => {
    it("frames model in video/frames mode gives Start and End slots", () => {
      const slots = getActiveSlots({
        template: generatedMediaTemplate,
        mode: "video",
        subMode: "frames",
        model: normalizedFramesModel,
      });

      expect(slots).toHaveLength(2);
      expect(slots.map((s) => s.role)).toEqual(["start", "end"]);
    });

    it("images-list model in image mode gives one Reference slot", () => {
      const slots = getActiveSlots({
        template: generatedMediaTemplate,
        mode: "image",
        model: normalizedImagesListModel,
      });

      expect(slots).toHaveLength(1);
      expect(slots[0].role).toBe("reference");
    });

    it("images-list model in video/reference mode gives one Reference slot", () => {
      const slots = getActiveSlots({
        template: generatedMediaTemplate,
        mode: "video",
        subMode: "reference",
        model: normalizedImagesListModel,
      });

      expect(slots).toHaveLength(1);
      expect(slots[0].role).toBe("reference");
    });

    it("prompt-only model hides the reference slot in image mode", () => {
      const imageSlots = getActiveSlots({
        template: generatedMediaTemplate,
        mode: "image",
        model: normalizedPromptOnlyModel,
      });
      expect(imageSlots).toHaveLength(0);
    });

    it("falls back to default referenceSlots when template has no modes or is missing", () => {
      const fallbackSlots = [{ role: "custom", label: "Custom" }];
      const slots = getActiveSlots({
        referenceSlots: fallbackSlots,
        hasModes: false,
      });
      expect(slots).toEqual(fallbackSlots);
    });
  });

  describe("getSlotMaxRefs", () => {
    it("returns 1 for frame slots on frames model", () => {
      const startMax = getSlotMaxRefs({
        slot: { role: "start" },
        model: normalizedFramesModel,
        template: generatedMediaTemplate,
      });
      expect(startMax).toBe(1);

      const endMax = getSlotMaxRefs({
        slot: { role: "end" },
        model: normalizedFramesModel,
        template: generatedMediaTemplate,
      });
      expect(endMax).toBe(1);
    });

    it("returns model maxRefs (14) for reference slot on images-list model", () => {
      const refMax = getSlotMaxRefs({
        slot: { role: "reference" },
        model: normalizedImagesListModel,
        template: generatedMediaTemplate,
      });
      expect(refMax).toBe(14);
    });

    it("returns 0 if slot or model is missing", () => {
      expect(getSlotMaxRefs({ slot: null, model: normalizedFramesModel })).toBe(0);
      expect(getSlotMaxRefs({ slot: { role: "start" }, model: null })).toBe(0);
    });
  });

  describe("getModelReferenceCapability", () => {
    it("re-exports getModelReferenceCapability properly", () => {
      expect(typeof getModelReferenceCapability).toBe("function");

      const framesCap = getModelReferenceCapability(normalizedFramesModel);
      expect(framesCap.supports).toBe(false); // frames model is video without images param

      const imagesCap = getModelReferenceCapability(normalizedImagesListModel);
      expect(imagesCap.supports).toBe(true);
      expect(imagesCap.maxRefs).toBe(14);
    });
  });
});
