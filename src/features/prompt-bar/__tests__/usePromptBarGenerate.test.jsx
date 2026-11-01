import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePromptBarGenerate } from "../platform/hooks/usePromptBarGenerate.js";
import { PromptBarStoreContext } from "../store/PromptBarStoreContext.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { createPromptBarType } from "../composition/createPromptBarType.js";

const imageModel = {
  id: "img-nano",
  name: "Nano Model",
  domain: "image",
  pricing: { fixedPrice: 5 },
  parameters: {
    prompt: { type: "string" },
  },
};

describe("usePromptBarGenerate hook", () => {
  it("computes estimatedCredits and ratio info", () => {
    const type = createPromptBarType({ id: "test", layout: {} });
    const store = createPromptBarStore({ type });
    store.getState().setModels([imageModel]);
    store.getState().selectModel("img-nano");

    const wrapper = ({ children }) => (
      <PromptBarStoreContext.Provider value={store}>
        {children}
      </PromptBarStoreContext.Provider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarGenerate({
          currentModel: imageModel,
          selectedId: "img-nano",
          isCurrentEligible: true,
          activeMode: "image",
          activeSubMode: "frames",
          startVal: null,
          onGenerate: vi.fn(),
        }),
      { wrapper }
    );

    expect(result.current.currentRatio).toBe("1:1");
    expect(result.current.currentCount).toBe(1);
    expect(result.current.estimatedCredits).toBe(5);
    expect(result.current.isGenerateDisabled).toBe(false);
  });

  it("disables generate in frames mode if startVal is missing", () => {
    const type = createPromptBarType({ id: "test", layout: {} });
    const store = createPromptBarStore({ type });

    const wrapper = ({ children }) => (
      <PromptBarStoreContext.Provider value={store}>
        {children}
      </PromptBarStoreContext.Provider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarGenerate({
          currentModel: imageModel,
          selectedId: "img-nano",
          isCurrentEligible: true,
          activeMode: "video",
          activeSubMode: "frames",
          startVal: null,
          onGenerate: vi.fn(),
        }),
      { wrapper }
    );

    expect(result.current.isFramesMode).toBe(true);
    expect(result.current.isGenerateDisabled).toBe(true);
  });

  it("allows generate in video frames mode when startVal is null but prompt is provided (Text-to-Video)", () => {
    const type = createPromptBarType({ id: "test", layout: {} });
    const store = createPromptBarStore({ type });
    store.getState().setPrompt("A majestic dragon in flight");

    const wrapper = ({ children }) => (
      <PromptBarStoreContext.Provider value={store}>
        {children}
      </PromptBarStoreContext.Provider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarGenerate({
          currentModel: imageModel,
          selectedId: "img-nano",
          isCurrentEligible: true,
          activeMode: "video",
          activeSubMode: "frames",
          startVal: null,
          onGenerate: vi.fn(),
        }),
      { wrapper }
    );

    expect(result.current.isFramesMode).toBe(true);
    expect(result.current.isGenerateDisabled).toBe(false);
  });

  it("triggers onGenerate with serialized result on handleGenerate", async () => {
    const type = createPromptBarType({ id: "test", layout: {} });
    const store = createPromptBarStore({ type });
    store.getState().setPrompt("A cybernetic apple");
    store.getState().setModels([imageModel]);
    store.getState().selectModel("img-nano");

    const onGenerate = vi.fn();

    const wrapper = ({ children }) => (
      <PromptBarStoreContext.Provider value={store}>
        {children}
      </PromptBarStoreContext.Provider>
    );

    const { result } = renderHook(
      () =>
        usePromptBarGenerate({
          currentModel: imageModel,
          selectedId: "img-nano",
          isCurrentEligible: true,
          activeMode: "image",
          activeSubMode: "frames",
          startVal: null,
          onGenerate,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.handleGenerate();
    });

    expect(onGenerate).toHaveBeenCalledTimes(1);
    expect(onGenerate.mock.calls[0][0].prompt).toBe("A cybernetic apple");
  });
});
