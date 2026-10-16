/**
 * S6: Multi-Instance and Store Lifecycle Integration Tests
 *
 * Implements the 5 multi-instance integration checks specified in 04_P3_store_lifecycle.md (S6)
 * using the SAFE-5 platform test harness.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act, fireEvent, screen, cleanup } from "@testing-library/react";

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
import {
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
  generatedMediaType,
} from "../templates/generatedMedia.template.js";
import { createPromptBarType } from "../composition/createPromptBarType.js";
import { registry } from "../store/registry.js";
import { clearPersistentPromptBarStores } from "../store/PromptBarStoreContext.js";
import { fixtureModels } from "./fixtures/models.fixture.js";

const featureConfig = {
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
};

const templateA = createPromptBarType({
  id: "template-alpha",
  name: "Alpha Template",
  layout: { showPromptInput: true },
});

const templateB = createPromptBarType({
  id: "template-beta",
  name: "Beta Template",
  layout: { showPromptInput: true },
});

describe("S6: Multi-Instance & Lifecycle Integration (SAFE-5 Harness)", () => {
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

    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      window.history.pushState({}, "", "/cinema-studio/proj_test/assets");
    }
    clearPersistentPromptBarStores();
  });

  afterEach(() => {
    cleanup();
  });

  it("1. Two bars with different templateId in the same project: typing/resetting in one does not affect the other", () => {
    render(
      <div>
        <div data-testid="container-a">
          <PromptBarPlatform
            type={templateA}
            templateId="template-alpha"
            featureConfig={featureConfig}
            models={fixtureModels}
            storage={fakeStorage}
          />
        </div>
        <div data-testid="container-b">
          <PromptBarPlatform
            type={templateB}
            templateId="template-beta"
            featureConfig={featureConfig}
            models={fixtureModels}
            storage={fakeStorage}
          />
        </div>
      </div>
    );

    const editors = screen.getAllByTestId("mock-prompt-editor");
    expect(editors.length).toBe(2);

    // Type in Bar A
    fireEvent.change(editors[0], { target: { value: "Prompt for Alpha" } });
    expect(editors[0].value).toBe("Prompt for Alpha");
    expect(editors[1].value).toBe("");

    const storeA = registry.get({ templateId: "template-alpha", projectId: "proj_test" });
    const storeB = registry.get({ templateId: "template-beta", projectId: "proj_test" });

    expect(storeA.getState().prompt).toBe("Prompt for Alpha");
    expect(storeB.getState().prompt).toBe("");

    // Type in Bar B
    fireEvent.change(editors[1], { target: { value: "Prompt for Beta" } });
    expect(storeA.getState().prompt).toBe("Prompt for Alpha");
    expect(storeB.getState().prompt).toBe("Prompt for Beta");

    // Reset Bar A
    act(() => {
      storeA.getState().reset();
    });

    expect(storeA.getState().prompt).toBe("");
    expect(storeB.getState().prompt).toBe("Prompt for Beta");
  });

  it("2. Same template, two instanceId values: typing/resetting in one does not affect the other", () => {
    render(
      <div>
        <PromptBarPlatform
          type={generatedMediaType}
          templateId="generated-media"
          instanceId="panel-left"
          featureConfig={featureConfig}
          models={fixtureModels}
          storage={fakeStorage}
        />
        <PromptBarPlatform
          type={generatedMediaType}
          templateId="generated-media"
          instanceId="panel-right"
          featureConfig={featureConfig}
          models={fixtureModels}
          storage={fakeStorage}
        />
      </div>
    );

    const editors = screen.getAllByTestId("mock-prompt-editor");
    expect(editors.length).toBe(2);

    // Type into left instance
    fireEvent.change(editors[0], { target: { value: "Prompt in left panel" } });
    expect(editors[0].value).toBe("Prompt in left panel");
    expect(editors[1].value).toBe("");

    const storeLeft = registry.get({ templateId: "generated-media", instanceId: "panel-left", projectId: "proj_test" });
    const storeRight = registry.get({ templateId: "generated-media", instanceId: "panel-right", projectId: "proj_test" });

    expect(storeLeft.getState().prompt).toBe("Prompt in left panel");
    expect(storeRight.getState().prompt).toBe("");

    // Reset left instance
    act(() => {
      storeLeft.getState().reset();
    });

    expect(storeLeft.getState().prompt).toBe("");
    expect(storeRight.getState().prompt).toBe("");
  });

  it("3. Same template, two projects: typing/resetting in one does not affect the other", () => {
    // Project 1
    window.history.pushState({}, "", "/cinema-studio/proj_one/assets");
    let store1 = null;
    const { unmount: unmount1 } = render(
      <PromptBarPlatform
        type={generatedMediaType}
        templateId="generated-media"
        instanceId="main"
        featureConfig={featureConfig}
        models={fixtureModels}
        storage={fakeStorage}
      />
    );
    store1 = registry.get({ templateId: "generated-media", instanceId: "main", projectId: "proj_one" });
    act(() => {
      store1.getState().setPrompt("Project 1 Custom Prompt");
    });
    expect(store1.getState().prompt).toBe("Project 1 Custom Prompt");
    unmount1();

    // Project 2
    window.history.pushState({}, "", "/cinema-studio/proj_two/assets");
    let store2 = null;
    const { unmount: unmount2 } = render(
      <PromptBarPlatform
        type={generatedMediaType}
        templateId="generated-media"
        instanceId="main"
        featureConfig={featureConfig}
        models={fixtureModels}
        storage={fakeStorage}
      />
    );
    store2 = registry.get({ templateId: "generated-media", instanceId: "main", projectId: "proj_two" });
    act(() => {
      store2.getState().setPrompt("Project 2 Different Prompt");
    });

    expect(store2.getState().prompt).toBe("Project 2 Different Prompt");

    // Project 1 persisted state in fakeStorage is unaffected
    const key1 = "pb2:generated-media:main:proj_one";
    const key2 = "pb2:generated-media:main:proj_two";
    expect(JSON.parse(fakeStorageData[key1]).prompt).toBe("Project 1 Custom Prompt");

    unmount2();
    expect(JSON.parse(fakeStorageData[key2]).prompt).toBe("Project 2 Different Prompt");
  });

  it("4. Unmount and remount with the same identity: state is restored from storage after mount", () => {
    window.history.pushState({}, "", "/cinema-studio/proj_persist/assets");

    const { unmount } = render(
      <PromptBarPlatform
        type={generatedMediaType}
        templateId="generated-media"
        instanceId="persisted-bar"
        featureConfig={featureConfig}
        models={fixtureModels}
        storage={fakeStorage}
      />
    );

    const initialStore = registry.get({
      templateId: "generated-media",
      instanceId: "persisted-bar",
      projectId: "proj_persist",
    });

    act(() => {
      initialStore.getState().setPrompt("Persistent prompt to be restored");
      initialStore.getState().setParameter("aspect_ratio", "9:16");
    });

    // Unmount flushes saver to storage
    unmount();

    // Verify stored
    const key = "pb2:generated-media:persisted-bar:proj_persist";
    expect(fakeStorageData[key]).toBeDefined();

    // Remount with same identity
    render(
      <PromptBarPlatform
        type={generatedMediaType}
        templateId="generated-media"
        instanceId="persisted-bar"
        featureConfig={featureConfig}
        models={fixtureModels}
        storage={fakeStorage}
      />
    );

    const remountedStore = registry.get({
      templateId: "generated-media",
      instanceId: "persisted-bar",
      projectId: "proj_persist",
    });

    expect(remountedStore.getState().prompt).toBe("Persistent prompt to be restored");
    expect(remountedStore.getState().parameterValues.aspect_ratio).toBe("9:16");
  });

  it("5. Generate in one bar: the other bar's isGenerating stays false", async () => {
    render(
      <div>
        <PromptBarPlatform
          type={templateA}
          templateId="template-alpha"
          instanceId="bar-1"
          featureConfig={featureConfig}
          models={fixtureModels}
          storage={fakeStorage}
        />
        <PromptBarPlatform
          type={templateB}
          templateId="template-beta"
          instanceId="bar-2"
          featureConfig={featureConfig}
          models={fixtureModels}
          storage={fakeStorage}
        />
      </div>
    );

    const store1 = registry.get({ templateId: "template-alpha", instanceId: "bar-1", projectId: "proj_test" });
    const store2 = registry.get({ templateId: "template-beta", instanceId: "bar-2", projectId: "proj_test" });

    expect(store1.getState().isGenerating).toBe(false);
    expect(store2.getState().isGenerating).toBe(false);

    // Begin submit in Bar 1
    let token = null;
    act(() => {
      token = store1.getState().beginSubmit();
    });

    expect(store1.getState().isGenerating).toBe(true);
    // Bar 2 must remain false!
    expect(store2.getState().isGenerating).toBe(false);

    // End submit in Bar 1
    act(() => {
      store1.getState().endSubmit(token);
    });

    expect(store1.getState().isGenerating).toBe(false);
    expect(store2.getState().isGenerating).toBe(false);
  });
});
