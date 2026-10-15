/**
 * SAFE-3: Store Characterization Tests (Vanilla Zustand Store)
 *
 * Tests:
 * 1. setModels picks default model & default parameter values; honors valid initial selectedModelId
 * 2. selectModel (frames -> imagesList): parameter reconciliation, non-empty reconciliationLog, prompt tag cleanup
 * 3. selectModel (lower max image count): trims excess references and cleans prompt tags directly in store (PB-K3)
 * 4. setParameter, setPrompt, addElement/removeElement, addCharacter/removeCharacter, clearEntities, clearMediaReferences, reset, serialize
 * 5. setIsGenerating only mutates isGenerating flag
 */

import { describe, it, expect } from "vitest";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import {
  fixtureModels,
  normalizedImagesListModel,
} from "./fixtures/models.fixture.js";

describe("SAFE-3: Store Characterization", () => {
  describe("1. setModels", () => {
    it("picks first model as default and initializes default parameter values when selectedModelId is null", () => {
      const store = createPromptBarStore();
      store.getState().setModels(fixtureModels);

      const state = store.getState();
      expect(state.selectedModelId).toBe("seedance_2_5");
      expect(state.parameterValues).toEqual({
        duration: 5,
        aspect_ratio: "16:9",
        resolution: "720p",
      });
      expect(state.modelsMap["seedance_2_5"]).toBeDefined();
    });

    it("honors initial selectedModelId when valid among provided models", () => {
      const store = createPromptBarStore({
        selectedModelId: "nanobana_pro",
        parameterValues: { resolution: "2K", aspect_ratio: "16:9" },
      });
      store.getState().setModels(fixtureModels);

      const state = store.getState();
      expect(state.selectedModelId).toBe("nanobana_pro");
      expect(state.parameterValues.resolution).toBe("2K");
      expect(state.parameterValues.aspect_ratio).toBe("16:9");
    });
  });

  describe("2. selectModel (frames -> imagesList)", () => {
    it("reconciles parameters, logs changes in reconciliationLog, and cleans prompt tags of dropped media", () => {
      const store = createPromptBarStore();
      store.getState().setModels(fixtureModels);

      // Start on frames model with media and prompt tag
      store.getState().setPrompt("Drone shot at sunset <MediaAsset:wf_end>");
      store.getState().setParameter("input_image", { workflow_id: "wf_start" });
      store.getState().setParameter("last_frame", { workflow_id: "wf_end" });
      store.getState().setParameter("aspect_ratio", "16:9");
      store.getState().setParameter("resolution", "720p");

      // Switch to imagesList model (nanobana_pro)
      store.getState().selectModel("nanobana_pro");

      const state = store.getState();
      expect(state.selectedModelId).toBe("nanobana_pro");

      // reconciliationLog is non-empty
      expect(state.reconciliationLog.length).toBeGreaterThan(0);
      const removedLastFrame = state.reconciliationLog.find(
        (c) => c.parameter === "last_frame" && c.action === "removed"
      );
      expect(removedLastFrame).toBeDefined();

      // parameterValues: last_frame is gone, aspect_ratio is preserved, resolution reset to 1K
      expect(state.parameterValues.last_frame).toBeUndefined();
      expect(state.parameterValues.aspect_ratio).toBe("16:9");
      expect(state.parameterValues.resolution).toBe("1K");

      // Prompt tag of dropped last_frame should be cleaned from prompt
      expect(state.prompt).toBe("Drone shot at sunset");
    });
  });

  describe("3. selectModel reference trimming (PB-K3)", () => {
    it("pins PB-K3: store trims excess references and cleans orphan prompt tags when switching to model with lower maxRefs", () => {
      // Model with lower max images (max: 1)
      const restrictedModel = {
        id: "restricted_image_model",
        name: "Restricted Single Image",
        domain: "image",
        capabilities: {},
        parameters: {
          prompt: { type: "text" },
          images: { type: "image[]", max: 1 },
          aspect_ratio: { type: "select", default: "1:1" },
        },
      };

      const store = createPromptBarStore();
      store.getState().setModels([normalizedImagesListModel, restrictedModel]);
      store.getState().selectModel("nanobana_pro");

      // Attach 2 references with tags in prompt
      store.getState().setPrompt("Combining <MediaAsset:ref_alpha> and <MediaAsset:ref_beta>");
      store.getState().setParameter("images", [
        { workflow_id: "ref_alpha", name: "Alpha" },
        { workflow_id: "ref_beta", name: "Beta" },
      ]);

      // Switch to restricted model (maxRefs = 1)
      store.getState().selectModel("restricted_image_model");

      const state = store.getState();
      expect(state.selectedModelId).toBe("restricted_image_model");

      // CURRENT BEHAVIOR (known issue PB-K3):
      // The store trims the list to 1 item and cleans the trimmed item's tag from prompt on its own!
      expect(state.parameterValues.images).toEqual({ workflow_id: "ref_alpha", name: "Alpha" });
      expect(state.prompt).toBe("Combining <MediaAsset:ref_alpha> and");
      expect(state.prompt.includes("ref_beta")).toBe(false);
    });
  });

  describe("4. Parameters, Prompt, Entities, Reset and Serialize", () => {
    it("updates prompt with setPrompt", () => {
      const store = createPromptBarStore();
      store.getState().setPrompt("Hello world");
      expect(store.getState().prompt).toBe("Hello world");
    });

    it("updates parameter with setParameter", () => {
      const store = createPromptBarStore();
      store.getState().setParameter("aspect_ratio", "16:9");
      expect(store.getState().parameterValues.aspect_ratio).toBe("16:9");
    });

    it("adds and removes elements, cleaning prompt tags on remove", () => {
      const store = createPromptBarStore();
      store.getState().setPrompt("A cyber ninja <element:elem_1> in Tokyo");

      const elem = { id: "elem_1", name: "Cyber Ninja", workflow_id: "elem_1" };
      store.getState().addElement(elem);
      expect(store.getState().elements.length).toBe(1);

      store.getState().removeElement("elem_1");
      expect(store.getState().elements.length).toBe(0);
      expect(store.getState().prompt).toBe("A cyber ninja in Tokyo");
    });

    it("adds and removes characters, cleaning prompt tags on remove", () => {
      const store = createPromptBarStore();
      store.getState().setPrompt("Hero <character:char_1> on a mission");

      const char = { id: "char_1", name: "Hero", workflow_id: "char_1" };
      store.getState().addCharacter(char);
      expect(store.getState().characters.length).toBe(1);

      store.getState().removeCharacter("char_1");
      expect(store.getState().characters.length).toBe(0);
      expect(store.getState().prompt).toBe("Hero on a mission");
    });

    it("clears all entities with clearEntities", () => {
      const store = createPromptBarStore();
      store.getState().addElement({ id: "e1", workflow_id: "e1" });
      store.getState().addCharacter({ id: "c1", workflow_id: "c1" });
      expect(store.getState().elements.length).toBe(1);
      expect(store.getState().characters.length).toBe(1);

      store.getState().clearEntities();
      expect(store.getState().elements).toEqual([]);
      expect(store.getState().characters).toEqual([]);
    });

    it("clears media references and cleans prompt tags with clearMediaReferences", () => {
      const store = createPromptBarStore();
      store.getState().setPrompt("Scene with <MediaAsset:img_1> and <character:c_1>");
      store.getState().setParameter("images", [{ workflow_id: "img_1" }]);
      store.getState().addCharacter({ id: "c_1", workflow_id: "c_1" });

      store.getState().clearMediaReferences();

      const state = store.getState();
      expect(state.parameterValues.images).toBeUndefined();
      expect(state.characters).toEqual([]);
      expect(state.elements).toEqual([]);
      expect(state.prompt).toBe("Scene with and");
    });

    it("resets prompt, parameters, entities, and logs to model defaults with reset", () => {
      const store = createPromptBarStore();
      store.getState().setModels(fixtureModels);
      store.getState().selectModel("nanobana_pro");
      store.getState().setPrompt("Something custom");
      store.getState().setParameter("resolution", "2K");
      store.getState().addElement({ id: "e1", workflow_id: "e1" });

      store.getState().reset();

      const state = store.getState();
      expect(state.prompt).toBe("");
      expect(state.elements).toEqual([]);
      expect(state.characters).toEqual([]);
      expect(state.reconciliationLog).toEqual([]);
      expect(state.lastSerializedRequest).toBeNull();
      expect(state.parameterValues).toEqual({
        resolution: "1K", // default
        aspect_ratio: "1:1", // default
        images: [], // default
      });
    });

    it("serializes current state and writes lastSerializedRequest", () => {
      const store = createPromptBarStore();
      store.getState().setModels(fixtureModels);
      store.getState().selectModel("nanobana_pro");
      store.getState().setPrompt("Stylized portrait");
      store.getState().setParameter("resolution", "2K");

      const result = store.getState().serialize();

      expect(result).toEqual({
        model: "nanobana_pro",
        prompt: "Stylized portrait",
        parameters: {
          resolution: "2K",
          aspect_ratio: "16:9", // preserved from seedance_2_5
          images: [],
        },
        references: [],
        elements: [],
        characters: [],
      });
      expect(store.getState().lastSerializedRequest).toEqual(result);
    });
  });

  describe("5. setIsGenerating", () => {
    it("only modifies isGenerating without altering prompt or parameterValues", () => {
      const store = createPromptBarStore();
      store.getState().setPrompt("Test prompt");
      store.getState().setParameter("resolution", "1K");

      expect(store.getState().isGenerating).toBe(false);

      store.getState().setIsGenerating(true);
      expect(store.getState().isGenerating).toBe(true);
      expect(store.getState().prompt).toBe("Test prompt");
      expect(store.getState().parameterValues.resolution).toBe("1K");

      store.getState().setIsGenerating(false);
      expect(store.getState().isGenerating).toBe(false);
      expect(store.getState().prompt).toBe("Test prompt");
      expect(store.getState().parameterValues.resolution).toBe("1K");
    });
  });
});
