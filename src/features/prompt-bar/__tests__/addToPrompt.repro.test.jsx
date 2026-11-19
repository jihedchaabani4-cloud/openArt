import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { render, screen, fireEvent, cleanup, waitFor, renderHook } from "@testing-library/react";
import { GeneratedPromptBar } from "@/components/cinema-studio/prompt-bar/GeneratedPromptBar.jsx";
import { clearPersistentPromptBarStores, getActivePromptBarStore } from "../store/PromptBarStoreContext.js";
import { promptBarService } from "../api/promptBarService.js";
import { adaptBackendCatalog } from "../core/modelManagement.js";
import { useWorkflowActions } from "@/features/workflows/model/useMediaActions";
import { clearPendingActions } from "../store/pendingActions.js";
import fs from "node:fs";
import path from "node:path";

let mockPathname = "/cinema-studio/proj-real/assets";
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ projectId: "proj-real" }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

// Load REAL backend manifests from ../apiOpenArt
function loadRealBackendModels() {
  const dir = path.resolve(process.cwd(), "../apiOpenArt/src/systems/models/internal/manifests");
  const rawDtos = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name, "model.json");
    if (!fs.existsSync(p)) continue;
    const m = JSON.parse(fs.readFileSync(p, "utf8"));
    if (m.systemOnly || m.visibility === "internal") continue;
    rawDtos.push({
      key: m.modelFamily || m.id,
      displayName: m.displayName,
      description: m.description || "",
      category: m.domain,
      tier: m.badge || "standard",
      pricing: m.retailPricing || (m.operations && Object.values(m.operations)[0]?.retailPricing) || {},
      tags: m.badge ? [m.badge.toLowerCase()] : [],
      icon: m.iconUrl || "",
      badge: m.badge || null,
      capabilities: m.capabilities || {},
      parameters: m.canonicalInputs || m.parameters || {},
    });
  }
  return adaptBackendCatalog(rawDtos);
}

const realModelsAll = loadRealBackendModels();

const realMediaImg1 = {
  name: "m-img-1",
  id: "m-img-1",
  url: "https://cdn.example.com/gen-1.png",
  file_url: "https://cdn.example.com/gen-1.png",
  status: "success",
  projectId: "proj-real",
  workflowId: "wf-gen-1",
  workflow_id: "wf-gen-1",
  role: "output",
  is_primary: true,
  isPrimary: true,
  step_id: "GEN",
  workflowStepId: "GEN",
  create_time: "2026-11-19T10:00:00Z",
  image: {
    generatedImage: { url: "https://cdn.example.com/gen-1.png", prompt: "Neon city" },
    dimensions: { width: 1024, height: 1024 },
  },
};

const realMediaImg2 = {
  name: "m-img-2",
  id: "m-img-2",
  url: "https://cdn.example.com/gen-2.png",
  file_url: "https://cdn.example.com/gen-2.png",
  status: "success",
  projectId: "proj-real",
  workflowId: "wf-gen-1",
  workflow_id: "wf-gen-1",
  role: "output",
  is_primary: false,
  isPrimary: false,
  step_id: "GEN",
  workflowStepId: "GEN",
  create_time: "2026-11-19T10:00:01Z",
  image: {
    generatedImage: { url: "https://cdn.example.com/gen-2.png", prompt: "Neon city 2" },
    dimensions: { width: 1024, height: 1024 },
  },
};

const realMediaUpload = {
  name: "m-up-1",
  id: "m-up-1",
  url: "https://cdn.example.com/upload-1.png",
  file_url: "https://cdn.example.com/upload-1.png",
  status: "success",
  projectId: "proj-real",
  workflowId: "wf-up-1",
  workflow_id: "wf-up-1",
  role: "original",
  is_primary: true,
  isPrimary: true,
  step_id: "upload",
  workflowStepId: "upload",
  create_time: "2026-11-19T10:02:00Z",
  image: {
    generatedImage: null,
    userUploadedImage: { aspectRatio: "16:9" },
    dimensions: { width: 1920, height: 1080 },
  },
};

const realMediaChar1 = {
  name: "m-char-1",
  id: "m-char-1",
  url: "https://cdn.example.com/char-1.png",
  file_url: "https://cdn.example.com/char-1.png",
  status: "success",
  projectId: "proj-real",
  workflowId: "wf-char-1",
  workflow_id: "wf-char-1",
  role: "sheet",
  is_primary: true,
  isPrimary: true,
  step_id: "GEN",
  workflowStepId: "GEN",
  create_time: "2026-11-19T10:03:00Z",
  image: {
    generatedImage: { url: "https://cdn.example.com/char-1.png" },
    dimensions: { width: 1024, height: 1024 },
  },
};

const realMediaChar2 = {
  name: "m-char-2",
  id: "m-char-2",
  url: "https://cdn.example.com/char-2.png",
  file_url: "https://cdn.example.com/char-2.png",
  status: "success",
  projectId: "proj-real",
  workflowId: "wf-char-2",
  workflow_id: "wf-char-2",
  role: "sheet",
  is_primary: true,
  isPrimary: true,
  step_id: "GEN",
  workflowStepId: "GEN",
  create_time: "2026-11-19T10:04:00Z",
  image: {
    generatedImage: { url: "https://cdn.example.com/char-2.png" },
    dimensions: { width: 1024, height: 1024 },
  },
};

const looseStandaloneMedia = {
  id: "m-loose-1",
  name: "Loose Upload",
  url: "https://cdn.example.com/loose-1.png",
  status: "success",
  image_count: 5, // stale/bad count on a standalone non-entity upload
  create_time: "2026-11-19T10:05:00Z",
};

const charWorkflow1 = {
  id: "wf-char-1",
  name: "wf-char-1",
  display_name: "Hero Aria",
  projectId: "proj-real",
  workflow_type: "CHARACTER_SHEET",
  primary_media_id: "m-char-1",
  primaryMediaId: "m-char-1",
  items: [realMediaChar1, { ...realMediaChar1, id: "m-char-1b", url: "https://cdn.example.com/char-1b.png" }],
  media: [realMediaChar1, { ...realMediaChar1, id: "m-char-1b", url: "https://cdn.example.com/char-1b.png" }],
  metadata: { displayName: "Hero Aria", primaryMediaId: "m-char-1", createTime: "2026-11-19T10:03:00Z" },
};

const charWorkflow2 = {
  id: "wf-char-2",
  name: "wf-char-2",
  display_name: "Hero Kai",
  projectId: "proj-real",
  workflow_type: "CHARACTER_SHEET",
  primary_media_id: "m-char-2",
  primaryMediaId: "m-char-2",
  items: [realMediaChar2, { ...realMediaChar2, id: "m-char-2b", url: "https://cdn.example.com/char-2b.png" }],
  media: [realMediaChar2, { ...realMediaChar2, id: "m-char-2b", url: "https://cdn.example.com/char-2b.png" }],
  metadata: { displayName: "Hero Kai", primaryMediaId: "m-char-2", createTime: "2026-11-19T10:04:00Z" },
};

const genWorkflow1 = {
  id: "wf-gen-1",
  name: "wf-gen-1",
  display_name: "Neon City Batch",
  projectId: "proj-real",
  workflow_type: "IMAGE_GENERATION",
  primary_media_id: "m-img-1",
  primaryMediaId: "m-img-1",
  items: [realMediaImg1, realMediaImg2],
  media: [realMediaImg1, realMediaImg2],
  metadata: { displayName: "Neon City Batch", primaryMediaId: "m-img-1", createTime: "2026-11-19T10:00:00Z" },
};

const uploadWorkflow1 = {
  id: "wf-up-1",
  name: "wf-up-1",
  display_name: "Uploaded Photo",
  projectId: "proj-real",
  workflow_type: "UPLOAD",
  workflowType: "UPLOAD",
  is_upload: true,
  type: "upload",
  primary_media_id: "m-up-1",
  primaryMediaId: "m-up-1",
  items: [realMediaUpload],
  media: [realMediaUpload],
  metadata: { displayName: "Uploaded Photo", primaryMediaId: "m-up-1", createTime: "2026-11-19T10:02:00Z" },
};

const realProjectData = {
  projectName: "Test Project",
  projectId: "proj-real",
  projectContents: {
    workflows: [genWorkflow1, uploadWorkflow1, charWorkflow1, charWorkflow2],
    media: [realMediaImg1, realMediaImg2, realMediaUpload, realMediaChar1, realMediaChar2, looseStandaloneMedia],
  },
};

vi.mock("@/features/workflows/api/workflowsApi", () => ({
  useProjectData: () => ({ data: realProjectData }),
  useToggleWorkflowLike: () => ({ mutate: vi.fn() }),
  useRemoveWorkflow: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/features/media/model/useUploadMedia", () => ({
  useUploadMedia: () => ({ uploadMedia: vi.fn(), isUploading: false }),
}));

vi.mock("@/features/prompt-bar/core/useRealBackendModels", () => ({
  useRealBackendModels: () => ({ data: { models: realModelsAll } }),
}));

function realClick(el) {
  fireEvent.pointerDown(el);
  fireEvent.mouseDown(el);
  fireEvent.pointerUp(el);
  fireEvent.mouseUp(el);
  fireEvent.click(el);
}

describe("Phase 1+2 Comprehensive Repro Matrix — Add to prompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/cinema-studio/proj-real/assets";
    Element.prototype.scrollIntoView = vi.fn();
    if (!Range.prototype.getBoundingClientRect) {
      Range.prototype.getBoundingClientRect = () => ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 });
    }
    if (!Range.prototype.getClientRects) {
      Range.prototype.getClientRects = () => [];
    }
    if (typeof Text !== "undefined" && !Text.prototype.getBoundingClientRect) {
      Text.prototype.getBoundingClientRect = () => ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 });
    }
    window.sessionStorage.clear();
    clearPendingActions();
    window.history.pushState({}, "", "/cinema-studio/proj-real/assets");
    clearPersistentPromptBarStores();
  });

  afterEach(() => {
    cleanup();
  });

  it("S1: Async models -> Settings Drawer -> Vidéo -> Start -> Add to prompt -> End -> Add to prompt", async () => {
    function AsyncHost() {
      const [models, setModels] = useState([]);
      React.useEffect(() => {
        const t = setTimeout(() => setModels(realModelsAll), 10);
        return () => clearTimeout(t);
      }, []);
      return <GeneratedPromptBar projectId="proj-real" models={models} onGenerate={vi.fn()} />;
    }

    render(<AsyncHost />);
    const store = getActivePromptBarStore();

    await waitFor(() => {
      expect(Object.keys(store.getState().modelsMap).length).toBeGreaterThan(5);
    });

    const tuneBtn = screen.getByRole("button", { name: /Déclencheur des paramètres/i });
    realClick(tuneBtn);
    const videoBtn = await screen.findByRole("radio", { name: /Vidéo/i });
    realClick(videoBtn);

    expect(store.getState().activeMode).toBe("video");
    expect(store.getState().activeSubMode).toBe("frames");

    const startText = await screen.findByText("Start");
    realClick(startText.closest("[data-pill-focus]") || startText);

    const addBtn = await screen.findByRole("button", { name: "Add to prompt" });
    expect(addBtn.disabled).toBe(false);
    realClick(addBtn);

    expect(store.getState().parameterValues.input_image).toBeTruthy();

    const endText = await screen.findByText("End");
    realClick(endText.closest("[data-pill-focus]") || endText);

    const addBtn2 = await screen.findByRole("button", { name: "Add to prompt" });
    expect(addBtn2.disabled).toBe(false);
    realClick(addBtn2);

    expect(store.getState().parameterValues.last_frame).toBeTruthy();
  });

  it("S2: Video Frames -> click Start (open popover) -> switch to End while open -> Add to prompt -> click filled Start -> replace", async () => {
    render(<GeneratedPromptBar projectId="proj-real" models={realModelsAll} onGenerate={vi.fn()} />);
    const store = getActivePromptBarStore();
    await waitFor(() => expect(Object.keys(store.getState().modelsMap).length).toBeGreaterThan(5));
    act(() => store.getState().switchMode("video", "frames"));

    const startText = await screen.findByText("Start");
    realClick(startText.closest("[data-pill-focus]") || startText);
    await screen.findByRole("button", { name: "Add to prompt" });

    // Switch directly to End without closing popover
    const endText = await screen.findByText("End");
    realClick(endText.closest("[data-pill-focus]") || endText);

    const addBtnEnd = await screen.findByRole("button", { name: "Add to prompt" });
    realClick(addBtnEnd);

    expect(store.getState().parameterValues.last_frame).toBeTruthy();
    expect(store.getState().parameterValues.input_image).toBeUndefined();

    // Now fill Start, then click filled Start to replace it
    const startText2 = await screen.findByText("Start");
    realClick(startText2.closest("[data-pill-focus]") || startText2);
    realClick(await screen.findByRole("button", { name: "Add to prompt" }));
    const firstStartId = store.getState().parameterValues.input_image?.workflow_id;
    expect(firstStartId).toBeTruthy();

    // Click the filled Start thumbnail (ViewReference) to reopen popover and replace
    const startImg = document.querySelector(`img[src="${store.getState().parameterValues.input_image.url}"]`);
    expect(startImg).toBeTruthy();
    realClick(startImg.parentElement);
    const addBtnReplace = await screen.findByRole("button", { name: "Add to prompt" });
    realClick(addBtnReplace);
    expect(store.getState().parameterValues.input_image?.workflow_id).not.toBe(firstStartId);
  });

  it("S3: BUG 1 — @ mention after switchMode (images undefined) corrupts images to non-array and breaks 2nd @ Add to prompt", async () => {
    render(<GeneratedPromptBar projectId="proj-real" models={realModelsAll} onGenerate={vi.fn()} />);
    const store = getActivePromptBarStore();
    await waitFor(() => expect(store.getState().selectedModelId).toBeTruthy());

    act(() => store.getState().switchMode("video", "frames"));
    act(() => store.getState().switchMode("image"));

    const editable = document.querySelector('[contenteditable="true"]');
    editable.focus();
    fireEvent.keyDown(editable, { key: "@", code: "Digit2", shiftKey: true });

    const addBtn1 = await screen.findByRole("button", { name: "Add to prompt" });
    realClick(addBtn1);

    await waitFor(() => expect(store.getState().parameterValues.images).toBeTruthy());
    expect(Array.isArray(store.getState().parameterValues.images)).toBe(true);

    // 2nd @ mention -> Add to prompt MUST append 2nd image
    editable.focus();
    fireEvent.keyDown(editable, { key: "@", code: "Digit2", shiftKey: true });
    const addBtn2 = await screen.findByRole("button", { name: "Add to prompt" });
    realClick(addBtn2);

    await waitFor(() => {
      expect(store.getState().parameterValues.images).toHaveLength(2);
    });
  });

  it("S4: SUSPECT 6A — @ mention when editor has text + blur before click on Add to prompt", async () => {
    render(<GeneratedPromptBar projectId="proj-real" models={realModelsAll} onGenerate={vi.fn()} />);
    const store = getActivePromptBarStore();
    await waitFor(() => expect(store.getState().selectedModelId).toBeTruthy());

    // Simulate user typing "hello @" via store/editor update so prompt actually has text before '@'
    act(() => store.getState().setPrompt("hello @"));
    const editable = document.querySelector('[contenteditable="true"]');
    editable.focus();
    fireEvent.keyDown(editable, { key: "@", code: "Digit2", shiftKey: true });

    const addBtn = await screen.findByRole("button", { name: "Add to prompt" });

    // Simulate real browser mousedown -> editable blur BEFORE click
    fireEvent.mouseDown(addBtn);
    fireEvent.blur(editable);
    // Check if popover stayed open and Add to prompt still works!
    expect(screen.queryByRole("button", { name: "Add to prompt" })).toBeTruthy();
    fireEvent.mouseUp(addBtn);
    fireEvent.click(addBtn);

    await waitFor(() => {
      const imgs = store.getState().parameterValues.images;
      expect(Array.isArray(imgs) ? imgs.length : (imgs ? 1 : 0)).toBeGreaterThan(0);
    });
  });

  it("S5: BUG 3 — Image mode with 2 characters (4 images) -> switchMode('video','frames') -> '@' -> Add to prompt disabled?", async () => {
    render(<GeneratedPromptBar projectId="proj-real" models={realModelsAll} onGenerate={vi.fn()} />);
    const store = getActivePromptBarStore();
    await waitFor(() => expect(store.getState().selectedModelId).toBeTruthy());

    // Attach 2 characters (2 images each = 4 images total) in image mode
    act(() => {
      store.getState().attachMedia({
        role: "reference",
        value: { id: "wf-char-1", workflow_id: "wf-char-1", url: "https://cdn.example.com/char-1.png", type: "character", is_character: true, workflow_type: "CHARACTER_SHEET", image_count: 2 },
      });
      store.getState().attachMedia({
        role: "reference",
        value: { id: "wf-char-2", workflow_id: "wf-char-2", url: "https://cdn.example.com/char-2.png", type: "character", is_character: true, workflow_type: "CHARACTER_SHEET", image_count: 2 },
      });
    });
    expect(store.getState().characters).toHaveLength(2);

    // Switch to Video Frames mode
    act(() => store.getState().switchMode("video", "frames"));
    expect(store.getState().activeMode).toBe("video");
    // Stale characters from image mode should be cleared on mode change!
    expect(store.getState().characters).toHaveLength(0);

    // Now type '@' in Video Frames mode and click Add to prompt
    const editable = document.querySelector('[contenteditable="true"]');
    editable.focus();
    fireEvent.keyDown(editable, { key: "@", code: "Digit2", shiftKey: true });

    const addBtn = await screen.findByRole("button", { name: "Add to prompt" });
    expect(addBtn.disabled).toBe(false);
    realClick(addBtn);

    await waitFor(() => {
      expect(store.getState().parameterValues.input_image).toBeTruthy();
    });
  });

  it("S6: BUG 4 — Video mode with activeSubMode=null/undefined -> Start slot renders -> Add to prompt attaches start frame", async () => {
    render(<GeneratedPromptBar projectId="proj-real" models={realModelsAll} onGenerate={vi.fn()} />);
    const store = getActivePromptBarStore();
    await waitFor(() => expect(Object.keys(store.getState().modelsMap).length).toBeGreaterThan(5));

    act(() => {
      store.setState({
        activeMode: "video",
        activeSubMode: null,
        selectedModelId: "ltx_2_3_fast",
        parameterValues: {},
      });
    });

    const startText = await screen.findByText("Start");
    realClick(startText.closest("[data-pill-focus]") || startText);

    const addBtn = await screen.findByRole("button", { name: "Add to prompt" });
    expect(addBtn.disabled).toBe(false);
    realClick(addBtn);

    expect(store.getState().parameterValues.input_image).toBeTruthy();
  });

  it("S7: BUG 5 — Standalone loose upload with stale image_count=5 in Video Frames or low-quota Image mode", async () => {
    render(<GeneratedPromptBar projectId="proj-real" models={realModelsAll} onGenerate={vi.fn()} />);
    const store = getActivePromptBarStore();
    await waitFor(() => expect(Object.keys(store.getState().modelsMap).length).toBeGreaterThan(5));

    act(() => store.getState().switchMode("video", "frames"));

    // Type '@' -> remainingImagesQuota is 4; looseStandaloneMedia has image_count: 5!
    const editable = document.querySelector('[contenteditable="true"]');
    editable.focus();
    fireEvent.keyDown(editable, { key: "@", code: "Digit2", shiftKey: true });

    const looseOption = await screen.findByRole("option", { name: /Loose Upload/i });
    realClick(looseOption);

    const addBtn = await screen.findByRole("button", { name: "Add to prompt" });
    expect(addBtn.disabled).toBe(false);
    realClick(addBtn);

    await waitFor(() => {
      expect(store.getState().parameterValues.input_image?.id).toBe("m-loose-1");
    });
  });

  it("S8: Canonical pb2 hydration in Video Frames mode -> async models -> Start -> Add to prompt", async () => {
    const key = "pb2:generated-media:default:proj-real";
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        v: 2,
        prompt: "",
        selectedModelId: "ltx_2_3_fast",
        parameterValues: { duration: "8", aspect_ratio: "16:9", resolution: "720p" },
        elements: [],
        characters: [],
        activeMode: "video",
        activeSubMode: "frames",
      })
    );

    function AsyncHost() {
      const [models, setModels] = useState([]);
      React.useEffect(() => {
        const t = setTimeout(() => setModels(realModelsAll), 10);
        return () => clearTimeout(t);
      }, []);
      return <GeneratedPromptBar projectId="proj-real" models={models} onGenerate={vi.fn()} />;
    }

    render(<AsyncHost />);
    const store = getActivePromptBarStore();

    await waitFor(() => {
      expect(store.getState().selectedModelId).toBe("ltx_2_3_fast");
      expect(Object.keys(store.getState().modelsMap).length).toBeGreaterThan(5);
    });

    const startText = await screen.findByText("Start");
    realClick(startText.closest("[data-pill-focus]") || startText);

    const addBtn = await screen.findByRole("button", { name: "Add to prompt" });
    expect(addBtn.disabled).toBe(false);
    realClick(addBtn);

    expect(store.getState().parameterValues.input_image).toBeTruthy();
  });

  it("S9A: Card 'Ajouter au prompt' (useWorkflowActions) on Image mode attaches generated image & character sheet properly", async () => {
    render(<GeneratedPromptBar projectId="proj-real" models={realModelsAll} onGenerate={vi.fn()} />);
    const store = getActivePromptBarStore();
    await waitFor(() => expect(store.getState().selectedModelId).toBeTruthy());

    // 1. Generated image card
    const { result: genHook } = renderHook(() => useWorkflowActions(genWorkflow1, null, { projectId: "proj-real" }));
    act(() => genHook.current.handleAddToPrompt());
    expect(store.getState().parameterValues.images).toHaveLength(1);

    // 2. Character sheet card -> MUST preserve character type/metadata & add to store.characters
    const { result: charHook } = renderHook(() => useWorkflowActions(charWorkflow1, null, { projectId: "proj-real" }));
    act(() => charHook.current.handleAddToPrompt());
    expect(store.getState().parameterValues.images).toHaveLength(2);
    expect(store.getState().characters).toHaveLength(1);
    expect(store.getState().characters[0].workflow_id).toBe("wf-char-1");
  });

  it("S9B: Card 'Ajouter au prompt' on /characters (unmounted) -> navigates to /assets -> async models load -> pending action MUST attach to images!", async () => {
    mockPathname = "/cinema-studio/proj-real/characters";

    const { result: charHook } = renderHook(() => useWorkflowActions(genWorkflow1, null, { projectId: "proj-real" }));
    act(() => charHook.current.handleAddToPrompt());
    expect(mockPush).toHaveBeenCalledWith("/cinema-studio/proj-real/assets");

    // Now navigate to /assets where GeneratedPromptBar mounts with models=[] then async models load
    mockPathname = "/cinema-studio/proj-real/assets";
    function AsyncHost() {
      const [models, setModels] = useState([]);
      React.useEffect(() => {
        const t = setTimeout(() => setModels(realModelsAll), 20);
        return () => clearTimeout(t);
      }, []);
      return <GeneratedPromptBar projectId="proj-real" models={models} onGenerate={vi.fn()} />;
    }

    render(<AsyncHost />);
    const store = getActivePromptBarStore();

    await waitFor(() => {
      expect(Object.keys(store.getState().modelsMap).length).toBeGreaterThan(5);
    });

    await waitFor(() => {
      expect(store.getState().parameterValues.images).toHaveLength(1);
    });
    expect(store.getState().parameterValues.images[0].workflow_id).toBe("wf-gen-1");
  });

  it("S9C: Card 'Ajouter au prompt' while PromptBar is in Video/Frames mode — what happens?", async () => {
    render(<GeneratedPromptBar projectId="proj-real" models={realModelsAll} onGenerate={vi.fn()} />);
    const store = getActivePromptBarStore();
    await waitFor(() => expect(Object.keys(store.getState().modelsMap).length).toBeGreaterThan(5));
    act(() => store.getState().switchMode("video", "frames"));

    const { result: genHook } = renderHook(() => useWorkflowActions(genWorkflow1, null, { projectId: "proj-real" }));
    act(() => genHook.current.handleAddToPrompt());

    // Either attaches to start/end or adds reference — check whether ANYTHING was attached!
    const vals = store.getState().parameterValues;
    const attached = Boolean(vals.input_image || vals.last_frame || (Array.isArray(vals.images) && vals.images.length > 0));
    expect(attached).toBe(true);
  });

  it("S9D: Image mode with prompt-only model (seedream_v5) -> Card 'Ajouter au prompt' MUST NOT silently write to dead 'reference' key", async () => {
    render(<GeneratedPromptBar projectId="proj-real" models={realModelsAll} onGenerate={vi.fn()} />);
    const store = getActivePromptBarStore();
    await waitFor(() => expect(Object.keys(store.getState().modelsMap).length).toBeGreaterThan(5));
    act(() => store.getState().selectModel("seedream_v5"));
    expect(store.getState().selectedModelId).toBe("seedream_v5");

    const res = promptBarService({ templateId: "generated-media", projectId: "proj-real" }).addReference(realMediaImg1);
    // Should either fail cleanly or switch/attach to a real parameter — NOT succeed with dead parameterValues.reference!
    if (res.ok) {
      expect(store.getState().parameterValues.reference).toBeUndefined();
      expect(store.getState().parameterValues.images?.length).toBeGreaterThan(0);
    } else {
      expect(store.getState().parameterValues.reference).toBeUndefined();
    }
  });
});
