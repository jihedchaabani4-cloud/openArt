/**
 * Contract tests for pure media functions (Task C5).
 */

import { describe, it, expect } from "vitest";
import {
  getActiveSlots,
  getSlotMaxRefs,
  getModelReferenceCapability,
  countUsedRefs,
  remainingQuota,
  allowedTypeForSlot,
  canAttach,
} from "../core/media.js";
import { REASONS } from "../core/commandResult.js";
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

  describe("countUsedRefs", () => {
    it("counts raw parameter media items correctly", () => {
      const paramValues = {
        images: [{ workflow_id: "img1" }, { workflow_id: "img2" }],
      };
      expect(countUsedRefs(paramValues)).toBe(2);
    });

    it("counts multi-image turnaround element entities according to their image count", () => {
      const paramValues = { images: [{ workflow_id: "img1" }] };
      const entities = [
        { workflow_id: "char1", is_character: true, images_count: 3 },
      ];
      expect(countUsedRefs(paramValues, [], entities)).toBe(4);
    });

    it("deduplicates identical media between parameters and entities", () => {
      const paramValues = { images: [{ workflow_id: "shared1" }] };
      const entities = [{ workflow_id: "shared1", type: "element" }];
      expect(countUsedRefs(paramValues, [], entities)).toBe(1);
    });
  });

  describe("remainingQuota", () => {
    it("calculates remaining quota accurately", () => {
      expect(
        remainingQuota({
          model: normalizedImagesListModel,
          used: 10,
          template: generatedMediaTemplate,
        })
      ).toBe(4);

      expect(
        remainingQuota({
          model: normalizedImagesListModel,
          used: 14,
          template: generatedMediaTemplate,
        })
      ).toBe(0);

      expect(
        remainingQuota({
          model: normalizedImagesListModel,
          used: 16,
          template: generatedMediaTemplate,
        })
      ).toBe(0);
    });
  });

  describe("allowedTypeForSlot", () => {
    it("returns 'image' for start and end keyframe slots", () => {
      expect(allowedTypeForSlot({ slot: { role: "start" } })).toBe("image");
      expect(allowedTypeForSlot({ slot: { role: "end" } })).toBe("image");
    });

    it("returns 'image' for reference slot in video mode", () => {
      expect(allowedTypeForSlot({ mode: "video", slot: { role: "reference" } })).toBe("image");
    });

    it("returns image, character, element array for reference slot in image mode", () => {
      expect(allowedTypeForSlot({ mode: "image", slot: { role: "reference" } })).toEqual([
        "image",
        "character",
        "element",
      ]);
    });

    it("respects explicit accepts strings", () => {
      expect(allowedTypeForSlot({ slot: { role: "custom", accepts: "video/*" } })).toBe("video");
      expect(allowedTypeForSlot({ slot: { role: "custom", accepts: "image/*" } })).toBe("image");
    });

    it("returns custom fallback if provided and slot is unknown", () => {
      expect(allowedTypeForSlot({ slot: { role: "custom" }, fallback: "video" })).toBe("video");
    });
  });

  describe("canAttach", () => {
    it("allows attachment when quota is available and types match", () => {
      const res = canAttach({
        model: normalizedImagesListModel,
        slot: { role: "reference" },
        value: { workflow_id: "new_img" },
        used: 10,
        existing: [{ workflow_id: "existing_img" }],
        template: generatedMediaTemplate,
      });

      expect(res.ok).toBe(true);
    });

    it("rejects attachment when max media quota is reached", () => {
      // exactly at max (used 14, max 14)
      const resAtMax = canAttach({
        model: normalizedImagesListModel,
        slot: { role: "reference" },
        value: { workflow_id: "overflow_img" },
        used: 14,
        template: generatedMediaTemplate,
      });
      expect(resAtMax.ok).toBe(false);
      expect(resAtMax.reason).toBe(REASONS.MAX_MEDIA_REACHED);

      // one above max (used 13, max 14, candidate is a 2-view element sheet)
      const resAbove = canAttach({
        model: normalizedImagesListModel,
        slot: { role: "reference" },
        value: { workflow_id: "sheet", images_count: 2 },
        used: 13,
        template: generatedMediaTemplate,
      });
      expect(resAbove.ok).toBe(false);
      expect(resAbove.reason).toBe(REASONS.MAX_MEDIA_REACHED);
    });

    it("rejects duplicate media in reference slot", () => {
      const res = canAttach({
        model: normalizedImagesListModel,
        slot: { role: "reference" },
        value: { workflow_id: "dup_123" },
        used: 2,
        existing: [{ workflow_id: "dup_123" }],
        template: generatedMediaTemplate,
      });

      expect(res.ok).toBe(false);
      expect(res.reason).toBe(REASONS.DUPLICATE_MEDIA);
    });

    it("rejects video attachment into image-only slots", () => {
      const res = canAttach({
        model: normalizedFramesModel,
        slot: { role: "start" },
        value: { workflow_id: "vid_1", type: "video" },
        template: generatedMediaTemplate,
      });

      expect(res.ok).toBe(false);
      expect(res.reason).toBe(REASONS.TYPE_NOT_ALLOWED);
    });
  });
});

