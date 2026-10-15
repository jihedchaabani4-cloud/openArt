/**
 * Prompt-Only Template Proof (PB-D-13 / Phase P7 Task W4)
 *
 * Proves that:
 * 1. The Prompt Bar platform supports templates with no model selector and no modes (features.models = false, features.modes = false).
 * 2. Slot attachment works via attachMedia without model-based parameters.
 * 3. Serialization outputs prompt, mapped media keys, static parameters, and omits `model`.
 * 4. Model and mode switching commands are not required and are not called.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act, screen, cleanup } from "@testing-library/react";
import React from "react";

// Mock unavoidable DOM/routing dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/cinema-studio/proj_test/assets",
}));

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

import { PromptBarPlatform } from "../platform/PromptBarPlatform.jsx";
import { promptOnlyTemplate, STATIC_PARAMETERS } from "./fixtures/promptOnly.template.js";
import { clearPersistentPromptBarStores, getActivePromptBarStore } from "../store/PromptBarStoreContext.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";

function mountPromptOnlyBar({
  projectId = "prompt_only_proj",
  onGenerate = vi.fn(),
} = {}) {
  window.history.pushState({}, "", `/cinema-studio/${projectId}`);

  const renderResult = render(
    <PromptBarPlatform
      type={promptOnlyTemplate}
      featureConfig={promptOnlyTemplate}
      models={[]}
      onGenerate={onGenerate}
      projectId={projectId}
      persistKey={`test-prompt-only-${projectId}`}
    />
  );

  const store = getActivePromptBarStore();
  return { renderResult, store, onGenerate, unmount: renderResult.unmount };
}

describe("W4: Proof that model and mode are optional (PB-D-13)", () => {
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

  it("(a) renders with no model selector and no mode toggle", () => {
    const { renderResult } = mountPromptOnlyBar();

    // Mode toggles must not exist
    expect(screen.queryByRole("radio", { name: /image/i })).toBeNull();
    expect(screen.queryByRole("radio", { name: /video/i })).toBeNull();
    expect(screen.queryByText("Image")).toBeNull();
    expect(screen.queryByText("Video")).toBeNull();

    // Slots row must render the 3 custom slots
    expect(screen.getByText("Front View")).toBeDefined();
    expect(screen.getByText("Side View")).toBeDefined();
    expect(screen.getByText("Close-up")).toBeDefined();

    // Prompt editor must be present
    expect(screen.getByTestId("mock-prompt-editor")).toBeDefined();

    // Model name or icon in the trigger button must not exist
    expect(screen.queryByAltText("model icon")).toBeNull();
  });

  it("(b) attaching media in the three roles works through attachMedia", () => {
    const store = createPromptBarStore(
      { template: promptOnlyTemplate },
      { template: promptOnlyTemplate }
    );

    const frontMedia = { id: "wf_front_101", url: "https://example.com/front.png" };
    const sideMedia = { id: "wf_side_102", url: "https://example.com/side.png" };
    const closeupMedia = { id: "wf_close_103", url: "https://example.com/closeup.png" };

    const resFront = store.getState().attachMedia({ role: "front", value: frontMedia });
    expect(resFront.ok).toBe(true);

    const resSide = store.getState().attachMedia({ role: "side", value: sideMedia });
    expect(resSide.ok).toBe(true);

    const resCloseup = store.getState().attachMedia({ role: "closeup", value: closeupMedia });
    expect(resCloseup.ok).toBe(true);

    const values = store.getState().parameterValues;
    expect(values.front_image).toBeDefined();
    expect(values.front_image.workflow_id).toBe("wf_front_101");
    expect(values.side_image).toBeDefined();
    expect(values.side_image.workflow_id).toBe("wf_side_102");
    expect(values.closeup_image).toBeDefined();
    expect(values.closeup_image.workflow_id).toBe("wf_close_103");
  });

  it("(c) serialize produces a payload with prompt, mapped media keys, static parameters, and NO model id", () => {
    const store = createPromptBarStore(
      {
        template: promptOnlyTemplate,
        prompt: "A photorealistic character portrait from multiple angles",
      },
      { template: promptOnlyTemplate }
    );

    // Attach media
    store.getState().attachMedia({
      role: "front",
      value: { id: "wf_front_101", url: "https://example.com/front.png" },
    });
    store.getState().attachMedia({
      role: "side",
      value: { id: "wf_side_102", url: "https://example.com/side.png" },
    });
    store.getState().attachMedia({
      role: "closeup",
      value: { id: "wf_close_103", url: "https://example.com/closeup.png" },
    });

    const payload = store.getState().serialize();

    // 1. Prompt is preserved
    expect(payload.prompt).toBe("A photorealistic character portrait from multiple angles");

    // 2. Mapped media parameters are emitted with workflow IDs
    expect(payload.parameters.front_image).toBe("wf_front_101");
    expect(payload.parameters.side_image).toBe("wf_side_102");
    expect(payload.parameters.closeup_image).toBe("wf_close_103");

    // 3. Static parameters are emitted with their defaults or values
    expect(payload.parameters.style).toBe("cinematic");
    expect(payload.parameters.lighting).toBe("natural");

    // 4. Model ID is completely omitted
    expect("model" in payload).toBe(false);
    expect(payload.model).toBeUndefined();

    // 5. References contains all attached media IDs
    expect(payload.references).toEqual(
      expect.arrayContaining(["wf_front_101", "wf_side_102", "wf_close_103"])
    );
  });

  it("(d) switchMode and selectModel are not required to exist and are not called", () => {
    const selectModelSpy = vi.fn();
    const switchModeSpy = vi.fn();

    const minimalTemplate = {
      id: "minimal-prompt-only",
      features: { models: false, modes: false },
      layout: { showModelSelector: false, showModeSelector: false },
      parameters: STATIC_PARAMETERS,
      getSlots: () => [],
      filterEligibleModels: () => [],
      resolveParameterMapping: () => null,
    };

    const store = createPromptBarStore(
      {
        template: minimalTemplate,
        selectModel: selectModelSpy,
        switchMode: switchModeSpy,
      },
      { template: minimalTemplate }
    );

    // Initial state has no selectedModelId
    expect(store.getState().selectedModelId).toBeNull();
    expect(selectModelSpy).not.toHaveBeenCalled();
    expect(switchModeSpy).not.toHaveBeenCalled();
  });

  it("(e) clicking Generate in mounted bar invokes onGenerate with serialized payload omitting model", async () => {
    const onGenerate = vi.fn();
    const { store } = mountPromptOnlyBar({ onGenerate });

    act(() => {
      store.getState().setPrompt("Create a warrior character");
    });

    const generateBtn = screen.getByRole("button", { name: "Generate" });
    expect(generateBtn.disabled).toBe(false);

    await act(async () => {
      generateBtn.click();
    });

    expect(onGenerate).toHaveBeenCalledTimes(1);
    const sentPayload = onGenerate.mock.calls[0][0];
    expect(sentPayload.prompt).toBe("Create a warrior character");
    expect("model" in sentPayload).toBe(false);
    expect(sentPayload.parameters.style).toBe("cinematic");
  });
});
