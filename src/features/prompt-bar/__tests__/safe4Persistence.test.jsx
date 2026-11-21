/**
 * SAFE-4: Registry, Key and Persistence Characterization Tests (Canonical pb2 keys)
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
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import { fixtureModels } from "./fixtures/models.fixture.js";

const testType = {
  ...generatedMediaTemplate,
  id: "test-generated-media",
  name: "Test Media",
};

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

  describe("1. Canonical pb2 key formatting", () => {
    it("formats canonical key with projectId when inside /cinema-studio/:projectId", () => {
      window.history.pushState({}, "", "/cinema-studio/project_xyz/assets");

      let capturedStore = null;
      const { unmount } = render(
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
      unmount();

      const saved = window.sessionStorage.getItem("pb2:test-generated-media:default:project_xyz");
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved);
      expect(parsed.prompt).toBe("Testing project key format");
    });

    it("formats canonical key with global when route has no project id", () => {
      window.history.pushState({}, "", "/");

      let capturedStore = null;
      const { unmount } = render(
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
      unmount();

      const saved = window.sessionStorage.getItem("pb2:test-generated-media:custom-key:global");
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
      expect(store1).toBe(store2);
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
    it("saves only prompt, selectedModelId, parameterValues, derived elements/characters, activeMode, activeSubMode (never isGenerating)", () => {
      window.history.pushState({}, "", "/cinema-studio/proj_subset");

      let capturedStore = null;
      const { unmount } = render(
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
        capturedStore.getState().setSetting("resolution", "2K");
        capturedStore.getState().attachMedia({ role: "reference", value: { id: "e1", workflow_id: "e1", type: "element" } });
        capturedStore.getState().attachMedia({ role: "reference", value: { id: "c1", workflow_id: "c1", type: "character" } });
        capturedStore.getState().setIsGenerating(true); // Must NOT be persisted
      });
      unmount();

      const raw = window.sessionStorage.getItem("pb2:test-generated-media:subset-key:proj_subset");
      expect(raw).not.toBeNull();
      const saved = JSON.parse(raw);

      expect(saved.prompt).toBe("Subset test");
      expect(saved.selectedModelId).toBe("nanobana_pro");
      expect(saved.parameterValues.resolution).toBe("2K");
      expect(saved.elements[0].id).toBe("e1");
      expect(saved.characters[0].id).toBe("c1");
      expect(saved.activeMode).toBe("image");
      expect(saved.activeSubMode).toBe("frames");

      expect(saved.isGenerating).toBeUndefined();
      expect(saved.modelsMap).toBeUndefined();
      expect(saved.reconciliationLog).toBeUndefined();
      expect(saved.validationErrors).toBeUndefined();
      expect(saved.lastSerializedRequest).toBeUndefined();
    });
  });

  describe("4. Corrupted storage handling", () => {
    it("safely handles invalid JSON in storage and initializes with eligible model defaults", () => {
      window.history.pushState({}, "", "/cinema-studio/proj_corrupt");
      window.sessionStorage.setItem("pb2:test-generated-media:corrupt-key:proj_corrupt", "{NOT_VALID_JSON:>>>");

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
      // Default mode is image, so eligible model is nanobana_pro!
      expect(capturedStore.getState().selectedModelId).toBe("nanobana_pro");
      expect(capturedStore.getState().prompt).toBe("");
    });
  });

  describe("5. Resolved Issues (P3 BEHAVIOR)", () => {
    it("pins PB-K4a: module-level active store returns null when more than one instance is mounted", () => {
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

      const activeInstance = getActivePromptBarStore();
      expect(activeInstance).toBeNull();
    });

    it("pins PB-K4b: blob: URLs inside parameterValues are safely dropped from sessionStorage", () => {
      window.history.pushState({}, "", "/cinema-studio/proj_blob");

      let capturedStore = null;
      const { unmount } = render(
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
        capturedStore.getState().switchMode("video", "frames");
        capturedStore.getState().attachMedia({ role: "start", value: { url: blobUrl } });
      });
      unmount();

      const raw = window.sessionStorage.getItem("pb2:test-generated-media:blob-key:proj_blob");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw);

      expect(parsed.parameterValues.input_image).toBeUndefined();
    });
  });
});
