import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { render, cleanup } from "@testing-library/react";
import { usePromptBarRouteWatcher } from "../store/usePromptBarRouteWatcher.js";
import { createRegistry } from "../store/registry.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { removeSaved } from "../store/persistence.js";

function MockStorage() {
  const store = new Map();
  return {
    getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
    setItem: vi.fn((k, v) => store.set(k, String(v))),
    removeItem: vi.fn((k) => store.delete(k)),
    clear: vi.fn(() => store.clear()),
    _raw: store,
  };
}

describe("usePromptBarRouteWatcher (PB-D-14 / W2b)", () => {
  let mockStorage;
  let customRegistry;

  const studioPersistRoutes = [
    "/cinema-studio/:projectId/assets",
    "/cinema-studio/:projectId/collection/*",
  ];

  beforeEach(() => {
    mockStorage = MockStorage();
    customRegistry = createRegistry();
  });

  afterEach(() => {
    cleanup();
  });

  function TestWatcherComponent({ pathname, registry, storage }) {
    usePromptBarRouteWatcher({ pathname, registry, storage });
    return <div data-testid="watcher-mounted">Watcher Active</div>;
  }

  function setupInstance({ templateId = "generated-media", instanceId = "default", projectId = "proj_1", persistRoutes = studioPersistRoutes, initialPrompt = "" }) {
    const identity = { templateId, instanceId, projectId };
    const canonicalKey = customRegistry.identityKey(identity);
    const store = customRegistry.getOrCreate(
      identity,
      () =>
        createPromptBarStore({
          identity,
          prompt: initialPrompt,
          modelsMap: {},
        }),
      {
        persistRoutes,
        storage: mockStorage,
        canonicalKey,
      }
    );

    if (initialPrompt) {
      mockStorage.setItem(canonicalKey, JSON.stringify({ prompt: initialPrompt }));
    }

    return { identity, canonicalKey, store };
  }

  it("Allowed to allowed navigation: state and storage are kept", () => {
    const { store, canonicalKey } = setupInstance({
      projectId: "proj_1",
      initialPrompt: "User drafted prompt",
    });

    const { rerender } = render(
      <TestWatcherComponent
        pathname="/cinema-studio/proj_1/assets"
        registry={customRegistry}
        storage={mockStorage}
      />
    );

    expect(store.getState().prompt).toBe("User drafted prompt");
    expect(mockStorage.getItem(canonicalKey)).toBeTruthy();

    // Navigate to another allowed route: collection page
    rerender(
      <TestWatcherComponent
        pathname="/cinema-studio/proj_1/collection/folder_abc"
        registry={customRegistry}
        storage={mockStorage}
      />
    );

    expect(store.getState().prompt).toBe("User drafted prompt");
    expect(mockStorage.getItem(canonicalKey)).toBeTruthy();
  });

  it("Allowed to not allowed navigation (/cinema-studio/p1/settings): instance is reset and storage removed; instance without persistRoutes is untouched", () => {
    const { store: studioStore, canonicalKey: studioKey, identity: studioIdentity } = setupInstance({
      templateId: "generated-media",
      projectId: "p1",
      initialPrompt: "Studio Draft",
    });

    // Another template without persistRoutes (e.g. global utility bar)
    const { store: globalStore, canonicalKey: globalKey } = setupInstance({
      templateId: "unrestricted-template",
      projectId: "p1",
      persistRoutes: null,
      initialPrompt: "Global Note",
    });

    const { rerender } = render(
      <TestWatcherComponent
        pathname="/cinema-studio/p1/assets"
        registry={customRegistry}
        storage={mockStorage}
      />
    );

    expect(studioStore.getState().prompt).toBe("Studio Draft");
    expect(globalStore.getState().prompt).toBe("Global Note");

    // Navigate to settings (not in persistRoutes)
    rerender(
      <TestWatcherComponent
        pathname="/cinema-studio/p1/settings"
        registry={customRegistry}
        storage={mockStorage}
      />
    );

    // Studio store must be reset and its storage key purged
    expect(studioStore.getState().prompt).toBe("");
    expect(mockStorage.getItem(studioKey)).toBeNull();

    // Global store without persistRoutes must be completely untouched
    expect(globalStore.getState().prompt).toBe("Global Note");
    expect(mockStorage.getItem(globalKey)).toBeTruthy();
  });

  it("Coming back later: reflects defaults, not the old state", () => {
    const { store, canonicalKey } = setupInstance({
      projectId: "p1",
      initialPrompt: "Old prompt to forget",
    });

    const { rerender } = render(
      <TestWatcherComponent
        pathname="/cinema-studio/p1/assets"
        registry={customRegistry}
        storage={mockStorage}
      />
    );

    // Navigate out to settings -> triggers reset & storage removal
    rerender(
      <TestWatcherComponent
        pathname="/cinema-studio/p1/settings"
        registry={customRegistry}
        storage={mockStorage}
      />
    );

    expect(store.getState().prompt).toBe("");
    expect(mockStorage.getItem(canonicalKey)).toBeNull();

    // Navigate back to assets page
    rerender(
      <TestWatcherComponent
        pathname="/cinema-studio/p1/assets"
        registry={customRegistry}
        storage={mockStorage}
      />
    );

    // State remains default
    expect(store.getState().prompt).toBe("");
  });

  it("A submit in flight: is NOT reset when navigating away", () => {
    const { store, canonicalKey, identity } = setupInstance({
      projectId: "p1",
      initialPrompt: "Generating prompt...",
    });

    // Mark submit in flight
    customRegistry.beginSubmit(identity);
    expect(customRegistry.isSubmitting(identity)).toBe(true);

    const { rerender } = render(
      <TestWatcherComponent
        pathname="/cinema-studio/p1/assets"
        registry={customRegistry}
        storage={mockStorage}
      />
    );

    // Navigate to settings while submit is running
    rerender(
      <TestWatcherComponent
        pathname="/cinema-studio/p1/settings"
        registry={customRegistry}
        storage={mockStorage}
      />
    );

    // Must NOT be reset because submit is in flight
    expect(store.getState().prompt).toBe("Generating prompt...");
    expect(mockStorage.getItem(canonicalKey)).toBeTruthy();
  });

  /**
   * Rule: Cross-Project Navigation Policy
   * When navigating from Project A's allowed route to Project B's allowed route,
   * the current pathname (/cinema-studio/proj_B/assets) matches the template's allowed route
   * pattern (/cinema-studio/:projectId/assets). Therefore, Project A's saved state is NOT
   * destroyed simply by viewing Project B. Project A's state is only reset if the user navigates
   * to a non-allowed pathname (e.g. /cinema-studio/proj_B/settings or /dashboard).
   */
  it("Two projects: leaving project A's allowed pages for project B's allowed pages resets nothing of A's saved copy unless A's pathname is no longer allowed", () => {
    const { store: storeA, canonicalKey: keyA } = setupInstance({
      projectId: "proj_A",
      initialPrompt: "Prompt for Project A",
    });

    const { store: storeB, canonicalKey: keyB } = setupInstance({
      projectId: "proj_B",
      initialPrompt: "Prompt for Project B",
    });

    const { rerender } = render(
      <TestWatcherComponent
        pathname="/cinema-studio/proj_A/assets"
        registry={customRegistry}
        storage={mockStorage}
      />
    );

    expect(storeA.getState().prompt).toBe("Prompt for Project A");
    expect(mockStorage.getItem(keyA)).toBeTruthy();

    // Navigate to Project B's assets (both are allowed routes according to pattern)
    rerender(
      <TestWatcherComponent
        pathname="/cinema-studio/proj_B/assets"
        registry={customRegistry}
        storage={mockStorage}
      />
    );

    // Both remain intact because /cinema-studio/proj_B/assets is an allowed route
    expect(storeA.getState().prompt).toBe("Prompt for Project A");
    expect(mockStorage.getItem(keyA)).toBeTruthy();
    expect(storeB.getState().prompt).toBe("Prompt for Project B");
    expect(mockStorage.getItem(keyB)).toBeTruthy();

    // Now navigate to a route that is NOT allowed for anyone (e.g. /dashboard)
    rerender(
      <TestWatcherComponent
        pathname="/dashboard"
        registry={customRegistry}
        storage={mockStorage}
      />
    );

    // Now both instances with persistRoutes are reset and storage removed
    expect(storeA.getState().prompt).toBe("");
    expect(mockStorage.getItem(keyA)).toBeNull();
    expect(storeB.getState().prompt).toBe("");
    expect(mockStorage.getItem(keyB)).toBeNull();
  });
});
