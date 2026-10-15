import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { characterTemplate } from "../templates/character.template.js";
import { CharacterPromptBar } from "../templates/CharacterPromptBar.jsx";
import { rawFramesModel, rawImagesListModel, rawPromptOnlyModel } from "./fixtures/models.fixture.js";

describe("Character Template & CharacterPromptBar", () => {
  describe("characterTemplate contract", () => {
    it("validates successfully as a canonical TemplateDefinition", () => {
      expect(characterTemplate.id).toBe("character");
      expect(Object.isFrozen(characterTemplate)).toBe(true);
      expect(characterTemplate.features.models).toBe(true);
      expect(characterTemplate.features.modes).toBe(false);
      expect(characterTemplate.layout.showModeSelector).toBe(false);
      expect(characterTemplate.layout.showAttachmentBar).toBe(false);
      expect(characterTemplate.layout.showPromptInput).toBe(true);
      expect(characterTemplate.layout.showModelSelector).toBe(true);
    });

    it("getSlots returns empty array (no reference attachment slots)", () => {
      expect(characterTemplate.getSlots("image")).toEqual([]);
      expect(characterTemplate.getSlots("video")).toEqual([]);
    });

    it("filterEligibleModels narrows catalog to image domain models only", () => {
      const models = [rawFramesModel, rawImagesListModel, rawPromptOnlyModel];
      const eligible = characterTemplate.filterEligibleModels(models);

      expect(eligible.map((m) => m.id)).toEqual(["nanobana_pro", "seedream_v5"]);
      expect(eligible.some((m) => m.id === "seedance_2_5")).toBe(false);
    });

    it("resolveParameterMapping returns null for any slot role", () => {
      expect(characterTemplate.resolveParameterMapping(rawImagesListModel, "reference")).toBe(null);
      expect(characterTemplate.resolveParameterMapping(rawImagesListModel, "start")).toBe(null);
    });
  });

  describe("CharacterPromptBar Component", () => {
    it("renders with Character template properties, no mode selector and no attachment bar", () => {
      const mockGenerate = vi.fn();
      const models = [rawImagesListModel, rawPromptOnlyModel];

      render(
        <CharacterPromptBar
          models={models}
          onGenerate={mockGenerate}
          projectId="proj-character-test"
        />
      );

      // Prompt textarea should be rendered
      expect(screen.getByRole("textbox")).toBeDefined();

      // Mode selector (Image/Video switch) should NOT be rendered
      expect(screen.queryByText("Image")).toBeNull();
      expect(screen.queryByText("Video")).toBeNull();

      // Attachment slot buttons should NOT be rendered
      expect(screen.queryByText("Reference")).toBeNull();
      expect(screen.queryByText("Start Frame")).toBeNull();
    });

    it("NewCharacterPage embeds CharacterPromptBar with models and onGenerate", () => {
      const fs = require("fs");
      const path = require("path");
      const pageFile = fs.readFileSync(
        path.resolve(__dirname, "../../../app/cinema-studio/[projectId]/characters/new/page.js"),
        "utf8"
      );

      expect(pageFile).toContain("<CharacterPromptBar");
      expect(pageFile).toContain("projectId={effectiveProjectId}");
      expect(pageFile).toContain("models={models}");
      expect(pageFile).toContain("onGenerate={handleGenerate}");
      expect(pageFile).toContain("isGenerating={createCharacterMutation.isPending}");
    });
  });
});
