import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePromptBarModels } from "../platform/hooks/usePromptBarModels.js";
import { PromptBarStoreProvider, usePromptBarService } from "../store/PromptBarStoreContext.js";

const mockModels = [
  { id: "img-1", name: "Image Model 1", domain: "image", parameters: { prompt: { type: "string" } } },
  { id: "vid-1", name: "Video Model 1", domain: "video", parameters: { input_image: { type: "image" }, last_frame: { type: "image" } } },
];

const mockTemplate = {
  id: "test-models-hook",
  layout: { showModeSelector: true },
  filterEligibleModels: (models, mode, _subMode) => {
    if (mode === "video") return models.filter((m) => m.domain === "video");
    return models.filter((m) => m.domain === "image");
  },
  resolveParameterMapping: () => null,
};

describe("usePromptBarModels hook", () => {
  it("syncs models into the store and filters eligible models synchronously", () => {
    const wrapper = ({ children }) => (
      <PromptBarStoreProvider template={mockTemplate} instanceId="models-1" persist={false}>
        {children}
      </PromptBarStoreProvider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarModels({
          models: mockModels,
          type: mockTemplate,
          featureConfig: mockTemplate,
        }),
      { wrapper }
    );

    expect(result.current.eligibleModels).toHaveLength(1);
    expect(result.current.eligibleModels[0].id).toBe("img-1");
    expect(result.current.currentModel?.id).toBe("img-1");
    expect(result.current.isCurrentEligible).toBe(true);
    expect(result.current.availableModes).toEqual(["image", "video"]);
  });

  it("synchronously switches to first eligible model on service.switchMode without post-render repair effect", () => {
    const wrapper = ({ children }) => (
      <PromptBarStoreProvider template={mockTemplate} instanceId="models-2" persist={false}>
        {children}
      </PromptBarStoreProvider>
    );

    const { result } = renderHook(
      () => {
        const service = usePromptBarService();
        const modelsHook = usePromptBarModels({
          models: mockModels,
          type: mockTemplate,
          featureConfig: mockTemplate,
        });
        return { service, ...modelsHook };
      },
      { wrapper }
    );

    expect(result.current.currentModel?.id).toBe("img-1");

    act(() => {
      result.current.service.switchMode("video");
    });

    expect(result.current.currentModel?.id).toBe("vid-1");
    expect(result.current.isCurrentEligible).toBe(true);
  });
});
