/**
 * Contract tests for templateContract and generatedMedia.template (Task C4).
 */

import { describe, it, expect } from "vitest";
import { defineTemplate } from "../core/templateContract.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import {
  rawFramesModel,
  rawImagesListModel,
  rawPromptOnlyModel,
  normalizedFramesModel,
  normalizedImagesListModel,
} from "./fixtures/models.fixture.js";

describe("C4: templateContract & generatedMedia.template", () => {
  describe("defineTemplate", () => {
    it("validates and freezes a complete valid template definition", () => {
      const validDef = {
        id: "test-template",
        persistRoutes: ["/test/:id"],
        layout: { showPromptInput: true },
        features: { models: true, modes: false },
        defaultState: { activeMode: "test" },
        getSlots: (_mode, _subMode) => [],
        filterEligibleModels: (models) => models,
        resolveParameterMapping: (_model, _role) => "key",
      };

      const template = defineTemplate(validDef);

      expect(Object.isFrozen(template)).toBe(true);
      expect(Object.isFrozen(template.layout)).toBe(true);
      expect(Object.isFrozen(template.features)).toBe(true);
      expect(Object.isFrozen(template.persistRoutes)).toBe(true);
      expect(Object.isFrozen(template.defaultState)).toBe(true);

      expect(template.id).toBe("test-template");
      expect(template.features.models).toBe(true);
      expect(template.features.modes).toBe(false);
      expect(template.persistRoutes).toEqual(["/test/:id"]);
    });

    it("fills defaults for optional fields", () => {
      const minimalDef = {
        id: "minimal",
        getSlots: () => [],
        filterEligibleModels: (models) => models,
        resolveParameterMapping: () => null,
      };

      const template = defineTemplate(minimalDef);

      expect(template.persistRoutes).toEqual([]);
      expect(template.layout).toEqual({});
      expect(template.features).toEqual({ models: true, modes: true });
      expect(template.defaultState).toEqual({});
      expect(template.createActions).toBe(null);
    });

    it("collects and lists ALL validation problems when definition is invalid", () => {
      expect(() => defineTemplate({})).toThrowError(/Invalid template definition/);

      try {
        defineTemplate({});
      } catch (err) {
        expect(err.message).toContain("'id'");
        expect(err.message).toContain("'getSlots'");
        expect(err.message).toContain("'filterEligibleModels'");
        expect(err.message).toContain("'resolveParameterMapping'");
      }
    });

    it("rejects non-object or null input", () => {
      expect(() => defineTemplate(null)).toThrow(/non-null object/);
      expect(() => defineTemplate("not an object")).toThrow(/non-null object/);
    });
  });

  describe("generatedMediaTemplate", () => {
    it("validates successfully as a canonical TemplateDefinition", () => {
      expect(generatedMediaTemplate).toBeDefined();
      expect(Object.isFrozen(generatedMediaTemplate)).toBe(true);
      expect(generatedMediaTemplate.id).toBe("generated-media");
      expect(generatedMediaTemplate.layout.showPromptInput).toBe(true);
      expect(generatedMediaTemplate.layout.showModelSelector).toBe(true);
      expect(generatedMediaTemplate.layout.showAttachmentBar).toBe(true);
    });

    it("getSlots matches COMPOSITION_REQUIREMENTS for image, video/frames, and video/reference", () => {
      const imageSlots = generatedMediaTemplate.getSlots("image");
      expect(imageSlots).toEqual([
        { role: "reference", label: "Reference", accepts: "image/*" },
      ]);

      const frameSlots = generatedMediaTemplate.getSlots("video", "frames");
      expect(frameSlots).toEqual([
        { role: "start", label: "Start", accepts: "image/*" },
        { role: "end", label: "End", accepts: "image/*" },
      ]);

      const refSlots = generatedMediaTemplate.getSlots("video", "reference");
      expect(refSlots).toEqual([
        { role: "reference", label: "Reference", accepts: "image/*" },
      ]);
    });

    it("filterEligibleModels and resolveParameterMapping produce expected results on test models", () => {
      const models = [rawFramesModel, rawImagesListModel, rawPromptOnlyModel];

      // Video frames eligibility
      const templateFrames = generatedMediaTemplate.filterEligibleModels(models, "video", "frames");
      expect(templateFrames.map((m) => m.id)).toEqual(["seedance_2_5"]);

      // Video reference eligibility
      const videoRefModel = { id: "runway_gen3", domain: "video", parameters: { images: { type: "array" } } };
      const templateRefs = generatedMediaTemplate.filterEligibleModels([...models, videoRefModel], "video", "reference");
      expect(templateRefs.map((m) => m.id)).toEqual(["runway_gen3"]);

      // Mapping parity
      expect(
        generatedMediaTemplate.resolveParameterMapping(normalizedFramesModel, "start")
      ).toBe("input_image");

      expect(
        generatedMediaTemplate.resolveParameterMapping(normalizedFramesModel, "end")
      ).toBe("last_frame");

      expect(
        generatedMediaTemplate.resolveParameterMapping(normalizedImagesListModel, "reference")
      ).toBe("images");
    });
  });
});
