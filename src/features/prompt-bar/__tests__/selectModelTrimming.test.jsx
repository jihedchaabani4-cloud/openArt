/**
 * T4: Model-Switch Trimming Tests (PB-K3)
 *
 * Verifies that selecting a model with a lower max image count trims and cleans tags
 * exactly once in the store command, and that PromptBarPlatform does not trim again.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import React from "react";

// Mock router
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/cinema-studio/proj_trim/assets",
}));

// Mock PromptEditor
vi.mock("../ui/common/editor/PromptEditor.jsx", () => ({
  PromptEditor: ({ value, onChange, placeholder }) => (
    <textarea
      data-testid="mock-prompt-editor"
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { PromptBarPlatform } from "../platform/PromptBarPlatform.jsx";
import { generatedMediaType } from "../composition/generatedMedia.type.js";
import {
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
} from "../features/generated-media/generatedMedia.config.js";
import { clearPersistentPromptBarStores } from "../store/PromptBarStoreContext.js";

const featureConfig = {
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
};

describe("T4: One Place for Model-Switch Trimming (PB-K3)", () => {
  const modelManyRefs = {
    id: "model_many_refs",
    name: "Model Many Refs",
    domain: "image",
    parameters: {
      prompt: { type: "text" },
      images: { type: "image[]", max: 4 },
      aspect_ratio: { type: "select", default: "1:1" },
    },
  };

  const modelOneRef = {
    id: "model_one_ref",
    name: "Model One Ref",
    domain: "image",
    parameters: {
      prompt: { type: "text" },
      images: { type: "image[]", max: 1 },
      aspect_ratio: { type: "select", default: "1:1" },
    },
  };

  const modelsList = [modelManyRefs, modelOneRef];
  const modelsMap = {
    [modelManyRefs.id]: modelManyRefs,
    [modelOneRef.id]: modelOneRef,
  };

  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      window.history.pushState({}, "", "/");
    }
    clearPersistentPromptBarStores();
  });

  afterEach(() => {
    cleanup();
  });

  it("store-level: selectModel trims excess images and cleans tags exactly once", () => {
    const store = createPromptBarStore({
      modelsMap,
      selectedModelId: "model_many_refs",
      activeMode: "image",
      prompt: "Portrait of <media:ref_1> and <media:ref_2>",
      parameterValues: {
        images: [
          { workflow_id: "ref_1", name: "Ref 1" },
          { workflow_id: "ref_2", name: "Ref 2" },
        ],
        aspect_ratio: "1:1",
      },
    });

    const subscriberSpy = vi.fn();
    store.subscribe(subscriberSpy);

    // Switch to model with maxRefs = 1
    store.getState().selectModel("model_one_ref");

    const state = store.getState();
    expect(state.selectedModelId).toBe("model_one_ref");
    // images trimmed to 1 item (object when maxRefs === 1 per SAFE-3)
    expect(state.parameterValues.images).toEqual({ workflow_id: "ref_1", name: "Ref 1" });
    // Tag for ref_2 cleaned from prompt
    expect(state.prompt).toBe("Portrait of <media:ref_1> and");
    expect(state.prompt.includes("ref_2")).toBe(false);

    // Exactly one notification
    expect(subscriberSpy).toHaveBeenCalledTimes(1);
  });

  it("platform-level: PromptBarPlatform does NOT call setParameter or setPrompt again after selectModel", async () => {
    const store = createPromptBarStore({
      modelsMap,
      selectedModelId: "model_many_refs",
      activeMode: "image",
      prompt: "Picture with <media:ref_1> and <media:ref_2>",
      parameterValues: {
        images: [
          { workflow_id: "ref_1", name: "Ref 1" },
          { workflow_id: "ref_2", name: "Ref 2" },
        ],
        aspect_ratio: "1:1",
      },
    });

    render(
      <PromptBarPlatform
        type={generatedMediaType}
        featureConfig={featureConfig}
        models={modelsList}
        store={store}
        persist={false}
      />
    );

    // Spy on setParameter and setPrompt
    const originalSetParameter = store.getState().setParameter;
    const originalSetPrompt = store.getState().setPrompt;
    const setParameterSpy = vi.fn((...args) => originalSetParameter(...args));
    const setPromptSpy = vi.fn((...args) => originalSetPrompt(...args));

    store.setState({
      setParameter: setParameterSpy,
      setPrompt: setPromptSpy,
    });

    // Switch model directly on the store
    act(() => {
      store.getState().selectModel("model_one_ref");
    });

    // Verify store state has already trimmed
    expect(store.getState().parameterValues.images).toEqual({ workflow_id: "ref_1", name: "Ref 1" });
    expect(store.getState().prompt).toBe("Picture with <media:ref_1> and");

    // The Platform's duplicate effect MUST NOT have called setParameter or setPrompt!
    expect(setParameterSpy).toHaveBeenCalledTimes(0);
    expect(setPromptSpy).toHaveBeenCalledTimes(0);
  });
});
