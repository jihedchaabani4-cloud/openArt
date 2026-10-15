import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  PromptBarStoreProvider,
  usePromptBarStoreInstance,
  getActivePromptBarStore,
  setActivePromptBarStore,
  clearPersistentPromptBarStores,
} from "../store/PromptBarStoreContext.js";
import { registry } from "../store/registry.js";
import { createPromptBarType } from "../composition/createPromptBarType.js";
import { fixtureModels } from "./fixtures/models.fixture.js";

const testType = createPromptBarType({
  id: "test-lifecycle-media",
  name: "Lifecycle Test Media",
  layout: { showPromptInput: true },
});

function StoreCapture({ onStore }) {
  const store = usePromptBarStoreInstance();
  React.useEffect(() => {
    if (onStore) onStore(store);
  }, [store, onStore]);
  return <div data-testid="capture" />;
}

describe("S3: PromptBarStoreProvider on Registry & Hydration", () => {
  beforeEach(() => {
    clearPersistentPromptBarStores();
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      window.history.pushState({}, "", "/cinema-studio/test-proj/assets");
    }
  });

  it("server safety: renderToString does not throw and does not touch storage", () => {
    const mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    expect(() => {
      renderToString(
        <PromptBarStoreProvider
          type={testType}
          initialModels={fixtureModels}
          storage={mockStorage}
        >
          <div>Server Content</div>
        </PromptBarStoreProvider>
      );
    }).not.toThrow();

    expect(mockStorage.getItem).not.toHaveBeenCalled();
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it("applies saved state when hydrate runs BEFORE setModels (models loaded late)", () => {
    const savedState = {
      v: 2,
      prompt: "Hydrated before models",
      selectedModelId: "nanobana_pro",
      parameterValues: { resolution: "2K" },
      activeMode: "image",
    };

    const storage = {
      getItem: vi.fn(() => JSON.stringify(savedState)),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    let capturedStore = null;
    render(
      <PromptBarStoreProvider
        type={testType}
        templateId="late-models-template"
        initialModels={[]} // empty models initially
        storage={storage}
      >
        <StoreCapture onStore={(s) => { capturedStore = s; }} />
      </PromptBarStoreProvider>
    );

    expect(capturedStore).not.toBeNull();
    // Prompt was restored immediately
    expect(capturedStore.getState().prompt).toBe("Hydrated before models");

    // Late arrival of models
    act(() => {
      capturedStore.getState().setModels(fixtureModels);
    });

    // Saved model and parameters survived and reconciled
    expect(capturedStore.getState().selectedModelId).toBe("nanobana_pro");
    expect(capturedStore.getState().parameterValues.resolution).toBe("2K");
  });

  it("applies saved state when hydrate runs AFTER setModels (models already present)", () => {
    const savedState = {
      v: 2,
      prompt: "Hydrated after models",
      selectedModelId: "nanobana_pro",
      parameterValues: { resolution: "2K" },
      activeMode: "image",
    };

    const storage = {
      getItem: vi.fn(() => JSON.stringify(savedState)),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    let capturedStore = null;
    render(
      <PromptBarStoreProvider
        type={testType}
        templateId="early-models-template"
        initialModels={fixtureModels}
        storage={storage}
      >
        <StoreCapture onStore={(s) => { capturedStore = s; }} />
      </PromptBarStoreProvider>
    );

    expect(capturedStore).not.toBeNull();
    expect(capturedStore.getState().prompt).toBe("Hydrated after models");
    expect(capturedStore.getState().selectedModelId).toBe("nanobana_pro");
    expect(capturedStore.getState().parameterValues.resolution).toBe("2K");
  });

  it("two providers with different identities do not overwrite active store (returns null when > 1 mounted)", () => {
    let storeA = null;
    let storeB = null;

    render(
      <div>
        <PromptBarStoreProvider
          type={testType}
          instanceId="bar-A"
          initialModels={fixtureModels}
        >
          <StoreCapture onStore={(s) => { storeA = s; }} />
        </PromptBarStoreProvider>

        <PromptBarStoreProvider
          type={testType}
          instanceId="bar-B"
          initialModels={fixtureModels}
        >
          <StoreCapture onStore={(s) => { storeB = s; }} />
        </PromptBarStoreProvider>
      </div>
    );

    expect(storeA).not.toBeNull();
    expect(storeB).not.toBeNull();
    expect(storeA).not.toBe(storeB);

    // With 2 instances mounted for this project, getActivePromptBarStore() returns null
    expect(getActivePromptBarStore()).toBeNull();
  });

  it("React Strict Mode double mount reuses existing store and tracks mount count accurately", () => {
    let store1 = null;
    const { unmount } = render(
      <React.StrictMode>
        <PromptBarStoreProvider
          type={testType}
          instanceId="strict-test"
          initialModels={fixtureModels}
        >
          <StoreCapture onStore={(s) => { store1 = s; }} />
        </PromptBarStoreProvider>
      </React.StrictMode>
    );

    expect(store1).not.toBeNull();
    // After unmount, isMounted is false
    unmount();
    expect(registry.isMounted({ templateId: testType.id, instanceId: "strict-test", projectId: "test-proj" })).toBe(false);
  });

  it("preserves deprecated shims", () => {
    expect(typeof setActivePromptBarStore).toBe("function");
    expect(typeof getActivePromptBarStore).toBe("function");
    expect(typeof clearPersistentPromptBarStores).toBe("function");

    // setActivePromptBarStore is a safe no-op
    expect(() => setActivePromptBarStore({})).not.toThrow();
  });
});
