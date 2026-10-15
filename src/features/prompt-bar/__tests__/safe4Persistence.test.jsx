/**
 * SAFE-4: Registry, Key and Persistence Characterization Tests
 *
 * Tests:
 * 1. Key format: <persistKey>_<projectId> when inside project route; <persistKey>_global without project
 * 2. In-memory registry: same key returns same store instance; different project returns different store instance
 * 3. Saved subset: storage holds only prompt, selectedModelId, parameterValues, elements, characters, activeMode, activeSubMode (never isGenerating)
 * 4. Corrupted storage: invalid JSON is safely caught and ignored, starting with defaults
 * 5. Documented known issues:
 *    (a) Module-level activePromptBarStoreInstance is overwritten by last rendered provider
 *    (b) blob: URLs in parameterValues are written to sessionStorage as is
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useEffect } from "react";
import {
  PromptBarStoreProvider,
  usePromptBarStoreInstance,
  clearPersistentPromptBarStores,
  getActivePromptBarStore,
} from "../store/PromptBarStoreContext.js";
import { createPromptBarType } from "../composition/createPromptBarType.js";
import { fixtureModels } from "./fixtures/models.fixture.js";

const testType = createPromptBarType({
  id: "test-generated-media",
  name: "Test Media",
  layout: {
    showPromptInput: true,
    showModeSelector: true,
  },
  supportedDomains: ["image", "video"],
});

function StoreCapture({ onStore }) {
  const store = usePromptBarStoreInstance();
  useEffect(() => {
    if (onStore) onStore(store);
  }, [store, onStore]);
  return <div data-testid="store-capture" />;
}

describe("SAFE-4: Registry, Key and Persistence Characterization", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      window.history.pushState({}, "", "/");
    }
    clearPersistentPromptBarStores();
  });

  describe("1. Key formatting", () => {
    it("formats key as <persistKey>_<projectId> when inside /cinema-studio/:projectId", () => {
      window.history.pushState({}, "", "/cinema-studio/project_xyz/assets");

      let capturedStore = null;
      render(
        <PromptBarStoreProvider
          type={testType}
          initialModels={fixtureModels}
          persistKey="studio-prompt-bar"
        >
          <StoreCapture onStore={(s) => { capturedStore = s; }} />
        </PromptBarStoreProvider>
      );

      act(() => {
        capturedStore.getState().setPrompt("Testing project key format");
      });

      const saved = window.sessionStorage.getItem("studio-prompt-bar_project_xyz");
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved);
      expect(parsed.prompt).toBe("Testing project key format");
    });

    it("formats key as <persistKey>_global when route has no project id", () => {
      window.history.pushState({}, "", "/");

      let capturedStore = null;
      render(
        <PromptBarStoreProvider
          type={testType}
          initialModels={fixtureModels}
          persistKey="custom-key"
        >
          <StoreCapture onStore={(s) => { capturedStore = s; }} />
        </PromptBarStoreProvider>
      );

      act(() => {
        capturedStore.getState().setPrompt("Global prompt without project");
      });

      const saved = window.sessionStorage.getItem("custom-key_global");
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved);
      expect(parsed.prompt).toBe("Global prompt without project");
    });
  });

  describe("2. In-memory registry and store isolation", () => {
    it("same effective key mounted twice returns the exact same store instance", () => {
      window.history.pushState({}, "", "/cinema-studio/proj_shared");

      let store1 = null;
      const { unmount } = render(
        <PromptBarStoreProvider
          type={testType}
          initialModels={fixtureModels}
          persistKey="shared-key"
        >
          <StoreCapture onStore={(s) => { store1 = s; }} />
        </PromptBarStoreProvider>
      );

      unmount();

      let store2 = null;
      render(
        <PromptBarStoreProvider
          type={testType}
          initialModels={fixtureModels}
          persistKey="shared-key"
        >
          <StoreCapture onStore={(s) => { store2 = s; }} />
        </PromptBarStoreProvider>
      );

      expect(store1).not.toBeNull();
      expect(store2).not.toBeNull();
      expect(store1).toBe(store2); // Exact reference identity from persistentStoreRegistry
    });

    it("different project ids return different store instances", () => {
      let storeProjA = null;
      window.history.pushState({}, "", "/cinema-studio/proj_A");
      const { unmount: unmountA } = render(
        <PromptBarStoreProvider
          type={testType}
          initialModels={fixtureModels}
          persistKey="isolated-key"
        >
          <StoreCapture onStore={(s) => { storeProjA = s; }} />
        </PromptBarStoreProvider>
      );
      unmountA();

      let storeProjB = null;
      window.history.pushState({}, "", "/cinema-studio/proj_B");
      render(
        <PromptBarStoreProvider
          type={testType}
          initialModels={fixtureModels}
          persistKey="isolated-key"
        >
          <StoreCapture onStore={(s) => { storeProjB = s; }} />
        </PromptBarStoreProvider>
      );

      expect(storeProjA).not.toBeNull();
      expect(storeProjB).not.toBeNull();
      expect(storeProjA).not.toBe(storeProjB);
    });
  });

  describe("3. Saved subset in sessionStorage", () => {
    it("saves only prompt, selectedModelId, parameterValues, elements, characters, activeMode, activeSubMode (never isGenerating)", () => {
      window.history.pushState({}, "", "/cinema-studio/proj_subset");

      let capturedStore = null;
      render(
        <PromptBarStoreProvider
          type={testType}
          initialModels={fixtureModels}
          persistKey="subset-key"
        >
          <StoreCapture onStore={(s) => { capturedStore = s; }} />
        </PromptBarStoreProvider>
      );

      act(() => {
        capturedStore.getState().setPrompt("Subset test");
        capturedStore.getState().selectModel("nanobana_pro");
        capturedStore.getState().setParameter("resolution", "2K");
        capturedStore.getState().addElement({ id: "e1", workflow_id: "e1" });
        capturedStore.getState().addCharacter({ id: "c1", workflow_id: "c1" });
        capturedStore.getState().setActiveMode("video");
        capturedStore.getState().setActiveSubMode("frames");
        capturedStore.getState().setIsGenerating(true); // Must NOT be persisted
      });

      const raw = window.sessionStorage.getItem("subset-key_proj_subset");
      expect(raw).not.toBeNull();
      const saved = JSON.parse(raw);

      // Must have the 7 persisted keys
      expect(saved.prompt).toBe("Subset test");
      expect(saved.selectedModelId).toBe("nanobana_pro");
      expect(saved.parameterValues.resolution).toBe("2K");
      expect(saved.elements[0].id).toBe("e1");
      expect(saved.characters[0].id).toBe("c1");
      expect(saved.activeMode).toBe("video");
      expect(saved.activeSubMode).toBe("frames");

      // Must NOT contain transient fields
      expect(saved.isGenerating).toBeUndefined();
      expect(saved.modelsMap).toBeUndefined();
      expect(saved.reconciliationLog).toBeUndefined();
      expect(saved.validationErrors).toBeUndefined();
      expect(saved.lastSerializedRequest).toBeUndefined();
    });
  });

  describe("4. Corrupted storage handling", () => {
    it("safely handles invalid JSON in storage and initializes with model defaults", () => {
      window.history.pushState({}, "", "/cinema-studio/proj_corrupt");
      window.sessionStorage.setItem("corrupt-key_proj_corrupt", "{NOT_VALID_JSON:>>>");

      let capturedStore = null;
      expect(() => {
        render(
          <PromptBarStoreProvider
            type={testType}
            initialModels={fixtureModels}
            persistKey="corrupt-key"
          >
            <StoreCapture onStore={(s) => { capturedStore = s; }} />
          </PromptBarStoreProvider>
        );
      }).not.toThrow();

      expect(capturedStore).not.toBeNull();
      expect(capturedStore.getState().selectedModelId).toBe("seedance_2_5");
      expect(capturedStore.getState().prompt).toBe("");
    });
  });

  describe("5. Resolved Issues (P3 BEHAVIOR)", () => {
    it("pins PB-K4a: module-level active store returns null when more than one instance is mounted", () => {
      // P3 BEHAVIOR (resolved PB-K4a):
      // getActivePromptBarStore() returns null when more than one instance is mounted for the project.
      let storeA = null;
      let storeB = null;

      render(
        <div>
          <PromptBarStoreProvider
            type={testType}
            initialModels={fixtureModels}
            persistKey="provider-A"
          >
            <StoreCapture onStore={(s) => { storeA = s; }} />
          </PromptBarStoreProvider>

          <PromptBarStoreProvider
            type={testType}
            initialModels={fixtureModels}
            persistKey="provider-B"
          >
            <StoreCapture onStore={(s) => { storeB = s; }} />
          </PromptBarStoreProvider>
        </div>
      );

      expect(storeA).not.toBeNull();
      expect(storeB).not.toBeNull();
      expect(storeA).not.toBe(storeB);

      // getActivePromptBarStore() returns null because >1 instance is mounted
      const activeInstance = getActivePromptBarStore();
      expect(activeInstance).toBeNull();
    });

    it("pins PB-K4b: blob: URLs inside parameterValues are safely dropped from sessionStorage", () => {
      // P3 BEHAVIOR (resolved PB-K4b):
      // selectPersistable() sanitizes parameterValues, so blob: URLs are dropped.
      window.history.pushState({}, "", "/cinema-studio/proj_blob");

      let capturedStore = null;
      render(
        <PromptBarStoreProvider
          type={testType}
          initialModels={fixtureModels}
          persistKey="blob-key"
        >
          <StoreCapture onStore={(s) => { capturedStore = s; }} />
        </PromptBarStoreProvider>
      );

      const blobUrl = "blob:http://localhost:3000/1234-5678-abcd";
      act(() => {
        capturedStore.getState().setParameter("input_image", blobUrl);
      });

      const raw = window.sessionStorage.getItem("blob-key_proj_blob");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw);

      // Confirm blob URL is safely stripped from sessionStorage
      expect(parsed.parameterValues.input_image).toBeUndefined();
    });
  });
});
