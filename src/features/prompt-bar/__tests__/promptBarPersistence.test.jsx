import { describe, it, expect, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import * as React from "react";
import {
  PromptBarStoreProvider,
  usePromptBarStoreInstance,
  clearPersistentPromptBarStores,
} from "../store/PromptBarStoreContext.js";
import { usePromptBarStore } from "../store/usePromptBarStore.js";
import { createPromptBarType } from "../composition/createPromptBarType.js";

const testType = createPromptBarType({
  id: "test-generated-media",
  name: "Test Media",
  layout: {
    showPromptInput: true,
    showModeSelector: true,
  },
  supportedDomains: ["image", "video"],
});

const mockModels = [
  {
    id: "model-image-1",
    name: "Model Image 1",
    domain: "image",
    parameters: {
      aspect_ratio: { name: "aspect_ratio", type: "select", values: [{ value: "1:1" }, { value: "16:9" }], default: "1:1" },
      quality: { name: "quality", type: "select", values: [{ value: "1K" }, { value: "2K" }], default: "1K" },
      images: { name: "images", type: "image[]", role: "reference_images" },
    },
  },
  {
    id: "model-video-1",
    name: "Model Video 1",
    domain: "video",
    parameters: {
      aspect_ratio: { name: "aspect_ratio", type: "select", values: [{ value: "1:1" }, { value: "16:9" }], default: "1:1" },
      duration: { name: "duration", type: "select", values: [{ value: "5s" }, { value: "10s" }], default: "5s" },
      input_image: { name: "input_image", type: "image", role: "start_frame" },
      last_frame: { name: "last_frame", type: "image", role: "end_frame" },
    },
  },
];

function TestConsumer({ onMountStore }) {
  const store = usePromptBarStoreInstance();
  const prompt = usePromptBarStore((s) => s.prompt);
  const selectedModelId = usePromptBarStore((s) => s.selectedModelId);
  const parameterValues = usePromptBarStore((s) => s.parameterValues);
  const activeMode = usePromptBarStore((s) => s.activeMode);

  React.useEffect(() => {
    if (onMountStore) onMountStore(store);
  }, [store, onMountStore]);

  return (
    <div>
      <span data-testid="prompt-display">{prompt}</span>
      <span data-testid="model-display">{selectedModelId}</span>
      <span data-testid="ratio-display">{parameterValues?.aspect_ratio}</span>
      <span data-testid="mode-display">{activeMode}</span>
    </div>
  );
}

describe("PromptBar cross-page persistence", () => {
  beforeEach(() => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.clear();
    }
    if (clearPersistentPromptBarStores) {
      clearPersistentPromptBarStores();
    }
  });

  it("persists prompt, parameter config select, model, and references across unmount and remount (page navigation)", () => {
    let capturedStore = null;

    // 1. Mount on Page 1 (e.g. AssetsPage)
    const { unmount } = render(
      <PromptBarStoreProvider
        type={testType}
        initialModels={mockModels}
        persistKey="test-project-1"
      >
        <TestConsumer onMountStore={(s) => { capturedStore = s; }} />
      </PromptBarStoreProvider>
    );

    expect(capturedStore).not.toBeNull();

    // 2. User types prompt, selects model, modifies config parameter, and adds reference
    act(() => {
      capturedStore.getState().setPrompt("A cinematic view of mountains");
      capturedStore.getState().selectModel("model-image-1");
      capturedStore.getState().setParameter("aspect_ratio", "16:9");
      capturedStore.getState().setParameter("quality", "2K");
      capturedStore.getState().setParameter("images", [{ id: "ref-1", url: "https://example.com/ref.png" }]);
      capturedStore.getState().setActiveMode("video");
      capturedStore.getState().setActiveSubMode("frames");
    });

    // Verify state is active in store
    expect(capturedStore.getState().prompt).toBe("A cinematic view of mountains");
    expect(capturedStore.getState().parameterValues.aspect_ratio).toBe("16:9");
    expect(capturedStore.getState().parameterValues.quality).toBe("2K");
    expect(capturedStore.getState().parameterValues.images).toEqual([
      { id: "ref-1", url: "https://example.com/ref.png" },
    ]);
    expect(capturedStore.getState().activeMode).toBe("video");
    expect(capturedStore.getState().activeSubMode).toBe("frames");

    // 3. User navigates away to another page (Page 1 unmounts)
    unmount();

    // 4. User navigates to Page 2 or returns to Page 1 (new component mounts with same project key)
    let remountedStore = null;
    render(
      <PromptBarStoreProvider
        type={testType}
        initialModels={mockModels}
        persistKey="test-project-1"
      >
        <TestConsumer onMountStore={(s) => { remountedStore = s; }} />
      </PromptBarStoreProvider>
    );

    // 5. Assert: The prompt, parameter config selects, model, and references are preserved without being removed
    expect(remountedStore).not.toBeNull();
    expect(remountedStore.getState().prompt).toBe("A cinematic view of mountains");
    expect(remountedStore.getState().selectedModelId).toBe("model-image-1");
    expect(remountedStore.getState().parameterValues.aspect_ratio).toBe("16:9");
    expect(remountedStore.getState().parameterValues.quality).toBe("2K");
    expect(remountedStore.getState().parameterValues.images).toEqual([
      { id: "ref-1", url: "https://example.com/ref.png" },
    ]);
    expect(remountedStore.getState().activeMode).toBe("video");
    expect(remountedStore.getState().activeSubMode).toBe("frames");
  });

  it("rehydrates prompt, parameters, model, and references from sessionStorage after memory is cleared (e.g. page reload)", () => {
    // 1. Simulate existing state saved in sessionStorage for a project
    const savedState = {
      prompt: "Saved prompt across page reload",
      selectedModelId: "model-video-1",
      parameterValues: {
        aspect_ratio: "16:9",
        duration: "10s",
        input_image: "https://example.com/start.png",
      },
      elements: [{ id: "elem-1", name: "knight" }],
      characters: [{ id: "char-1", name: "hero" }],
      activeMode: "video",
      activeSubMode: "frames",
    };

    window.sessionStorage.setItem("test-project-reload_global", JSON.stringify(savedState));

    // Ensure in-memory registry has no cache for this key
    clearPersistentPromptBarStores();

    // 2. Mount component
    let mountedStore = null;
    render(
      <PromptBarStoreProvider
        type={testType}
        initialModels={mockModels}
        persistKey="test-project-reload"
      >
        <TestConsumer onMountStore={(s) => { mountedStore = s; }} />
      </PromptBarStoreProvider>
    );

    // 3. Verify state was rehydrated
    expect(mountedStore).not.toBeNull();
    expect(mountedStore.getState().prompt).toBe("Saved prompt across page reload");
    expect(mountedStore.getState().selectedModelId).toBe("model-video-1");
    expect(mountedStore.getState().parameterValues.aspect_ratio).toBe("16:9");
    expect(mountedStore.getState().parameterValues.duration).toBe("10s");
    expect(mountedStore.getState().parameterValues.input_image).toBe("https://example.com/start.png");
    expect(mountedStore.getState().elements).toEqual([{ id: "elem-1", name: "knight" }]);
    expect(mountedStore.getState().characters).toEqual([{ id: "char-1", name: "hero" }]);
    expect(mountedStore.getState().activeMode).toBe("video");
    expect(mountedStore.getState().activeSubMode).toBe("frames");
  });
});
