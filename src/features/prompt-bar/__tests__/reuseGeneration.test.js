import { describe, expect, it, vi } from "vitest";
import { createRegistry } from "../store/registry.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import { normalizedFramesModel } from "./fixtures/models.fixture.js";
import {
  promptBarService,
  resolveReusableGeneration,
  withPrimaryMediaFallback,
} from "../api/promptBarService.js";

describe("Reuse generation config", () => {
  const identity = {
    templateId: "generated-media",
    projectId: "project_1",
  };

  it("resolves only the primary media, infers video frames, and keeps references as workflow IDs", () => {
    const applyGeneration = vi.fn(() => ({ ok: true }));
    const registry = createRegistry();
    registry.getOrCreate(identity, () => ({
      getState: () => ({ applyGeneration }),
    }));
    registry.markMounted(identity);

    const workflow = {
      id: "workflow_1",
      workflow_type: "GENERATION",
      primary_media_id: "primary_media",
      items: [
        {
          id: "secondary_media",
          generationConfig: { model: "wrong-model", prompt: "Wrong prompt" },
        },
        {
          id: "primary_media",
          generationConfig: {
            model: "video-model",
            prompt: "Primary prompt",
            duration: 5,
            last_frame: { workflow_id: "end-workflow" },
            references: [
              { workflow_id: "character-workflow", url: "https://ignored.example/image.png" },
            ],
          },
        },
      ],
    };

    const resolveWorkflow = vi.fn((workflowId) =>
      workflowId === workflow.id ? workflow : null
    );
    const service = promptBarService(identity, { registry, resolveWorkflow });

    expect(service.reuseGeneration(workflow.id)).toEqual({ ok: true });
    expect(resolveWorkflow).toHaveBeenCalledWith(workflow.id);
    expect(applyGeneration).toHaveBeenCalledWith({
      mode: "video",
      subMode: "frames",
      modelId: "video-model",
      prompt: "Primary prompt",
      parameters: expect.objectContaining({ duration: 5 }),
      references: expect.arrayContaining([
        { workflow_id: "end-workflow", role: "end" },
        { workflow_id: "character-workflow", role: "reference" },
      ]),
      replaceParameters: true,
    });
  });

  it("fails without dispatching when the primary media has no reusable config", () => {
    const applyGeneration = vi.fn(() => ({ ok: true }));
    const registry = createRegistry();
    registry.getOrCreate(identity, () => ({
      getState: () => ({ applyGeneration }),
    }));
    registry.markMounted(identity);

    const service = promptBarService(identity, {
      registry,
      resolveWorkflow: () => ({
        id: "workflow_1",
        workflow_type: "GENERATION",
        items: [{ id: "primary", is_primary: true }],
      }),
    });

    expect(service.reuseGeneration("workflow_1").ok).toBe(false);
    expect(applyGeneration).not.toHaveBeenCalled();
  });

  it("reuses a failed primary media's params when no generationConfig was written", () => {
    const applyGeneration = vi.fn(() => ({ ok: true }));
    const registry = createRegistry();
    registry.getOrCreate(identity, () => ({
      getState: () => ({ applyGeneration }),
    }));
    registry.markMounted(identity);

    const service = promptBarService(identity, {
      registry,
      resolveWorkflow: () => ({
        id: "failed-workflow",
        workflow_type: "GENERATION",
        items: [{
          id: "failed-primary",
          is_primary: true,
          status: "failed",
          params: {
            model_name: "saved-model",
            prompt: "Saved before failure",
            aspect_ratio: "16:9",
          },
        }],
      }),
    });

    expect(service.reuseGeneration("failed-workflow")).toEqual({ ok: true });
    expect(applyGeneration).toHaveBeenCalledWith(expect.objectContaining({
      modelId: "saved-model",
      prompt: "Saved before failure",
      parameters: expect.objectContaining({ aspect_ratio: "16:9" }),
    }));
  });

  it("uses the failed card media when its workflow has not attached the primary item yet", () => {
    const failedCardMedia = {
      id: "failed-primary",
      status: "failed",
      generationConfig: {
        model: "gpt_image_2",
        prompt: "Saved prompt before the generation failed",
        parameters: { quality: "medium", aspect_ratio: "16:9" },
      },
    };

    const workflow = withPrimaryMediaFallback({
      id: "failed-workflow",
      workflow_type: "GENERATION",
      primary_media_id: "failed-primary",
      items: [],
    }, failedCardMedia);

    expect(resolveReusableGeneration(workflow)).toMatchObject({
      modelId: "gpt_image_2",
      prompt: "Saved prompt before the generation failed",
      parameters: { quality: "medium", aspect_ratio: "16:9" },
    });
  });

  it("applyGeneration preserves start/end keyframe URLs when resolveReusableGeneration also emits matching references without url", () => {
    const store = createPromptBarStore(
      { template: generatedMediaTemplate },
      { template: generatedMediaTemplate }
    );
    store.getState().setModels([normalizedFramesModel]);

    const workflow = {
      id: "wf-video-reuse",
      workflow_type: "GENERATION",
      primary_media_id: "primary-vid",
      items: [
        {
          id: "primary-vid",
          is_primary: true,
          is_video: true,
          generationConfig: {
            model: normalizedFramesModel.id,
            prompt: "Camera pans smoothly across the skyline",
            duration: 5,
            input_image: {
              workflow_id: "wf-start-frame",
              url: "https://cdn.example.com/start-frame.png",
              name: "Start Frame",
            },
            last_frame: {
              workflow_id: "wf-end-frame",
              url: "https://cdn.example.com/end-frame.png",
              name: "End Frame",
            },
          },
        },
      ],
    };

    const reusable = resolveReusableGeneration(workflow);
    expect(reusable.references).toEqual(
      expect.arrayContaining([
        { workflow_id: "wf-start-frame", role: "start" },
        { workflow_id: "wf-end-frame", role: "end" },
      ])
    );

    const res = store.getState().applyGeneration(reusable);
    expect(res.ok).toBe(true);

    const { parameterValues } = store.getState();
    expect(parameterValues.input_image).toMatchObject({
      workflow_id: "wf-start-frame",
      url: "https://cdn.example.com/start-frame.png",
    });
    expect(parameterValues.last_frame).toMatchObject({
      workflow_id: "wf-end-frame",
      url: "https://cdn.example.com/end-frame.png",
    });
  });
});
