import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { GeneratedPromptBar } from "../templates/GeneratedPromptBar.jsx";
import { clearPersistentPromptBarStores, getActivePromptBarStore } from "../store/PromptBarStoreContext.js";
import { registry } from "../store/registry.js";

// Mock PromptEditor to keep tests fast and isolated
vi.mock("../ui/common/editor/PromptEditor.jsx", () => ({
  PromptEditor: ({ value, onChange, onSubmit }) => (
    <div data-testid="mock-prompt-editor">
      <input
        data-testid="mock-prompt-input"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
      <button data-testid="mock-submit-btn" onClick={onSubmit}>
        Submit
      </button>
    </div>
  ),
}));

const fixtureModels = [
  {
    id: "flux_schnell",
    name: "Flux Schnell",
    domain: "image",
    capabilities: {},
    parameters: {
      prompt: { type: "text" },
      aspect_ratio: { type: "select", default: "1:1" },
      images: { type: "image[]", max: 4 },
    },
  },
  {
    id: "seedance_2_5",
    name: "Seedance 2.5",
    domain: "video",
    capabilities: { input_image: true, last_frame: true },
    parameters: {
      prompt: { type: "text" },
      input_image: { type: "image" },
      last_frame: { type: "image" },
      duration: { type: "select", default: 5 },
      aspect_ratio: { type: "select", default: "16:9" },
      resolution: { type: "select", default: "720p" },
    },
  },
];

describe("GeneratedPromptBar Wrapper", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      window.history.pushState({}, "", "/cinema-studio/proj_test/assets");
    }
    clearPersistentPromptBarStores();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders with generated-media template, showing Reference slot in image mode", () => {
    render(
      <GeneratedPromptBar
        models={fixtureModels}
        onGenerate={vi.fn()}
      />
    );

    // Image mode renders reference slot button with "Ref"
    const addRefBtn = screen.getByTitle("Add Reference / Element / Character");
    expect(addRefBtn).toBeTruthy();
    expect(addRefBtn.textContent).toContain("Ref");
  });

  it("produces golden payload matching bare platform when generating with frames model", async () => {
    const onGenerateSpy = vi.fn();

    render(
      <GeneratedPromptBar
        models={fixtureModels}
        onGenerate={onGenerateSpy}
        projectId="proj_test"
      />
    );

    const store = getActivePromptBarStore();
    expect(store).not.toBeNull();

    act(() => {
      store.getState().setActiveMode("video");
      store.getState().setActiveSubMode("frames");
      store.getState().selectModel("seedance_2_5");
      store.getState().setPrompt("A drone flying over forest");
      store.getState().setParameter("input_image", {
        id: "start_1",
        workflow_id: "wf_start",
        url: "https://example.com/start.png",
      });
      store.getState().setParameter("last_frame", {
        id: "end_1",
        workflow_id: "wf_end",
        url: "https://example.com/end.png",
      });
      store.getState().setParameter("duration", 10);
      store.getState().setParameter("aspect_ratio", "16:9");
      store.getState().setParameter("resolution", "1080p");
    });

    const generateBtn = screen.getByRole("button", { name: "Generate" });
    expect(generateBtn.disabled).toBe(false);

    await act(async () => {
      fireEvent.click(generateBtn);
    });

    expect(onGenerateSpy).toHaveBeenCalledTimes(1);
    expect(onGenerateSpy.mock.calls[0][0]).toEqual({
      model: "seedance_2_5",
      prompt: "A drone flying over forest",
      parameters: {
        input_image: "wf_start",
        last_frame: "wf_end",
        duration: 10,
        aspect_ratio: "16:9",
        resolution: "1080p",
      },
      references: ["wf_start", "wf_end"],
      elements: [],
      characters: [],
    });
  });

  it("forwards extra props like className and isGenerating", () => {
    render(
      <GeneratedPromptBar
        models={fixtureModels}
        onGenerate={vi.fn()}
        isGenerating={true}
        className="custom-test-class"
      />
    );

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeTruthy();
  });

  it("two wrappers with different instanceId do not share state", () => {
    render(
      <div>
        <GeneratedPromptBar
          models={fixtureModels}
          instanceId="bar-alpha"
          projectId="proj_test"
          onGenerate={vi.fn()}
        />
        <GeneratedPromptBar
          models={fixtureModels}
          instanceId="bar-beta"
          projectId="proj_test"
          onGenerate={vi.fn()}
        />
      </div>
    );

    const storeAlpha = registry.get({ templateId: "generated-media", instanceId: "bar-alpha", projectId: "proj_test" });
    const storeBeta = registry.get({ templateId: "generated-media", instanceId: "bar-beta", projectId: "proj_test" });

    expect(storeAlpha).toBeTruthy();
    expect(storeBeta).toBeTruthy();
    expect(storeAlpha).not.toBe(storeBeta);

    act(() => {
      storeAlpha.getState().setPrompt("Prompt for Alpha only");
    });

    expect(storeAlpha.getState().prompt).toBe("Prompt for Alpha only");
    expect(storeBeta.getState().prompt).toBe("");
  });
});
