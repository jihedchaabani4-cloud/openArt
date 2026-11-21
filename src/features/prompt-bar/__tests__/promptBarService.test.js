/**
 * X1: promptBarService and Pending Action Queue Tests
 *
 * Hermetic tests verifying instance resolution, multi-instance isolation,
 * pending queue lifecycle, project mismatch protection, and core purity.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { createRegistry } from "../store/registry.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { promptBarService } from "../api/promptBarService.js";
import { usePromptBarSnapshot } from "../store/PromptBarStoreContext.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import { fixtureModels } from "./fixtures/models.fixture.js";
import {
  drainPendingActions,
  DEFAULT_PENDING_TTL_MS,
} from "../store/pendingActions.js";
import { REASONS } from "../core/commandResult.js";

function createMockStorage() {
  const store = new Map();
  return {
    getItem: vi.fn((key) => (store.has(key) ? store.get(key) : null)),
    setItem: vi.fn((key, value) => store.set(key, String(value))),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    _raw: store,
  };
}

describe("X1: promptBarService and pendingActions queue", () => {
  let customRegistry;
  let mockStorage;

  const identityA = {
    templateId: "generated-media",
    projectId: "proj_1",
    instanceId: "default",
  };

  const identityB = {
    templateId: "character",
    projectId: "proj_1",
    instanceId: "default",
  };

  beforeEach(() => {
    customRegistry = createRegistry();
    mockStorage = createMockStorage();
  });

  function setupMountedStore(identity, initial = {}) {
    const store = createPromptBarStore({
      prompt: initial.prompt || "",
      activeMode: "image",
      activeSubMode: "frames",
      selectedModelId: "model_1",
      ...initial,
    });
    customRegistry.getOrCreate(identity, () => store);
    customRegistry.markMounted(identity);
    return store;
  }

  it("mounted instance: setPrompt changes only that instance", () => {
    const storeA = setupMountedStore(identityA, { prompt: "Initial A" });
    const serviceA = promptBarService(identityA, { registry: customRegistry, storage: mockStorage });

    const res = serviceA.setPrompt("Updated prompt for A");
    expect(res.ok).toBe(true);
    expect(storeA.getState().prompt).toBe("Updated prompt for A");
  });

  it("two mounted instances with different template ids: action addressed to one never changes the other", () => {
    const storeA = setupMountedStore(identityA, { prompt: "Prompt A" });
    const storeB = setupMountedStore(identityB, { prompt: "Prompt B" });

    const serviceA = promptBarService(identityA, { registry: customRegistry, storage: mockStorage });
    promptBarService(identityB, { registry: customRegistry, storage: mockStorage });

    serviceA.setPrompt("New prompt for A");

    expect(storeA.getState().prompt).toBe("New prompt for A");
    // Store B must be completely untouched
    expect(storeB.getState().prompt).toBe("Prompt B");
  });

  it("not mounted: queued once; on mount applied once; a second mount does not apply it again", () => {
    // Identity A is NOT mounted yet
    const serviceA = promptBarService(identityA, { registry: customRegistry, storage: mockStorage });

    const res = serviceA.setPrompt("Queued text for A");
    expect(res.ok).toBe(false);
    expect(res.reason).toBe(REASONS.NOT_MOUNTED);
    expect(res.details?.queued).toBe(true);

    // Now mount identity A
    const storeA = setupMountedStore(identityA, { prompt: "Original on mount" });

    // Drain the queue on mount
    const drainRes1 = drainPendingActions(identityA, {
      registry: customRegistry,
      storage: mockStorage,
      currentProjectId: "proj_1",
    });

    expect(drainRes1.executed).toBe(1);
    expect(storeA.getState().prompt).toBe("Queued text for A");

    // A second drain (or second mount) must NOT apply it again
    storeA.getState().setPrompt("User typed something else");
    const drainRes2 = drainPendingActions(identityA, {
      registry: customRegistry,
      storage: mockStorage,
      currentProjectId: "proj_1",
    });

    expect(drainRes2.executed).toBe(0);
    expect(storeA.getState().prompt).toBe("User typed something else");
  });

  it("expired entry (> TTL) is dropped during drain", () => {
    const serviceA = promptBarService(identityA, {
      registry: customRegistry,
      storage: mockStorage,
      now: 1000,
    });

    serviceA.setPrompt("Will expire");

    const storeA = setupMountedStore(identityA, { prompt: "Original" });

    // Drain 3 minutes later (> DEFAULT_PENDING_TTL_MS = 2 minutes)
    const drainRes = drainPendingActions(identityA, {
      registry: customRegistry,
      storage: mockStorage,
      currentProjectId: "proj_1",
      now: 1000 + DEFAULT_PENDING_TTL_MS + 1000,
    });

    expect(drainRes.executed).toBe(0);
    expect(storeA.getState().prompt).toBe("Original");
  });

  it("entry of another project is dropped during drain", () => {
    const serviceA = promptBarService(identityA, {
      registry: customRegistry,
      storage: mockStorage,
    });

    serviceA.setPrompt("For proj_1");

    const storeA = setupMountedStore(identityA, { prompt: "Original" });

    // Drain with currentProjectId = "proj_2" (project mismatch)
    const drainRes = drainPendingActions(identityA, {
      registry: customRegistry,
      storage: mockStorage,
      currentProjectId: "proj_2",
    });

    expect(drainRes.executed).toBe(0);
    expect(storeA.getState().prompt).toBe("Original");
  });

  it("wrong project gives fail(PROJECT_MISMATCH) and no state change on mounted instance", () => {
    // Mount instance for proj_1
    const storeA = setupMountedStore(identityA, { prompt: "Untouched prompt" });

    // Service called with identity targeting proj_99 on an instance mounted for proj_1
    const mismatchIdentity = {
      templateId: "generated-media",
      projectId: "proj_99",
      instanceId: "default",
    };

    // If identity has proj_99, but we pass identityKey targeting proj_1's instance:
    const service = promptBarService(mismatchIdentity, {
      registry: customRegistry,
      storage: mockStorage,
      targetInstanceIdentity: identityA,
    });

    const res = service.setPrompt("Should fail");
    expect(res.ok).toBe(false);
    expect(res.reason).toBe(REASONS.PROJECT_MISMATCH);
    expect(storeA.getState().prompt).toBe("Untouched prompt");
  });

  it("getSnapshot returns read-only copy of store state", () => {
    setupMountedStore(identityA, {
      prompt: "Snapshot prompt",
      selectedModelId: "model_xyz",
      activeMode: "video",
      activeSubMode: "reference",
    });

    const serviceA = promptBarService(identityA, { registry: customRegistry, storage: mockStorage });
    const snapshot = serviceA.getSnapshot();

    expect(snapshot).toEqual({
      prompt: "Snapshot prompt",
      selectedModelId: "model_xyz",
      activeMode: "video",
      activeSubMode: "reference",
      isGenerating: false,
    });
  });

  it("reset resets the store state", () => {
    const storeA = setupMountedStore(identityA, {
      prompt: "Before reset",
    });

    const serviceA = promptBarService(identityA, { registry: customRegistry, storage: mockStorage });
    const res = serviceA.reset();

    expect(res.ok).toBe(true);
    expect(storeA.getState().prompt).toBe("");
  });

  it("subscribe notifies on mount, state changes, and unmount, and stops after unsubscribe", () => {
    const listener = vi.fn();
    const serviceA = promptBarService(identityA, { registry: customRegistry, storage: mockStorage });
    const unsub = serviceA.subscribe(listener);

    const storeA = setupMountedStore(identityA, { activeMode: "image", activeSubMode: "frames" });
    expect(listener).toHaveBeenCalledTimes(1);

    serviceA.setPrompt("Hello");
    expect(listener).toHaveBeenCalledTimes(2);
    expect(storeA.getState().prompt).toBe("Hello");

    customRegistry.markUnmounted(identityA);
    expect(listener).toHaveBeenCalledTimes(3);

    unsub();
    customRegistry.markMounted(identityA);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("usePromptBarSnapshot reacts only when selected primitive flips (no re-render storms)", () => {
    const selectIsFrameMode = (snap) =>
      snap.activeMode === "video" && snap.activeSubMode === "frames";
    let renderCount = 0;

    const { result } = renderHook(() => {
      renderCount += 1;
      return usePromptBarSnapshot(identityA, selectIsFrameMode, { registry: customRegistry });
    });

    // Unmounted -> false
    expect(result.current).toBe(false);
    const initialRenders = renderCount;

    // Mount store in image mode -> still false, no extra re-render
    const videoRefModel = {
      id: "veo_ref",
      name: "Veo Reference",
      domain: "video",
      category: "video",
      parameters: {
        prompt: { type: "string" },
        images: { type: "image[]", max: 3 },
      },
    };
    const storeA = createPromptBarStore(
      { identity: identityA, activeMode: "image", activeSubMode: "frames" },
      { template: generatedMediaTemplate }
    );
    storeA.getState().setModels([...fixtureModels, videoRefModel]);
    act(() => {
      customRegistry.getOrCreate(identityA, () => storeA);
      customRegistry.markMounted(identityA);
    });
    expect(result.current).toBe(false);
    expect(renderCount).toBe(initialRenders);

    // Switch to video/frames -> flips true (1 re-render)
    act(() => {
      storeA.getState().switchMode("video", "frames");
    });
    expect(result.current).toBe(true);
    expect(renderCount).toBe(initialRenders + 1);

    // Typing prompt or attaching frame while staying in video/frames -> 0 re-renders!
    act(() => {
      storeA.getState().setPrompt("Drone shot over neon city");
      storeA.getState().attachMedia({ role: "start", value: { workflow_id: "wf-1", url: "https://example.com/1.png" } });
    });
    expect(result.current).toBe(true);
    expect(renderCount).toBe(initialRenders + 1);

    // Switch to video/reference -> flips false (1 re-render)
    act(() => {
      storeA.getState().switchMode("video", "reference");
    });
    expect(result.current).toBe(false);
    expect(renderCount).toBe(initialRenders + 2);

    // Switch back to video/frames, then unmount -> flips false
    act(() => {
      storeA.getState().switchMode("video", "frames");
    });
    expect(result.current).toBe(true);
    act(() => {
      customRegistry.markUnmounted(identityA);
    });
    expect(result.current).toBe(false);
  });

  it("DoD: service and queue have 0 occurrences of document. or window.", () => {
    const promptBarDir = path.resolve(__dirname, "..");
    const servicePath = path.join(promptBarDir, "api", "promptBarService.js");
    const queuePath = path.join(promptBarDir, "store", "pendingActions.js");

    const serviceCode = fs.readFileSync(servicePath, "utf-8");
    const queueCode = fs.readFileSync(queuePath, "utf-8");

    expect(serviceCode).not.toMatch(/document\./);
    expect(serviceCode).not.toMatch(/window\./);
    expect(queueCode).not.toMatch(/document\./);
    expect(queueCode).not.toMatch(/window\./);
  });
});
