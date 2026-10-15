import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncElementDraft } from "@/features/workflows/model/elementSheetConfig";

describe("X5: syncElementDraft (ElementWorkflowEditPage Migration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDraft = {
    mode: "character",
    isVideo: false,
    references: [{ url: "https://example.com/ref.png" }],
    features: [{ label: "Blue eyes" }],
    promptConfig: {
      model: "test-model-element",
      ratio: "16:9",
      quality: "4K",
      videoResolution: "1080p",
    },
  };

  it("syncs draft to elementStore and dispatches applyGeneration through promptBarService", () => {
    const mockHydrateElementDraft = vi.fn();
    const mockResetElementStore = vi.fn();
    const mockApplyGeneration = vi.fn().mockReturnValue({ ok: true });
    const mockServiceFactory = vi.fn(() => ({
      applyGeneration: mockApplyGeneration,
    }));

    syncElementDraft(mockDraft, {
      elementStore: {
        hydrateElementDraft: mockHydrateElementDraft,
        resetElementStore: mockResetElementStore,
      },
      projectId: "proj_elem_123",
      serviceFactory: mockServiceFactory,
    });

    // 1. Must hydrate elementStore
    expect(mockHydrateElementDraft).toHaveBeenCalledWith({
      mode: "character",
      prompt: "",
      references: mockDraft.references,
      features: mockDraft.features,
    });

    // 2. Must target promptBarService with the project identity
    expect(mockServiceFactory).toHaveBeenCalledWith({
      templateId: "generated-media",
      projectId: "proj_elem_123",
    });

    // 3. Must dispatch applyGeneration with draft promptConfig
    expect(mockApplyGeneration).toHaveBeenCalledWith({
      mode: "image",
      subMode: "frames",
      modelId: "test-model-element",
      prompt: "",
      parameters: {
        ratio: "16:9",
        aspect_ratio: "16:9",
        quality: "4K",
        videoResolution: "1080p",
      },
    });

    expect(mockResetElementStore).not.toHaveBeenCalled();
  });

  it("resets elementStore when draft is null", () => {
    const mockHydrateElementDraft = vi.fn();
    const mockResetElementStore = vi.fn();
    const mockServiceFactory = vi.fn();

    syncElementDraft(null, {
      elementStore: {
        hydrateElementDraft: mockHydrateElementDraft,
        resetElementStore: mockResetElementStore,
      },
      projectId: "proj_elem_123",
      serviceFactory: mockServiceFactory,
    });

    expect(mockResetElementStore).toHaveBeenCalledTimes(1);
    expect(mockHydrateElementDraft).not.toHaveBeenCalled();
    expect(mockServiceFactory).not.toHaveBeenCalled();
  });
});
