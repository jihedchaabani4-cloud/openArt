import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import {
  PromptBarStoreProvider,
  usePromptBarStoreInstance,
} from "../store/PromptBarStoreContext.js";
import { registry } from "../store/registry.js";
import { promptBarService } from "../api/promptBarService.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";
import { characterTemplate } from "../templates/character.template.js";
import { fixtureModels, normalizedFramesModel } from "./fixtures/models.fixture.js";

function createMockStorage() {
  const map = new Map();
  return {
    getItem: vi.fn((k) => (map.has(k) ? map.get(k) : null)),
    setItem: vi.fn((k, v) => map.set(k, String(v))),
    removeItem: vi.fn((k) => map.delete(k)),
    clear: vi.fn(() => map.clear()),
  };
}

describe("CLEAN-2: Template injected at store creation (PB-D-23)", () => {
  beforeEach(() => {
    for (const entry of registry.list()) {
      registry.markUnmounted(entry.identity);
    }
    registry.pruneOtherProjects("__force_clear_all__");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("(a) store created via provider/registry has template before any React effect runs; switchMode('video','frames') returns ok and setTemplate is sealed out", () => {
    let renderPhaseTemplate = null;
    let renderPhaseSwitchResult = null;
    let hasSetTemplate = null;

    function RenderPhaseProbe() {
      const store = usePromptBarStoreInstance();
      if (renderPhaseTemplate === null) {
        hasSetTemplate = "setTemplate" in store.getState();
        renderPhaseTemplate = store.getState().template;
        renderPhaseSwitchResult = store.getState().switchMode("video", "frames");
      }
      return null;
    }

    render(
      <PromptBarStoreProvider
        type={generatedMediaTemplate}
        templateId="generated-media"
        projectId="proj_clean2_a"
        initialModels={fixtureModels}
        persist={false}
      >
        <RenderPhaseProbe />
      </PromptBarStoreProvider>
    );

    expect(renderPhaseTemplate).toBe(generatedMediaTemplate);
    expect(typeof renderPhaseTemplate?.filterEligibleModels).toBe("function");
    expect(typeof renderPhaseTemplate?.resolveParameterMapping).toBe("function");
    expect(typeof renderPhaseTemplate?.createActions).toBe("function");
    expect("minPromptLength" in renderPhaseTemplate).toBe(true);
    expect(renderPhaseSwitchResult?.ok).toBe(true);
    expect(hasSetTemplate).toBe(false);
  });

  it("(b) pending-actions drain path applies queued animateMedia on provider mount without child useEffect", () => {
    const mockStorage = createMockStorage();
    const projectId = "proj_clean2_b";
    const service = promptBarService(
      { templateId: "generated-media", projectId },
      { registry, storage: mockStorage }
    );

    const queueRes = service.animateMedia({
      id: "asset_anim_1",
      workflow_id: "wf_anim_1",
      url: "https://example.com/frame.png",
      type: "image",
    });
    expect(queueRes.ok).toBe(false);
    expect(queueRes.details?.queued).toBe(true);

    let capturedStore = null;

    function ChildWithoutSetTemplateEffect() {
      const store = usePromptBarStoreInstance();
      if (!capturedStore) {
        capturedStore = store;
      }
      return null;
    }

    render(
      <PromptBarStoreProvider
        type={generatedMediaTemplate}
        templateId="generated-media"
        projectId={projectId}
        initialModels={fixtureModels}
        storage={mockStorage}
      >
        <ChildWithoutSetTemplateEffect />
      </PromptBarStoreProvider>
    );

    expect(capturedStore).not.toBeNull();
    expect(capturedStore.getState().setTemplate).toBeUndefined();
    const state = capturedStore.getState();
    expect(state.activeMode).toBe("video");
    expect(state.activeSubMode).toBe("frames");
    expect(state.selectedModelId).toBe(normalizedFramesModel.id);
    expect(state.parameterValues.input_image).toMatchObject({
      workflow_id: "wf_anim_1",
    });
  });

  it("(c) renderToString on the server creates a non-registered store (registry.list().length === 0) that also has the template", () => {
    vi.stubGlobal("window", undefined);

    let ssrStore = null;
    function ServerProbe() {
      ssrStore = usePromptBarStoreInstance();
      return null;
    }

    renderToString(
      <PromptBarStoreProvider
        type={generatedMediaTemplate}
        templateId="generated-media"
        projectId="proj_clean2_ssr"
        initialModels={fixtureModels}
        persist={false}
      >
        <ServerProbe />
      </PromptBarStoreProvider>
    );

    expect(registry.list().length).toBe(0);
    expect(ssrStore).not.toBeNull();
    expect(ssrStore.getState().template).toBe(generatedMediaTemplate);
  });

  it("(d) setTemplate is removed so template is immutable after store creation", () => {
    let capturedStore = null;
    function Capture() {
      capturedStore = usePromptBarStoreInstance();
      return null;
    }

    render(
      <PromptBarStoreProvider
        type={generatedMediaTemplate}
        templateId="generated-media"
        projectId="proj_clean2_d"
        initialModels={fixtureModels}
        persist={false}
      >
        <Capture />
      </PromptBarStoreProvider>
    );

    expect(capturedStore.getState().template).toBe(generatedMediaTemplate);
    expect(capturedStore.getState().setTemplate).toBeUndefined();
    expect(characterTemplate.id).toBe("character");

    const switchRes = capturedStore.getState().switchMode("video", "frames");
    expect(switchRes.ok).toBe(true);
    expect(capturedStore.getState().activeMode).toBe("video");
  });
});
