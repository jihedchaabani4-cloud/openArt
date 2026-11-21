import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePromptBarSlots } from "../platform/hooks/usePromptBarSlots.js";
import { PromptBarStoreProvider, PromptBarStoreContext } from "../store/PromptBarStoreContext.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";

const framesModel = {
  id: "video-ltx",
  name: "LTX Video",
  domain: "video",
  capabilities: { input_image: true, last_frame: true },
  parameters: {
    input_image: { type: "image", group: "media" },
    last_frame: { type: "image", group: "media" },
    duration: { type: "number", default: 5 },
    prompt: { type: "string", isPrompt: true },
  },
};

describe("usePromptBarSlots hook", () => {
  it("resolves activeSlots and drawerParams for video frames mode", () => {
    const wrapper = ({ children }) => (
      <PromptBarStoreProvider template={generatedMediaTemplate} instanceId="slots-1" persist={false}>
        {children}
      </PromptBarStoreProvider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarSlots({
          featureConfig: generatedMediaTemplate,
          type: generatedMediaTemplate,
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

    expect(result.current.drawerParams).toHaveLength(1);
    expect(result.current.drawerParams[0][0]).toBe("duration");
  });

  it("atomically swaps start and end frames via service.swapFrames()", () => {
    const testStore = createPromptBarStore(
      { activeMode: "video", activeSubMode: "frames" },
      { template: generatedMediaTemplate }
    );
    testStore.getState().setModels([framesModel]);

    const wrapper = ({ children }) => (
      <PromptBarStoreContext.Provider value={testStore}>
        {children}
      </PromptBarStoreContext.Provider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarSlots({
          featureConfig: generatedMediaTemplate,
          type: generatedMediaTemplate,
          activeMode: "video",
          activeSubMode: "frames",
          currentModel: framesModel,
          parameters: framesModel.parameters,
        }),
      { wrapper }
    );

    expect(result.current.swapEnabled).toBe(false);

    act(() => {
      testStore.getState().attachMedia({ role: "start", value: { workflow_id: "start_1", url: "start.jpg" } });
    });
    expect(result.current.swapEnabled).toBe(false);

    act(() => {
      testStore.getState().attachMedia({ role: "end", value: { workflow_id: "end_1", url: "end.jpg" } });
    });
    expect(result.current.swapEnabled).toBe(true);

    act(() => {
      result.current.handleSwapFrames();
    });

    expect(testStore.getState().parameterValues.input_image.workflow_id).toBe("end_1");
    expect(testStore.getState().parameterValues.last_frame.workflow_id).toBe("start_1");
  });
});
