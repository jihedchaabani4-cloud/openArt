import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { characterTemplate } from "../templates/character.template.js";
import { CharacterPromptBar } from "../templates/CharacterPromptBar.jsx";
import { createPromptBarStore } from "../store/createPromptBarStore.js";

describe("Character Template & CharacterPromptBar", () => {
  afterEach(() => {
    cleanup();
  });

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
        {
          role: "reference",
          label: "Reference",
          accepts: "image/*,element/*",
          allowedTypes: ["image", "element"],
        },
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

    it("renders Form button for character characteristics in CharacterPromptBar", () => {
      render(
        <CharacterPromptBar
          projectId="proj-character-test"
        />
      );

      // Form button should be rendered
      const formBtn = screen.getByRole("button", { name: /form/i });
      expect(formBtn).toBeDefined();
    });
  });

  describe("Character constraints: min 10 characters and Image/Element references only", () => {
    it("characterTemplate declares minPromptLength: 10 and allowedTypes: ['image', 'element']", () => {
      expect(characterTemplate.minPromptLength).toBe(10);
      const slots = characterTemplate.getSlots();
      expect(slots[0].allowedTypes).toEqual(["image", "element"]);
    });

    it("attaching reference accepts images and elements, but rejects videos and characters", () => {
      const store = createPromptBarStore(
        {
          template: characterTemplate,
          prompt: "Futuristic neon cyborg character",
        },
        { template: characterTemplate }
      );

      // 1. Image is accepted
      const imgRes = store.getState().attachMedia({
        role: "reference",
        value: { id: "media-img-1", type: "image", url: "https://example.com/face.png" },
      });
      expect(imgRes.ok).toBe(true);

      // 2. Element is accepted
      const elemRes = store.getState().attachMedia({
        role: "reference",
        value: { id: "elem-1", type: "element", workflow_type: "ELEMENT_SHEET", url: "https://example.com/elem.png" },
      });
      expect(elemRes.ok).toBe(true);

      // 3. Video is rejected
      const videoRes = store.getState().attachMedia({
        role: "reference",
        value: { id: "video-1", type: "video", url: "https://example.com/anim.mp4" },
      });
      expect(videoRes.ok).toBe(false);
      expect(videoRes.reason).toBe("TYPE_NOT_ALLOWED");

      // 4. Character is rejected
      const charRes = store.getState().attachMedia({
        role: "reference",
        value: { id: "char-1", type: "character", workflow_type: "CHARACTER_SHEET", url: "https://example.com/char.png" },
      });
      expect(charRes.ok).toBe(false);
      expect(charRes.reason).toBe("TYPE_NOT_ALLOWED");
    });

    it("disables generate button when prompt is less than 10 characters", () => {
      const mockGenerate = vi.fn();

      render(
        <CharacterPromptBar
          onGenerate={mockGenerate}
          projectId="proj-character-test"
        />
      );

      // Initially prompt is empty (< 10 chars) -> generate button must be disabled
      const generateBtn = screen.getByRole("button", { name: /generate/i });
      expect(generateBtn.disabled || generateBtn.hasAttribute("disabled")).toBe(true);
    });

    it("enables generate button when prompt has at least 10 characters", () => {
      const mockGenerate = vi.fn();
      const testStore = createPromptBarStore(
        {
          template: characterTemplate,
          prompt: "A detailed cinematic character",
        },
        { template: characterTemplate }
      );

      render(
        <CharacterPromptBar
          store={testStore}
          onGenerate={mockGenerate}
          projectId="proj-character-test"
        />
      );

      const generateBtn = screen.getByRole("button", { name: /generate/i });
      expect(generateBtn.disabled).toBe(false);
      expect(generateBtn.hasAttribute("disabled")).toBe(false);
    });
  });
});




