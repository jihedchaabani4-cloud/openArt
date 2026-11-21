import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import * as React from "react";
import {
  PromptBarStoreProvider,
  usePromptBarStoreInstance,
  clearPersistentPromptBarStores,
} from "../store/PromptBarStoreContext.js";
import { usePromptBarStore } from "../store/usePromptBarStore.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import { selectElements, selectCharacters } from "../core/entityService.js";

const testType = {
  ...generatedMediaTemplate,
  id: "test-generated-media",
  name: "Test Media",
};

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
    capabilities: { input_image: true, last_frame: true },
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

    act(() => {
      capturedStore.getState().setPrompt("A cinematic view of mountains");
      capturedStore.getState().selectModel("model-image-1");
      capturedStore.getState().setSetting("aspect_ratio", "16:9");
      capturedStore.getState().setSetting("quality", "2K");
      capturedStore.getState().attachMedia({
        role: "reference",
        value: { id: "ref-1", url: "https://example.com/ref.png" },
      });
    });

    expect(capturedStore.getState().prompt).toBe("A cinematic view of mountains");
    expect(capturedStore.getState().parameterValues.aspect_ratio).toBe("16:9");
    expect(capturedStore.getState().parameterValues.quality).toBe("2K");
    expect(capturedStore.getState().parameterValues.images).toHaveLength(1);
    expect(capturedStore.getState().parameterValues.images[0].id).toBe("ref-1");

    unmount();

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

    expect(remountedStore).not.toBeNull();
    expect(remountedStore.getState().prompt).toBe("A cinematic view of mountains");
    expect(remountedStore.getState().selectedModelId).toBe("model-image-1");
    expect(remountedStore.getState().parameterValues.aspect_ratio).toBe("16:9");
    expect(remountedStore.getState().parameterValues.quality).toBe("2K");
    expect(remountedStore.getState().parameterValues.images[0].id).toBe("ref-1");
  });

  it("rehydrates prompt, parameters, model, and normalized entities from canonical pb2 sessionStorage after reload", () => {
    const savedState = {
      v: 2,
      prompt: "Saved prompt across page reload",
      selectedModelId: "model-image-1",
      parameterValues: {
        aspect_ratio: "16:9",
        quality: "2K",
        images: [
          { id: "elem-1", workflow_id: "elem-1", displayName: "knight", type: "element", url: "https://example.com/e.png" },
          { id: "char-1", workflow_id: "char-1", displayName: "hero", type: "character", url: "https://example.com/c.png" },
        ],
      },
      activeMode: "image",
      activeSubMode: "frames",
    };

    window.sessionStorage.setItem(
      "pb2:test-generated-media:test-project-reload:global",
      JSON.stringify(savedState)
    );

    clearPersistentPromptBarStores();
    window.sessionStorage.setItem(
      "pb2:test-generated-media:test-project-reload:global",
      JSON.stringify(savedState)
    );

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

    expect(mountedStore).not.toBeNull();
    expect(mountedStore.getState().prompt).toBe("Saved prompt across page reload");
    expect(mountedStore.getState().selectedModelId).toBe("model-image-1");
    expect(mountedStore.getState().parameterValues.aspect_ratio).toBe("16:9");
    expect(mountedStore.getState().parameterValues.quality).toBe("2K");
    expect(selectElements(mountedStore.getState())[0].id).toBe("elem-1");
    expect(selectCharacters(mountedStore.getState())[0].id).toBe("char-1");
    expect(mountedStore.getState().activeMode).toBe("image");
  });

  it("does not trigger setState during render when reusing a persistent store with initialModels", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const { unmount } = render(
        <PromptBarStoreProvider
          type={testType}
          initialModels={mockModels}
          persistKey="test-no-render-setstate"
        >
          <TestConsumer />
        </PromptBarStoreProvider>
      );

      unmount();

      render(
        <PromptBarStoreProvider
          type={testType}
          initialModels={mockModels}
          persistKey="test-no-render-setstate"
        >
          <TestConsumer />
        </PromptBarStoreProvider>
      );

      const setStateInRenderCalls = errorSpy.mock.calls.filter(
        ([msg]) => typeof msg === "string" && msg.includes("Cannot update a component")
      );
      expect(setStateInRenderCalls).toHaveLength(0);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
