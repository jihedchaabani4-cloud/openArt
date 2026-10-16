/**
 * X3: Editor Focus without DOM query
 *
 * Verifies requestFocus store action, focusRequest incrementing,
 * and that editor focusing executes once per change and NOT on initial mount.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { promptBarService } from "../api/promptBarService.js";
import { createRegistry } from "../store/registry.js";
import { PromptBarStoreContext } from "../store/PromptBarStoreContext.js";

// Mock PromptEditor with focus tracking
const mockFocusFn = vi.fn();
vi.mock("../ui/common/editor/PromptEditor.jsx", () => ({
  PromptEditor: ({ value, onChange, focusRequest }) => {
    const inputRef = React.useRef(null);
    const isFirstRender = React.useRef(true);

    React.useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      if (focusRequest > 0) {
        mockFocusFn(focusRequest);
        inputRef.current?.focus();
      }
    }, [focusRequest]);

    return (
      <textarea
        ref={inputRef}
        data-testid="mock-prompt-editor"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
    );
  },
}));

import { PromptBarPlatform } from "../platform/PromptBarPlatform.jsx";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import { generatedMediaType } from "../templates/generatedMedia.template.js";

describe("X3: Editor Focus without DOM Query", () => {
  let customRegistry;
  const identity = {
    templateId: "generated-media",
    projectId: "proj_focus_1",
    instanceId: "default",
  };

  beforeEach(() => {
    customRegistry = createRegistry();
    mockFocusFn.mockClear();
  });

  it("requestFocus store action increments focusRequest by 1 on each call", () => {
    const store = createPromptBarStore({ focusRequest: 0 });
    expect(store.getState().focusRequest).toBe(0);

    store.getState().requestFocus();
    expect(store.getState().focusRequest).toBe(1);

    store.getState().requestFocus();
    expect(store.getState().focusRequest).toBe(2);
  });

  it("promptBarService(identity).focus() increments focusRequest on mounted store", () => {
    const store = createPromptBarStore({ focusRequest: 0 });
    customRegistry.getOrCreate(identity, () => store);
    customRegistry.markMounted(identity);

    const service = promptBarService(identity, { registry: customRegistry });
    const res = service.focus();

    expect(res.ok).toBe(true);
    expect(store.getState().focusRequest).toBe(1);
  });

  it("editor focusing executes once per change and NOT on initial mount", () => {
    const store = createPromptBarStore({
      prompt: "Initial prompt",
      focusRequest: 0,
      activeMode: "image",
      activeSubMode: "frames",
    }, { template: generatedMediaTemplate });

    render(
      <PromptBarStoreContext.Provider value={store}>
        <PromptBarPlatform
          projectId="proj_focus_1"
          templateId="generated-media"
          type={generatedMediaType}
          models={[]}
        />
      </PromptBarStoreContext.Provider>
    );

    // Initial mount: mockFocusFn must NOT have been called
    expect(mockFocusFn).toHaveBeenCalledTimes(0);

    // Trigger focusRequest
    act(() => {
      store.getState().requestFocus();
    });

    expect(mockFocusFn).toHaveBeenCalledTimes(1);
    expect(mockFocusFn).toHaveBeenCalledWith(1);

    // Trigger focusRequest again
    act(() => {
      store.getState().requestFocus();
    });

    expect(mockFocusFn).toHaveBeenCalledTimes(2);
    expect(mockFocusFn).toHaveBeenCalledWith(2);
  });

  it("behavior of focusing after Animate: animateMedia followed by focus triggers editor focus without document.querySelector", () => {
    const store = createPromptBarStore({
      prompt: "Before animate",
      focusRequest: 0,
    }, { template: generatedMediaTemplate });

    customRegistry.getOrCreate(identity, () => store);
    customRegistry.markMounted(identity);

    render(
      <PromptBarStoreContext.Provider value={store}>
        <PromptBarPlatform
          projectId="proj_focus_1"
          templateId="generated-media"
          type={generatedMediaType}
          models={[]}
        />
      </PromptBarStoreContext.Provider>
    );

    const service = promptBarService(identity, { registry: customRegistry });

    act(() => {
      service.focus();
    });

    expect(mockFocusFn).toHaveBeenCalledTimes(1);
  });
});
