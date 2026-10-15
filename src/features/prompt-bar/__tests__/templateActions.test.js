/**
 * X2: Generated-Media Template Actions Tests
 *
 * Store-level tests verifying addReference, animateMedia, applyGeneration,
 * and atomic composite execution via applyComposite.
 */

import { describe, it, expect, vi } from "vitest";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import {
  fixtureModels,
  normalizedFramesModel,
  normalizedImagesListModel,
  normalizedPromptOnlyModel,
} from "./fixtures/models.fixture.js";
import { REASONS } from "../core/commandResult.js";

describe("X2: Generated-Media Template Actions (addReference, animateMedia, applyGeneration)", () => {
  const modelsMap = {
    [normalizedFramesModel.id]: normalizedFramesModel,
    [normalizedImagesListModel.id]: normalizedImagesListModel,
    [normalizedPromptOnlyModel.id]: normalizedPromptOnlyModel,
  };

  function createTestStore(initialOverrides = {}, customModelsMap = modelsMap) {
    return createPromptBarStore(
      {
        modelsMap: customModelsMap,
        selectedModelId: normalizedImagesListModel.id,
        activeMode: "image",
        activeSubMode: "frames",
        ...initialOverrides,
      },
      {
        template: generatedMediaTemplate,
        models: customModelsMap,
      }
    );
  }

  describe("addReference", () => {
    it("on image mode with images-capable model: attaches reference", () => {
      const store = createTestStore({
        activeMode: "image",
        selectedModelId: normalizedImagesListModel.id,
      });

      const actions = generatedMediaTemplate.createActions(store.getState());
      const res = actions.addReference({ workflow_id: "ref_1", url: "https://example.com/1.png" });

      expect(res.ok).toBe(true);
      const state = store.getState();
      expect(state.parameterValues.images).toHaveLength(1);
      expect(state.parameterValues.images[0].workflow_id).toBe("ref_1");
    });

    it("on video/frames: fails with NO_SLOT_FOR_ROLE and changes nothing (no silent mode change)", () => {
      const store = createTestStore({
        activeMode: "video",
        activeSubMode: "frames",
        selectedModelId: normalizedFramesModel.id,
        parameterValues: { aspect_ratio: "16:9" },
      });

      const beforeState = JSON.parse(JSON.stringify(store.getState()));
      const actions = generatedMediaTemplate.createActions(store.getState());

      const res = actions.addReference({ workflow_id: "ref_1" });
      expect(res.ok).toBe(false);
      expect(res.reason).toBe(REASONS.NO_SLOT_FOR_ROLE);

      // State must be completely untouched
      const afterState = JSON.parse(JSON.stringify(store.getState()));
      expect(afterState.activeMode).toBe("video");
      expect(afterState.parameterValues).toEqual(beforeState.parameterValues);
    });
  });

  describe("animateMedia", () => {
    it("from image mode with reference present: ends in video/frames, input_image has animated media, last_frame empty, one store notification", () => {
      const store = createTestStore({
        activeMode: "image",
        selectedModelId: normalizedImagesListModel.id,
        prompt: "A beautiful scenery with <media:old_ref>",
        parameterValues: {
          images: [{ workflow_id: "old_ref" }],
          aspect_ratio: "16:9",
        },
      });

      const listener = vi.fn();
      store.subscribe(listener);

      const actions = generatedMediaTemplate.createActions(store.getState());
      const res = actions.animateMedia({
        workflow_id: "anim_media_99",
        url: "https://example.com/anim.png",
      });

      expect(res.ok).toBe(true);
      // Exactly ONE store notification for composite transition
      expect(listener).toHaveBeenCalledTimes(1);

      const state = store.getState();
      expect(state.activeMode).toBe("video");
      expect(state.activeSubMode).toBe("frames");
      expect(state.selectedModelId).toBe(normalizedFramesModel.id);
      // Animated media sits in input_image
      expect(state.parameterValues.input_image?.workflow_id).toBe("anim_media_99");
      expect(state.parameterValues.last_frame).toBeUndefined();
      expect(state.parameterValues.images).toBeUndefined();
      // Old reference tag is wiped, prompt preserved
      expect(state.prompt).toBe("A beautiful scenery with");
      expect(state.parameterValues.aspect_ratio).toBe("16:9");
    });

    it("with no frames model available: fails with NO_ELIGIBLE_MODEL, state deep-equal to before", () => {
      // Store with only image models (no frames model)
      const onlyImageModels = {
        [normalizedImagesListModel.id]: normalizedImagesListModel,
      };

      const store = createTestStore(
        {
          activeMode: "image",
          selectedModelId: normalizedImagesListModel.id,
          prompt: "Keep intact",
          parameterValues: { aspect_ratio: "1:1" },
        },
        onlyImageModels
      );

      const stateBefore = {
        activeMode: store.getState().activeMode,
        activeSubMode: store.getState().activeSubMode,
        selectedModelId: store.getState().selectedModelId,
        prompt: store.getState().prompt,
        parameterValues: { ...store.getState().parameterValues },
      };

      const listener = vi.fn();
      store.subscribe(listener);

      const actions = generatedMediaTemplate.createActions(store.getState());
      const res = actions.animateMedia({ workflow_id: "anim_1" });

      expect(res.ok).toBe(false);
      expect(res.reason).toBe(REASONS.NO_ELIGIBLE_MODEL);
      expect(listener).toHaveBeenCalledTimes(0);

      const stateAfter = {
        activeMode: store.getState().activeMode,
        activeSubMode: store.getState().activeSubMode,
        selectedModelId: store.getState().selectedModelId,
        prompt: store.getState().prompt,
        parameterValues: { ...store.getState().parameterValues },
      };
      expect(stateAfter).toEqual(stateBefore);
    });

    it("promptMode options: overwrite, append, if-empty", () => {
      // 1. Overwrite
      const store1 = createTestStore({ prompt: "Old prompt" });
      const actions1 = generatedMediaTemplate.createActions(store1.getState());
      actions1.animateMedia({ workflow_id: "m1" }, { prompt: "New overwritten prompt", promptMode: "overwrite" });
      expect(store1.getState().prompt).toBe("New overwritten prompt");

      // 2. Append
      const store2 = createTestStore({ prompt: "First part" });
      const actions2 = generatedMediaTemplate.createActions(store2.getState());
      actions2.animateMedia({ workflow_id: "m1" }, { prompt: "second part", promptMode: "append" });
      expect(store2.getState().prompt).toBe("First part second part");

      // 3. If-empty when empty
      const store3 = createTestStore({ prompt: "" });
      const actions3 = generatedMediaTemplate.createActions(store3.getState());
      actions3.animateMedia({ workflow_id: "m1" }, { prompt: "Filled because empty", promptMode: "if-empty" });
      expect(store3.getState().prompt).toBe("Filled because empty");

      // 4. If-empty when not empty
      const store4 = createTestStore({ prompt: "Already has text" });
      const actions4 = generatedMediaTemplate.createActions(store4.getState());
      actions4.animateMedia({ workflow_id: "m1" }, { prompt: "Should be ignored", promptMode: "if-empty" });
      expect(store4.getState().prompt).toBe("Already has text");
    });
  });

  describe("applyGeneration", () => {
    it("applies generation settings, ignores unknown parameter keys, filters declared model parameters", () => {
      const store = createTestStore({
        activeMode: "image",
        selectedModelId: normalizedImagesListModel.id,
      });

      const listener = vi.fn();
      store.subscribe(listener);

      const actions = generatedMediaTemplate.createActions(store.getState());
      const oldGeneration = {
        mode: "video",
        subMode: "frames",
        modelId: normalizedFramesModel.id,
        prompt: "Historic generated video prompt",
        parameters: {
          aspect_ratio: "16:9",
          duration: 10,
          unknown_nonexistent_param: "should be ignored",
          input_image: { workflow_id: "start_frame_1", url: "https://example.com/start.png" },
          invalid_media_blob: { url: "blob:http://localhost/temp-uuid" },
        },
      };

      const res = actions.applyGeneration(oldGeneration);
      expect(res.ok).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);

      const state = store.getState();
      expect(state.activeMode).toBe("video");
      expect(state.activeSubMode).toBe("frames");
      expect(state.selectedModelId).toBe(normalizedFramesModel.id);
      expect(state.prompt).toBe("Historic generated video prompt");
      expect(state.parameterValues.aspect_ratio).toBe("16:9");
      expect(state.parameterValues.duration).toBe(10);
      expect(state.parameterValues.unknown_nonexistent_param).toBeUndefined();
      expect(state.parameterValues.input_image?.workflow_id).toBe("start_frame_1");
      expect(state.parameterValues.invalid_media_blob).toBeUndefined();
    });

    it("with unknown model id: fails with UNKNOWN_MODEL and changes nothing", () => {
      const store = createTestStore({
        activeMode: "image",
        selectedModelId: normalizedImagesListModel.id,
        prompt: "Untouched prompt",
      });

      const beforePrompt = store.getState().prompt;
      const actions = generatedMediaTemplate.createActions(store.getState());

      const res = actions.applyGeneration({
        mode: "image",
        modelId: "non_existent_model_999",
        prompt: "New prompt that should not apply",
        parameters: {},
      });

      expect(res.ok).toBe(false);
      expect(res.reason).toBe(REASONS.UNKNOWN_MODEL);
      expect(store.getState().prompt).toBe(beforePrompt);
    });
  });
});
