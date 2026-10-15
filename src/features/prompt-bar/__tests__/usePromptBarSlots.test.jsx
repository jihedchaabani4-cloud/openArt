import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePromptBarSlots } from "../platform/hooks/usePromptBarSlots.js";
import { PromptBarStoreProvider, PromptBarStoreContext } from "../store/PromptBarStoreContext.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { createPromptBarType } from "../composition/createPromptBarType.js";
import {
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
} from "../features/generated-media/generatedMedia.config.js";

const featureConfig = {
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
};

const framesModel = {
  id: "video-ltx",
  name: "LTX Video",
  domain: "video",
  parameters: {
    input_image: { type: "image", group: "media" },
    last_frame: { type: "image", group: "media" },
    duration: { type: "number", default: 5 },
    prompt: { type: "string", isPrompt: true },
  },
};

describe("usePromptBarSlots hook", () => {
  it("resolves activeSlots and drawerParams for video frames mode", () => {
    const type = createPromptBarType({
      id: "generated-media",
      layout: { showModeSelector: true },
      referenceSlots: [
        { role: "start", label: "Start Frame" },
        { role: "end", label: "End Frame" },
      ],
    });

    const wrapper = ({ children }) => (
      <PromptBarStoreProvider type={type} persist={false}>
        {children}
      </PromptBarStoreProvider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarSlots({
          featureConfig,
          type,
          activeMode: "video",
          activeSubMode: "frames",
          currentModel: framesModel,
          parameters: framesModel.parameters,
        }),
      { wrapper }
    );

    expect(result.current.activeSlots).toHaveLength(2);
    expect(result.current.hasStart).toBe(true);
    expect(result.current.hasEnd).toBe(true);
    expect(result.current.showSwap).toBe(true);

    // drawerParams excludes media group and isPrompt
    expect(result.current.drawerParams).toHaveLength(1);
    expect(result.current.drawerParams[0][0]).toBe("duration");
  });

  it("handles frame swap when both start and end frames are filled", () => {
    const type = createPromptBarType({
      id: "generated-media",
      layout: { showModeSelector: true },
      referenceSlots: [
        { role: "start", label: "Start Frame" },
        { role: "end", label: "End Frame" },
      ],
    });
    const testStore = createPromptBarStore({ type, templateConfig: featureConfig });

    const wrapper = ({ children }) => (
      <PromptBarStoreContext.Provider value={testStore}>
        {children}
      </PromptBarStoreContext.Provider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarSlots({
          featureConfig,
          type,
          activeMode: "video",
          activeSubMode: "frames",
          currentModel: framesModel,
          parameters: framesModel.parameters,
        }),
      { wrapper }
    );

    expect(result.current.swapEnabled).toBe(false);

    act(() => {
      testStore.getState().setParameter("input_image", "start.jpg");
    });
    expect(result.current.swapEnabled).toBe(false);

    act(() => {
      testStore.getState().setParameter("last_frame", "end.jpg");
    });
    expect(result.current.swapEnabled).toBe(true);

    act(() => {
      result.current.handleSwapFrames();
    });

    expect(testStore.getState().parameterValues.input_image).toBe("end.jpg");
    expect(testStore.getState().parameterValues.last_frame).toBe("start.jpg");
  });
});
