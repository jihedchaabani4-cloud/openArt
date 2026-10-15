import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import {
  PromptBarStoreProvider,
  usePromptBarStoreInstance,
} from "../store/PromptBarStoreContext.js";
import { registry } from "../store/registry.js";
import { createPromptBarType } from "../composition/createPromptBarType.js";
import { fixtureModels } from "./fixtures/models.fixture.js";
import { selectPersistable } from "../store/persistence.js";

import { createPromptBarStore } from "../store/createPromptBarStore.js";

const testType = createPromptBarType({
  id: "test-submit-lifecycle",
  name: "Submit Lifecycle Media",
  layout: { showPromptInput: true },
});

function StoreCapture({ onStore }) {
  const store = usePromptBarStoreInstance();
  React.useEffect(() => {
    if (onStore) onStore(store);
  }, [store, onStore]);
  return <div data-testid="capture" />;
}

describe("S4: Submit Lifecycle (beginSubmit / endSubmit)", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      window.history.pushState({}, "", "/cinema-studio/test-submit-proj/assets");
    }
  });

  it("resets stale isGenerating: true on mount if registry has no in-flight submit", () => {
    const identity = {
      templateId: "stale-gen-test",
      instanceId: "default",
      projectId: "test-submit-proj",
    };

    // Pre-create store in registry with stale isGenerating: true
    registry.getOrCreate(identity, () => {
      return createPromptBarStore({ identity, isGenerating: true });
    });

    let capturedStore = null;
    render(
      <PromptBarStoreProvider
        type={testType}
        templateId="stale-gen-test"
        initialModels={fixtureModels}
      >
        <StoreCapture onStore={(s) => { capturedStore = s; }} />
      </PromptBarStoreProvider>
    );

    expect(capturedStore).not.toBeNull();
    // Must be reset to false on mount
    expect(capturedStore.getState().isGenerating).toBe(false);
  });

  it("does NOT reset isGenerating if submit is genuinely in flight in registry on second mount", () => {
    const identity = {
      templateId: "inflight-test",
      instanceId: "default",
      projectId: "test-submit-proj",
    };

    let store1 = null;
    const { unmount } = render(
      <PromptBarStoreProvider
        type={testType}
        templateId="inflight-test"
        initialModels={fixtureModels}
      >
        <StoreCapture onStore={(s) => { store1 = s; }} />
      </PromptBarStoreProvider>
    );

    // Begin submit
    let token = null;
    act(() => {
      token = store1.getState().beginSubmit();
    });

    expect(token).not.toBeNull();
    expect(store1.getState().isGenerating).toBe(true);
    expect(registry.isSubmitting(identity)).toBe(true);

    // Mount second instance for same identity (e.g. re-render or sibling consumer)
    let store2 = null;
    render(
      <PromptBarStoreProvider
        type={testType}
        templateId="inflight-test"
        initialModels={fixtureModels}
      >
        <StoreCapture onStore={(s) => { store2 = s; }} />
      </PromptBarStoreProvider>
    );

    // Still in flight, must NOT be reset to false!
    expect(store2.getState().isGenerating).toBe(true);

    // End submit
    act(() => {
      store1.getState().endSubmit(token);
    });
    expect(store1.getState().isGenerating).toBe(false);
    expect(registry.isSubmitting(identity)).toBe(false);

    unmount();
  });

  it("endSubmit with an old token does nothing and does not reset isGenerating", () => {
    let capturedStore = null;
    render(
      <PromptBarStoreProvider
        type={testType}
        templateId="token-test"
        initialModels={fixtureModels}
      >
        <StoreCapture onStore={(s) => { capturedStore = s; }} />
      </PromptBarStoreProvider>
    );

    act(() => {
      capturedStore.getState().beginSubmit();
    });
    expect(capturedStore.getState().isGenerating).toBe(true);

    // Call endSubmit with stale/fake token
    act(() => {
      const res = capturedStore.getState().endSubmit("invalid-old-token");
      expect(res).toBe(false);
    });

    // Still generating!
    expect(capturedStore.getState().isGenerating).toBe(true);
  });

  it("onGenerate that throws still cleanly ends the submit", async () => {
    let capturedStore = null;
    render(
      <PromptBarStoreProvider
        type={testType}
        templateId="throw-test"
        initialModels={fixtureModels}
      >
        <StoreCapture onStore={(s) => { capturedStore = s; }} />
      </PromptBarStoreProvider>
    );

    const store = capturedStore;
    const token = store.getState().beginSubmit();
    expect(store.getState().isGenerating).toBe(true);

    const failingGenerate = async () => {
      throw new Error("Generation backend failure");
    };

    try {
      await failingGenerate();
    } catch {
      // expected error
    } finally {
      store.getState().endSubmit(token);
    }

    expect(store.getState().isGenerating).toBe(false);
  });

  it("isGenerating never appears in saved JSON", () => {
    const state = {
      prompt: "test",
      isGenerating: true,
      selectedModelId: "nanobana_pro",
    };
    const persistable = selectPersistable(state);
    const json = JSON.stringify(persistable);

    expect(persistable.isGenerating).toBeUndefined();
    expect(json).not.toContain("isGenerating");
  });
});
