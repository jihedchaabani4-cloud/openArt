/**
 * T3: switchMode Command and Store Action Tests
 *
 * Store-level tests (no React) verifying atomic mode transitions per PB-D-03.
 */

import { describe, it, expect, vi } from "vitest";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import {
  normalizedFramesModel,
  normalizedImagesListModel,
  normalizedPromptOnlyModel,
} from "./fixtures/models.fixture.js";
import { REASONS } from "../core/commandResult.js";

describe("T3: switchMode Command & Store Action (PB-D-03)", () => {
  const videoRefModel = {
    id: "video_ref_model",
    name: "Video Reference Model",
    domain: "video",
    parameters: {
      prompt: { type: "text" },
      images: { type: "image[]", max: 4 },
      aspect_ratio: { type: "select" },
    },
  };

  const modelsMap = {
    [normalizedFramesModel.id]: normalizedFramesModel,
    [normalizedImagesListModel.id]: normalizedImagesListModel,
    [normalizedPromptOnlyModel.id]: normalizedPromptOnlyModel,
    [videoRefModel.id]: videoRefModel,
  };

  function createTestStore(initialOverrides = {}) {
    return createPromptBarStore(
      {
        modelsMap,
        selectedModelId: normalizedImagesListModel.id,
        activeMode: "image",
        activeSubMode: "frames",
        ...initialOverrides,
      },
      {
        template: generatedMediaTemplate,
        models: modelsMap,
      }
    );
  }

  it("image to video/frames with a filled reference: selects frames model, drops media, cleans tags, preserves ratio", () => {
    const store = createTestStore({
      prompt: "A stunning shot of <media:ref_123> on a mountain",
      parameterValues: {
        images: [{ workflow_id: "ref_123" }],
        aspect_ratio: "16:9",
      },
    });

    const listener = vi.fn();
    store.subscribe(listener);

    const res = store.getState().switchMode("video", "frames");

    expect(res.ok).toBe(true);
    // Exactly ONE notification per switchMode call
    expect(listener).toHaveBeenCalledTimes(1);

    const state = store.getState();
    expect(state.activeMode).toBe("video");
    expect(state.activeSubMode).toBe("frames");
    // Selected model changed to frames model
    expect(state.selectedModelId).toBe(normalizedFramesModel.id);
    // input_image and images are absent
    expect(state.parameterValues.input_image).toBeUndefined();
    expect(state.parameterValues.images).toBeUndefined();
    // Prompt tag for removed reference is cleaned
    expect(state.prompt).toBe("A stunning shot of on a mountain");
    // Shared parameters (aspect_ratio) kept by reconciliation
    expect(state.parameterValues.aspect_ratio).toBe("16:9");
  });

  it("video/frames to video/reference: input_image and last_frame absent, images-capable model selected", () => {
    const store = createTestStore({
      activeMode: "video",
      activeSubMode: "frames",
      selectedModelId: normalizedFramesModel.id,
      prompt: "Car moving from <media:start_1> to <media:end_2>",
      parameterValues: {
        input_image: { workflow_id: "start_1" },
        last_frame: { workflow_id: "end_2" },
        duration: 10,
        aspect_ratio: "16:9",
      },
    });

    const res = store.getState().switchMode("video", "reference");

    expect(res.ok).toBe(true);
    const state = store.getState();
    expect(state.activeMode).toBe("video");
    expect(state.activeSubMode).toBe("reference");
    expect(state.parameterValues.input_image).toBeUndefined();
    expect(state.parameterValues.last_frame).toBeUndefined();
    // Tags for start and end frames removed
    expect(state.prompt).toBe("Car moving from to");
  });

  it("reference to frames and video to image: same atomic logic", () => {
    const store = createTestStore({
      activeMode: "video",
      activeSubMode: "reference",
      prompt: "A beautiful scenery with <media:ref_scenery>",
      parameterValues: {
        images: [{ workflow_id: "ref_scenery" }],
        aspect_ratio: "16:9",
      },
    });

    // Switch video -> image
    const res = store.getState().switchMode("image");
    expect(res.ok).toBe(true);

    const state = store.getState();
    expect(state.activeMode).toBe("image");
    expect(state.parameterValues.images).toBeUndefined();
    expect(state.prompt).toBe("A beautiful scenery with");
    expect(state.parameterValues.aspect_ratio).toBe("16:9");
  });

  it("no eligible model for the target: returns fail(NO_ELIGIBLE_MODEL) and state is UNCHANGED", () => {
    // Store with modelsMap containing only image models
    const onlyImageModelsMap = {
      [normalizedImagesListModel.id]: normalizedImagesListModel,
    };

    const store = createPromptBarStore(
      {
        modelsMap: onlyImageModelsMap,
        selectedModelId: normalizedImagesListModel.id,
        activeMode: "image",
        activeSubMode: "frames",
        prompt: "Untouched prompt",
        parameterValues: { aspect_ratio: "1:1" },
      },
      {
        template: generatedMediaTemplate,
        models: onlyImageModelsMap,
      }
    );

    const listener = vi.fn();
    store.subscribe(listener);

    // Attempt to switch to video frames where NO eligible model exists
    const res = store.getState().switchMode("video", "frames");

    expect(res.ok).toBe(false);
    expect(res.reason).toBe(REASONS.NO_ELIGIBLE_MODEL);

    // State must be completely UNCHANGED
    const state = store.getState();
    expect(state.activeMode).toBe("image");
    expect(state.prompt).toBe("Untouched prompt");
    expect(state.parameterValues.aspect_ratio).toBe("1:1");
    // Zero notifications
    expect(listener).toHaveBeenCalledTimes(0);
  });

  describe("Matrix test: 3 models x 4 transitions assert single notification and atomic cleanup", () => {
    const transitions = [
      {
        id: "T1",
        label: "image -> video/frames",
        targetMode: "video",
        targetSubMode: "frames",
        expectedModelId: normalizedFramesModel.id,
      },
      {
        id: "T2",
        label: "video/frames -> video/reference",
        targetMode: "video",
        targetSubMode: "reference",
        expectedModelId: videoRefModel.id,
      },
      {
        id: "T3",
        label: "video/reference -> image",
        targetMode: "image",
        targetSubMode: "frames",
        expectedModelId: normalizedImagesListModel.id,
      },
      {
        id: "T4",
        label: "video/frames -> image",
        targetMode: "image",
        targetSubMode: "frames",
        expectedModelId: normalizedImagesListModel.id,
      },
    ];

    const initialModels = [
      {
        model: normalizedFramesModel,
        initialMode: "video",
        initialSubMode: "frames",
        initialParams: { input_image: { workflow_id: "f_start" }, last_frame: { workflow_id: "f_end" }, aspect_ratio: "16:9" },
        initialPrompt: "From <media:f_start> to <media:f_end>",
      },
      {
        model: normalizedImagesListModel,
        initialMode: "image",
        initialSubMode: "frames",
        initialParams: { images: [{ workflow_id: "img_ref" }], aspect_ratio: "16:9" },
        initialPrompt: "Image with <media:img_ref>",
      },
      {
        model: normalizedPromptOnlyModel,
        initialMode: "image",
        initialSubMode: "frames",
        initialParams: { aspect_ratio: "16:9" },
        initialPrompt: "Pure text prompt without media",
      },
    ];

    for (const { model, initialMode, initialSubMode, initialParams, initialPrompt } of initialModels) {
      for (const { id, label, targetMode, targetSubMode } of transitions) {
        it(`[Model: ${model.id}] [${id}: ${label}] executes atomically with exactly 1 notification`, () => {
          const store = createTestStore({
            activeMode: initialMode,
            activeSubMode: initialSubMode,
            selectedModelId: model.id,
            parameterValues: { ...initialParams },
            prompt: initialPrompt,
          });

          const listener = vi.fn();
          store.subscribe(listener);

          const res = store.getState().switchMode(targetMode, targetSubMode);
          expect(res.ok).toBe(true);
          // Asserts exactly ONE store notification
          expect(listener).toHaveBeenCalledTimes(1);

          const state = store.getState();
          expect(state.activeMode).toBe(targetMode);
          expect(state.activeSubMode).toBe(targetSubMode);
          
          const expectedTargetModelId =
            targetMode === "video"
              ? targetSubMode === "frames"
                ? normalizedFramesModel.id
                : videoRefModel.id
              : model.domain === "image"
                ? model.id
                : normalizedImagesListModel.id;

          expect(state.selectedModelId).toBe(expectedTargetModelId);
          // Asserts media dropped and tags cleaned
          expect(state.parameterValues.images).toBeUndefined();
          expect(state.parameterValues.input_image).toBeUndefined();
          expect(state.parameterValues.last_frame).toBeUndefined();
          expect(state.prompt).not.toContain("<media:");
          // Non-media parameters preserved via reconciliation
          expect(state.parameterValues.aspect_ratio).toBe("16:9");
        });
      }
    }
  });
});

