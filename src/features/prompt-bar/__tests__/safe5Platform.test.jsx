/**
 * SAFE-5: Platform Integration Harness & Characterization Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act, fireEvent, screen, cleanup } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/cinema-studio/proj_test/assets",
}));

vi.mock("@/components/cinema-studio/prompt-bar/editor/PromptEditor.jsx", () => ({
  PromptEditor: ({ value, onChange, placeholder }) => (
    <textarea
      data-testid="mock-prompt-editor"
      value={value || ""}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

import { PromptBarPlatform } from "@/components/cinema-studio/prompt-bar/PromptBarPlatform.jsx";
import {
  generatedMediaTemplate,
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
} from "../templates/generatedMedia.template.js";
import { clearPersistentPromptBarStores, getActivePromptBarStore } from "../store/PromptBarStoreContext.js";
import {
  fixtureModels,
  normalizedFramesModel,
  normalizedPromptOnlyModel,
} from "./fixtures/models.fixture.js";

const featureConfig = {
  COMPOSITION_REQUIREMENTS,
  filterEligibleModels,
  resolveParameterMapping,
};

function mountPromptBar({
  models = fixtureModels,
  type = generatedMediaTemplate,
  featureConfig: config = featureConfig,
  projectId = "proj_test",
  isGenerating = false,
  onGenerate = vi.fn(),
} = {}) {
  window.history.pushState({}, "", `/cinema-studio/${projectId}`);

  const renderResult = render(
    <PromptBarPlatform
      type={type}
      featureConfig={config}
      models={models}
      onGenerate={onGenerate}
      isGenerating={isGenerating}
      persistKey={`test-bar-${projectId}`}
    />
  );

  const store = getActivePromptBarStore();
  return { renderResult, store, onGenerate, unmount: renderResult.unmount };
}

describe("SAFE-5: Platform Integration Harness", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      window.history.pushState({}, "", "/");
    }
    clearPersistentPromptBarStores();
  });

  afterEach(() => {
    cleanup();
  });

  describe("1. Mode and SubMode slot rendering", () => {
    it("image mode renders one Reference slot; video/frames shows Start and End slots; video/reference shows one Reference slot", async () => {
      const { store, unmount } = mountPromptBar();

      act(() => {
        store.getState().switchMode("image");
        store.getState().selectModel("nanobana_pro");
      });

      expect(screen.getByText("Ref")).toBeDefined();
      expect(screen.queryByText("Start")).toBeNull();
      expect(screen.queryByText("End")).toBeNull();

      act(() => {
        store.getState().switchMode("video", "frames");
        store.getState().selectModel("seedance_2_5");
      });

      expect(screen.getByText("Start")).toBeDefined();
      expect(screen.getByText("End")).toBeDefined();
      expect(screen.queryByText("Ref")).toBeNull();

      unmount();

      const videoRefModel = {
        id: "video_with_refs",
        name: "Video With References",
        domain: "video",
        capabilities: {},
        parameters: {
          prompt: { type: "text" },
          images: { type: "image[]", max: 4 },
        },
      };

      const { store: refStore } = mountPromptBar({
        models: [...fixtureModels, videoRefModel],
        projectId: "proj_video_ref",
      });

      act(() => {
        refStore.getState().switchMode("video", "reference");
        refStore.getState().selectModel("video_with_refs");
      });

      expect(screen.getByText("Ref")).toBeDefined();
      expect(screen.queryByText("Start")).toBeNull();
      expect(screen.queryByText("End")).toBeNull();
    });
  });

  describe("2. Generate Execution with Golden Payload", () => {
    it("with frames model selected, filling start and end frames and clicking Generate calls onGenerate with golden payload", async () => {
      const onGenerateSpy = vi.fn();
      const { store } = mountPromptBar({ onGenerate: onGenerateSpy });

      act(() => {
        store.getState().switchMode("video", "frames");
        store.getState().selectModel("seedance_2_5");
        store.getState().setPrompt("A drone flying over forest");
        store.getState().attachMedia({ role: "start", value: { workflow_id: "wf_start" } });
        store.getState().attachMedia({ role: "end", value: { workflow_id: "wf_end" } });
        store.getState().setSetting("duration", 10);
        store.getState().setSetting("aspect_ratio", "16:9");
        store.getState().setSetting("resolution", "1080p");
      });

      const generateBtn = screen.getByRole("button", { name: "Generate" });
      expect(generateBtn.disabled).toBe(false);

      await act(async () => {
        fireEvent.click(generateBtn);
      });

      expect(onGenerateSpy).toHaveBeenCalledTimes(1);
      const generatedPayload = onGenerateSpy.mock.calls[0][0];

      expect(generatedPayload).toEqual({
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
  });

  describe("3. Frames to Reference mode-switch cleanup", () => {
    it("switching from Frames to Reference clears last_frame and input_image", () => {
      const videoRefModel = {
        id: "video_ref_clean",
        name: "Video Ref Model",
        domain: "video",
        capabilities: { input_image: true, last_frame: true },
        parameters: {
          prompt: { type: "text" },
          input_image: { type: "image" },
          last_frame: { type: "image" },
          images: { type: "image[]", max: 4 },
        },
      };

      const { store } = mountPromptBar({
        models: [videoRefModel],
        projectId: "proj_clean_test",
      });

      act(() => {
        store.getState().switchMode("video", "frames");
        store.getState().selectModel("video_ref_clean");
        store.getState().attachMedia({ role: "start", value: { workflow_id: "wf_start_val" } });
        store.getState().attachMedia({ role: "end", value: { workflow_id: "wf_end_val" } });
      });

      expect(store.getState().parameterValues.input_image).toBeDefined();
      expect(store.getState().parameterValues.last_frame).toBeDefined();

      act(() => {
        store.getState().switchMode("video", "reference");
      });

      expect(store.getState().parameterValues.input_image).toBeUndefined();
      expect(store.getState().parameterValues.last_frame).toBeUndefined();
    });
  });

  describe("4. PB-K1 Collision on Image -> Video/Frames Transition (Resolved PB-D-03)", () => {
    it("verifies PB-K1 resolution: reference stored in input_image is pruned on transition to video/frames", () => {
      const imageModel = {
        id: "img_model_k1",
        name: "Image Model K1",
        domain: "image",
        capabilities: { input_image: true },
        parameters: {
          prompt: { type: "text" },
          input_image: { type: "image", role: "start_frame" },
        },
      };

      const { store } = mountPromptBar({
        models: [imageModel, normalizedFramesModel],
        projectId: "proj_pb_k1",
      });

      act(() => {
        store.getState().switchMode("image");
        store.getState().selectModel("img_model_k1");
        store.getState().attachMedia({ role: "reference", value: { workflow_id: "wf_ref_turned_start" } });
      });

      expect(store.getState().parameterValues.input_image).toMatchObject({
        workflow_id: "wf_ref_turned_start",
      });

      act(() => {
        store.getState().switchMode("video", "frames");
      });

      expect(store.getState().parameterValues.input_image).toBeUndefined();
    });
  });

  describe("5. Prompt-Only Model Reference Hiding", () => {
    it("a prompt-only model hides the reference slots", () => {
      const { store } = mountPromptBar({
        models: [normalizedPromptOnlyModel],
        projectId: "proj_prompt_only",
      });

      act(() => {
        store.getState().switchMode("image");
        store.getState().selectModel("seedream_v5");
      });

      expect(screen.queryByText("Ref")).toBeNull();
      expect(screen.queryByText("Start")).toBeNull();
      expect(screen.queryByText("End")).toBeNull();
    });
  });

  describe("6. Generate Disabled on isGenerating", () => {
    it("Generate button is disabled while isGenerating is true", () => {
      const onGenerateSpy = vi.fn();
      const { store } = mountPromptBar({
        onGenerate: onGenerateSpy,
        isGenerating: true,
      });

      act(() => {
        store.getState().switchMode("video", "frames");
        store.getState().selectModel("seedance_2_5");
        store.getState().attachMedia({ role: "start", value: { workflow_id: "wf_start" } });
      });

      const generateBtn = screen.getByRole("button", { name: "Generate" });
      expect(generateBtn.disabled).toBe(true);

      fireEvent.click(generateBtn);
      expect(onGenerateSpy).not.toHaveBeenCalled();
    });
  });
});
