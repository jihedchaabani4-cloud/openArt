import { describe, expect, it, vi } from "vitest";
import { createRegistry } from "../store/registry.js";
import { promptBarService } from "../api/promptBarService.js";

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
});
