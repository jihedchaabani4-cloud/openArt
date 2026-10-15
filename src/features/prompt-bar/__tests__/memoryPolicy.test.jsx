import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import {
  PromptBarStoreProvider,
  usePromptBarStoreInstance,
  clearPersistentPromptBarStores,
} from "../store/PromptBarStoreContext.js";
import { registry, createRegistry } from "../store/registry.js";
import { createPromptBarType } from "../composition/createPromptBarType.js";
import { fixtureModels } from "./fixtures/models.fixture.js";
import { createPromptBarStore } from "../store/createPromptBarStore.js";

const testType = createPromptBarType({
  id: "test-memory-policy",
  name: "Memory Policy Media",
  layout: { showPromptInput: true },
});

function StoreCapture({ onStore }) {
  const store = usePromptBarStoreInstance();
  React.useEffect(() => {
    if (onStore) onStore(store);
  }, [store, onStore]);
  return <div data-testid="capture" />;
}

describe("S5: Memory Policy (pruneOtherProjects & Project Navigation)", () => {
  let fakeStorageData = {};
  let fakeStorage;

  beforeEach(() => {
    fakeStorageData = {};
    fakeStorage = {
      getItem: vi.fn((key) => fakeStorageData[key] ?? null),
      setItem: vi.fn((key, val) => {
        fakeStorageData[key] = String(val);
      }),
      removeItem: vi.fn((key) => {
        delete fakeStorageData[key];
      }),
      clear: vi.fn(() => {
        fakeStorageData = {};
      }),
    };

    clearPersistentPromptBarStores();
  });

  describe("registry.pruneOtherProjects unit rules", () => {
    it("disposes unmounted instances of other projects", () => {
      const reg = createRegistry();
      const idA = { templateId: "tpl", instanceId: "default", projectId: "proj-a" };
      const idB = { templateId: "tpl", instanceId: "default", projectId: "proj-b" };

      reg.getOrCreate(idA, () => createPromptBarStore({ identity: idA }));
      reg.getOrCreate(idB, () => createPromptBarStore({ identity: idB }));

      expect(reg.has(idA)).toBe(true);
      expect(reg.has(idB)).toBe(true);

      // Prune for proj-b: idA is unmounted and belongs to proj-a, so it should be disposed
      const disposed = reg.pruneOtherProjects("proj-b");
      expect(disposed).toContain("pb2:tpl:default:proj-a");
      expect(reg.has(idA)).toBe(false);
      expect(reg.has(idB)).toBe(true);
    });

    it("keeps mounted instances even if belonging to another project", () => {
      const reg = createRegistry();
      const idA = { templateId: "tpl", instanceId: "default", projectId: "proj-a" };
      const idB = { templateId: "tpl", instanceId: "default", projectId: "proj-b" };

      reg.getOrCreate(idA, () => createPromptBarStore({ identity: idA }));
      reg.getOrCreate(idB, () => createPromptBarStore({ identity: idB }));

      // Mark A mounted
      reg.markMounted(idA);

      const disposed = reg.pruneOtherProjects("proj-b");
      expect(disposed).toEqual([]);
      expect(reg.has(idA)).toBe(true);
      expect(reg.has(idB)).toBe(true);
    });

    it("preserves unmounted instances of the current project and global project", () => {
      const reg = createRegistry();
      const idCurrent = { templateId: "tpl", instanceId: "sub", projectId: "proj-current" };
      const idGlobal = { templateId: "tpl", instanceId: "global-bar", projectId: "global" };
      const idOther = { templateId: "tpl", instanceId: "default", projectId: "proj-other" };

      reg.getOrCreate(idCurrent, () => createPromptBarStore({ identity: idCurrent }));
      reg.getOrCreate(idGlobal, () => createPromptBarStore({ identity: idGlobal }));
      reg.getOrCreate(idOther, () => createPromptBarStore({ identity: idOther }));

      const disposed = reg.pruneOtherProjects("proj-current");
      expect(disposed).toEqual(["pb2:tpl:default:proj-other"]);
      expect(reg.has(idCurrent)).toBe(true);
      expect(reg.has(idGlobal)).toBe(true);
      expect(reg.has(idOther)).toBe(false);
    });
  });

  describe("End-to-end Project Navigation: A -> B -> A", () => {
    it("disposes store A while B is mounted, and restores A from storage on return", () => {
      // 1. Mount Project A
      window.history.pushState({}, "", "/cinema-studio/proj-alpha/assets");
      let storeA = null;
      const { unmount: unmountA } = render(
        <PromptBarStoreProvider
          type={testType}
          templateId="test-memory-policy"
          initialModels={fixtureModels}
          storage={fakeStorage}
        >
          <StoreCapture onStore={(s) => { storeA = s; }} />
        </PromptBarStoreProvider>
      );

      expect(storeA).not.toBeNull();

      // User enters prompt and changes parameter
      act(() => {
        storeA.getState().setPrompt("Epic cinematic landscape for Project Alpha");
        storeA.getState().setParameter("aspect_ratio", "16:9");
      });

      // 2. Unmount Project A (flushes saver and unmounts)
      act(() => {
        unmountA();
      });

      // Storage has Project A saved state
      const keyA = "pb2:test-memory-policy:default:proj-alpha";
      expect(fakeStorageData[keyA]).toBeDefined();
      const parsedA = JSON.parse(fakeStorageData[keyA]);
      expect(parsedA.prompt).toBe("Epic cinematic landscape for Project Alpha");
      expect(parsedA.parameterValues.aspect_ratio).toBe("16:9");

      // 3. Navigate to Project B and Mount Project B
      window.history.pushState({}, "", "/cinema-studio/proj-beta/assets");
      let storeB = null;
      const { unmount: unmountB } = render(
        <PromptBarStoreProvider
          type={testType}
          templateId="test-memory-policy"
          initialModels={fixtureModels}
          storage={fakeStorage}
        >
          <StoreCapture onStore={(s) => { storeB = s; }} />
        </PromptBarStoreProvider>
      );

      // Verify that Project A's store is disposed from registry memory!
      const registryList = registry.list();
      const hasProjAlpha = registryList.some((item) => item.identity?.projectId === "proj-alpha");
      const hasProjBeta = registryList.some((item) => item.identity?.projectId === "proj-beta");

      expect(hasProjAlpha).toBe(false);
      expect(hasProjBeta).toBe(true);
      expect(registry.get({ templateId: "test-memory-policy", projectId: "proj-alpha" })).toBeUndefined();

      // Project B enters prompt
      act(() => {
        storeB.getState().setPrompt("Project Beta specific prompt");
      });

      // 4. Unmount Project B
      act(() => {
        unmountB();
      });

      // 5. Navigate back to Project A and Mount Project A
      window.history.pushState({}, "", "/cinema-studio/proj-alpha/assets");
      let storeA2 = null;
      const { unmount: unmountA2 } = render(
        <PromptBarStoreProvider
          type={testType}
          templateId="test-memory-policy"
          initialModels={fixtureModels}
          storage={fakeStorage}
        >
          <StoreCapture onStore={(s) => { storeA2 = s; }} />
        </PromptBarStoreProvider>
      );

      // Verify restored prompt and parameters
      expect(storeA2.getState().prompt).toBe("Epic cinematic landscape for Project Alpha");
      expect(storeA2.getState().parameterValues.aspect_ratio).toBe("16:9");

      // Verify Project B's unmounted store was pruned from memory
      const finalRegistryList = registry.list();
      const stillHasProjBeta = finalRegistryList.some((item) => item.identity?.projectId === "proj-beta");
      const stillHasProjAlpha = finalRegistryList.some((item) => item.identity?.projectId === "proj-alpha");

      expect(stillHasProjBeta).toBe(false);
      expect(stillHasProjAlpha).toBe(true);

      act(() => {
        unmountA2();
      });
    });
  });
});
