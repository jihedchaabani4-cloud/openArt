import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePromptBarModels } from "../platform/hooks/usePromptBarModels.js";
import { PromptBarStoreProvider } from "../store/PromptBarStoreContext.js";
import { createPromptBarType } from "../composition/createPromptBarType.js";

const mockModels = [
  { id: "img-1", name: "Image Model 1", domain: "image", parameters: { prompt: { type: "string" } } },
  { id: "vid-1", name: "Video Model 1", domain: "video", parameters: { input_image: { type: "image" }, last_frame: { type: "image" } } },
];

const mockFeatureConfig = {
  filterEligibleModels: (models, mode, _subMode) => {
    if (mode === "video") return models.filter((m) => m.domain === "video");
    return models.filter((m) => m.domain === "image");
  },
  resolveParameterMapping: () => null,
};

describe("usePromptBarModels hook", () => {
  it("syncs models into the store and filters eligible models", () => {
    const type = createPromptBarType({ id: "test", layout: { showModeSelector: true } });
    const wrapper = ({ children }) => (
      <PromptBarStoreProvider type={type} persist={false}>
        {children}
      </PromptBarStoreProvider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarModels({
          models: mockModels,
          type,
          featureConfig: mockFeatureConfig,
        }),
      { wrapper }
    );

    expect(result.current.eligibleModels).toHaveLength(1);
    expect(result.current.eligibleModels[0].id).toBe("img-1");
    expect(result.current.currentModel?.id).toBe("img-1");
    expect(result.current.isCurrentEligible).toBe(true);
    expect(result.current.availableModes).toEqual(["image", "video"]);
  });

  it("auto-selects first eligible model when mode changes", () => {
    const type = createPromptBarType({ id: "test", layout: { showModeSelector: true } });
    const wrapper = ({ children }) => (
      <PromptBarStoreProvider type={type} persist={false}>
        {children}
      </PromptBarStoreProvider>
    );

    const { result, rerender } = renderHook(
      ({ activeMode }) =>
        usePromptBarModels({
          models: mockModels,
          type,
          featureConfig: mockFeatureConfig,
          activeMode,
        }),
      {
        wrapper,
        initialProps: { activeMode: "image" },
      }
    );

    expect(result.current.currentModel?.id).toBe("img-1");

    rerender({ activeMode: "video" });
    expect(result.current.currentModel?.id).toBe("vid-1");
  });
});
