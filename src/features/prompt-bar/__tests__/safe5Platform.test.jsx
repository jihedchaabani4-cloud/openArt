/**
 * SAFE-5: Platform Integration Harness & Characterization Tests
 *
 * Test harness: mountPromptBar
 * Mounts PromptBarPlatform within jsdom, mocking only unavoidable dependencies
 * (next/navigation routing, Lexical PromptEditor).
 *
 * Tests:
 * 1. Mode/subMode slot rendering: image -> Reference; video/frames -> Start & End; video/reference -> Reference
 * 2. Generate execution: frames model with input_image & last_frame clicking Generate calls onGenerate with golden payload
 * 3. Frames -> Reference transition: clears last_frame and input_image via mode-switch cleanup effect
 * 4. PB-K1 collision: reference in input_image in image mode survives transition to video/frames
 * 5. Prompt-only model hides all reference slots
 * 6. Generate button is disabled while isGenerating is true
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act, fireEvent, screen, cleanup } from "@testing-library/react";

// Mock unavoidable DOM/routing dependencies
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
} from "../features/generated-media/generatedMedia.config.js";
import { generatedMediaType } from "../composition/generatedMedia.type.js";
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

/**
 * Test Harness Helper: mountPromptBar
 *
 * Mounts PromptBarPlatform with real dependencies (Core, Store, Config, Platform),
 * mocking only Lexical editor and Next.js router.
 *
 * @param {object} options
 * @param {object[]} [options.models] - Models catalog (defaults to fixtureModels)
 * @param {object} [options.type] - CompositionType (defaults to generatedMediaType)
 * @param {object} [options.featureConfig] - FeatureConfig (defaults to generatedMedia featureConfig)
 * @param {string} [options.projectId] - Project ID for route simulation
 * @param {boolean} [options.isGenerating] - Generation prop override
 * @param {function} [options.onGenerate] - Callback spy
 * @returns {{ renderResult: object, store: object, onGenerate: function, unmount: function }}
 */
function mountPromptBar({
  models = fixtureModels,
  type = generatedMediaType,
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

      // Default: image mode with nanobana_pro
      act(() => {
        store.getState().setActiveMode("image");
        store.getState().selectModel("nanobana_pro");
      });

      expect(screen.getByText("Ref")).toBeDefined();
      expect(screen.queryByText("Start")).toBeNull();
      expect(screen.queryByText("End")).toBeNull();

      // Switch to video mode, frames subMode
      act(() => {
        store.getState().setActiveMode("video");
        store.getState().setActiveSubMode("frames");
        store.getState().selectModel("seedance_2_5");
      });

      expect(screen.getByText("Start")).toBeDefined();
      expect(screen.getByText("End")).toBeDefined();
      expect(screen.queryByText("Ref")).toBeNull();

      unmount();

      // Switch to video mode, reference subMode
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
        refStore.getState().setActiveMode("video");
        refStore.getState().setActiveSubMode("reference");
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
        store.getState().setActiveMode("video");
        store.getState().setActiveSubMode("frames");
        store.getState().selectModel("seedance_2_5");
        store.getState().setPrompt("A drone flying over forest");
        store.getState().setParameter("input_image", { workflow_id: "wf_start" });
        store.getState().setParameter("last_frame", { workflow_id: "wf_end" });
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
      const generatedPayload = onGenerateSpy.mock.calls[0][0];

      // Must match golden payload from SAFE-1
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
        store.getState().setActiveMode("video");
        store.getState().setActiveSubMode("frames");
        store.getState().selectModel("video_ref_clean");
        store.getState().setParameter("input_image", { workflow_id: "wf_start_val" });
        store.getState().setParameter("last_frame", { workflow_id: "wf_end_val" });
      });

      expect(store.getState().parameterValues.input_image).toBeDefined();
      expect(store.getState().parameterValues.last_frame).toBeDefined();

      // Switch to Reference subMode
      act(() => {
        store.getState().setActiveSubMode("reference");
      });

      // Mode-switch cleanup effect clears keys not part of the active composition
      expect(store.getState().parameterValues.input_image).toBeUndefined();
      expect(store.getState().parameterValues.last_frame).toBeUndefined();
    });
  });

  describe("4. PB-K1 Collision on Image -> Video/Frames Transition", () => {
    it("pins PB-K1: reference stored in input_image in image mode survives transition to video/frames as Start Frame", () => {
      // CURRENT BEHAVIOR (known issue PB-K1):
      // An image model with input_image stores its reference in input_image.
      // When switching to video/frames, because frames declares input_image as Start Frame,
      // the mode-switch cleanup does NOT clear input_image.
      // Thus, the reference silently becomes Start Frame!
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

      // 1. Image mode: user attaches a reference (stored in input_image)
      act(() => {
        store.getState().setActiveMode("image");
        store.getState().selectModel("img_model_k1");
        store.getState().setParameter("input_image", { workflow_id: "wf_ref_turned_start" });
      });

      expect(store.getState().parameterValues.input_image).toEqual({
        workflow_id: "wf_ref_turned_start",
      });

      // 2. User switches to video mode with frames subMode
      act(() => {
        store.getState().setActiveMode("video");
        store.getState().setActiveSubMode("frames");
        store.getState().selectModel("seedance_2_5");
      });

      // Verify PB-K1 symptom: input_image is NOT cleared and is now the Start Frame!
      expect(store.getState().parameterValues.input_image).toEqual({
        workflow_id: "wf_ref_turned_start",
      });
    });
  });

  describe("5. Prompt-Only Model Reference Hiding", () => {
    it("a prompt-only model hides the reference slots", () => {
      const { store } = mountPromptBar({
        models: [normalizedPromptOnlyModel],
        projectId: "proj_prompt_only",
      });

      act(() => {
        store.getState().setActiveMode("image");
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
        store.getState().setActiveMode("video");
        store.getState().setActiveSubMode("frames");
        store.getState().selectModel("seedance_2_5");
        store.getState().setParameter("input_image", { workflow_id: "wf_start" });
      });

      const generateBtn = screen.getByRole("button", { name: "Generate" });
      expect(generateBtn.disabled).toBe(true);

      // Attempt to click
      fireEvent.click(generateBtn);
      expect(onGenerateSpy).not.toHaveBeenCalled();
    });
  });
});
