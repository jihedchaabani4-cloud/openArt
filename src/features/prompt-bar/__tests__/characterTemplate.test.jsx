import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { characterTemplate } from "../templates/character.template.js";
import { CharacterPromptBar } from "../templates/CharacterPromptBar.jsx";
import { createPromptBarStore } from "../store/createPromptBarStore.js";

describe("Character Template & CharacterPromptBar", () => {
  describe("characterTemplate contract (Prompt + Reference, No models, No parameters)", () => {
    it("validates successfully as a canonical TemplateDefinition", () => {
      expect(characterTemplate.id).toBe("character");
      expect(Object.isFrozen(characterTemplate)).toBe(true);
      expect(characterTemplate.features.models).toBe(false);
      expect(characterTemplate.features.modes).toBe(false);
      expect(characterTemplate.layout.showModeSelector).toBe(false);
      expect(characterTemplate.layout.showModelSelector).toBe(false);
      expect(characterTemplate.layout.showParameterDrawer).toBe(false);
      expect(characterTemplate.layout.showAttachmentBar).toBe(true);
      expect(characterTemplate.layout.showPromptInput).toBe(true);
    });

    it("getSlots returns 1 Reference slot", () => {
      const slots = characterTemplate.getSlots("image");
      expect(slots).toEqual([
        { role: "reference", label: "Reference", accepts: "image/*" },
      ]);
    });

    it("filterEligibleModels returns empty array (no models)", () => {
      expect(characterTemplate.filterEligibleModels()).toEqual([]);
    });

    it("resolveParameterMapping maps role 'reference' to parameter 'references'", () => {
      expect(characterTemplate.resolveParameterMapping(null, "reference")).toBe("references");
      expect(characterTemplate.resolveParameterMapping(null, "start")).toBe(null);
    });

    it("attaching reference and serializing produces prompt and references with NO model", () => {
      const store = createPromptBarStore(
        {
          template: characterTemplate,
          prompt: "Futuristic neon cyborg",
        },
        { template: characterTemplate }
      );

      // Attach reference image
      const attachRes = store.getState().attachMedia({
        role: "reference",
        value: { id: "media-ref-1", url: "https://example.com/face.png" },
      });
      expect(attachRes.ok).toBe(true);

      const payload = store.getState().serialize();
      expect(payload.prompt).toBe("Futuristic neon cyborg");
      expect(payload.references).toContain("media-ref-1");
      expect("model" in payload).toBe(false);
      expect(payload.model).toBeUndefined();
    });
  });

  describe("CharacterPromptBar Component", () => {
    it("renders with Character template: prompt textbox and Reference slot, no model selector, no mode selector", () => {
      const mockGenerate = vi.fn();

      render(
        <CharacterPromptBar
          onGenerate={mockGenerate}
          projectId="proj-character-test"
        />
      );

      // Prompt textarea should be rendered
      expect(screen.getByRole("textbox")).toBeDefined();

      // Reference slot button MUST be rendered
      expect(screen.getByText("Ref")).toBeDefined();
      expect(screen.getByTitle(/Add Reference/i)).toBeDefined();

      // Mode selector (Image/Video switch) should NOT be rendered
      expect(screen.queryByText("Image")).toBeNull();
      expect(screen.queryByText("Video")).toBeNull();

      // Model selector and settings button should NOT be rendered
      expect(screen.queryByAltText("model icon")).toBeNull();
      expect(screen.queryByRole("button", { name: /tune/i })).toBeNull();
    });

    it("NewCharacterPage embeds CharacterPromptBar with projectId and onGenerate", () => {
      const fs = require("fs");
      const path = require("path");
      const pageFile = fs.readFileSync(
        path.resolve(__dirname, "../../../app/cinema-studio/[projectId]/characters/new/page.js"),
        "utf8"
      );

      expect(pageFile).toContain("<CharacterPromptBar");
      expect(pageFile).toContain("projectId={effectiveProjectId}");
      expect(pageFile).toContain("onGenerate={handleGenerate}");
      expect(pageFile).toContain("isGenerating={createCharacterMutation.isPending}");
    });
  });
});
