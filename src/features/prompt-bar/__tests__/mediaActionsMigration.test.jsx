import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock next/navigation
const mockPush = vi.fn();
let mockCurrentPath = "/cinema-studio/proj_abc/assets";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockCurrentPath,
}));

// Mock API hooks used by useWorkflowActions
vi.mock("@/features/workflows/api/workflowsApi", () => ({
  useToggleWorkflowLike: () => ({ mutate: vi.fn() }),
  useRemoveWorkflow: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/features/media/api/mediaApi", () => ({
  useRemoveAsset: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/features/prompt-bar/core/useRealBackendModels", () => ({
  useRealBackendModels: () => ({ data: { models: [] } }),
}));

// Mock promptBarService
const mockAnimateMedia = vi.fn();
const mockAddReference = vi.fn();
const mockApplyGeneration = vi.fn();
const mockReuseGeneration = vi.fn();
const mockFocus = vi.fn();
const mockResolveReusableGeneration = vi.fn();
const mockHasGeneratedPrimaryMedia = vi.fn();
const mockWithPrimaryMediaFallback = vi.fn((workflow) => workflow);
const mockPromptBarService = vi.fn(() => ({
  animateMedia: mockAnimateMedia,
  addReference: mockAddReference,
  applyGeneration: mockApplyGeneration,
  reuseGeneration: mockReuseGeneration,
  focus: mockFocus,
}));

vi.mock("@/features/prompt-bar/api/promptBarService", () => ({
  promptBarService: (...args) => mockPromptBarService(...args),
  resolveReusableGeneration: (...args) => mockResolveReusableGeneration(...args),
  hasGeneratedPrimaryMedia: (...args) => mockHasGeneratedPrimaryMedia(...args),
  withPrimaryMediaFallback: (...args) => mockWithPrimaryMediaFallback(...args),
}));

// Mock getActivePromptBarStore to verify it is NOT called
const mockGetActivePromptBarStore = vi.fn();
vi.mock("@/features/studio", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getActivePromptBarStore: () => mockGetActivePromptBarStore(),
  };
});

// Import the hook to test and the legacy store
import { useWorkflowActions } from "@/features/workflows/model/useMediaActions";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";

describe("X4: Migration of useMediaActions to promptBarService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentPath = "/cinema-studio/proj_abc/assets";
    mockAnimateMedia.mockReturnValue({ ok: true });
    mockAddReference.mockReturnValue({ ok: true });
    mockApplyGeneration.mockReturnValue({ ok: true });
    mockReuseGeneration.mockReturnValue({ ok: true });
    mockFocus.mockReturnValue({ ok: true });
    mockResolveReusableGeneration.mockReturnValue({ modelId: "test-model-id" });
    mockHasGeneratedPrimaryMedia.mockReturnValue(true);
  });

  const mockWorkflow = {
    id: "wf_123",
    projectId: "proj_abc",
    prompt: "A beautiful cinematic shot",
    items: [
      {
        id: "item_123",
        url: "https://example.com/item.png",
        mediaMetadata: { status: "completed" },
        params: {
          prompt: "A beautiful cinematic shot",
          model_name: "test-model-id",
          aspect_ratio: "16:9",
          quality: "4K",
          duration: "5s",
          num_images: 1,
        },
        generationConfig: {
          model: "test-model-id",
          prompt: "A beautiful cinematic shot",
          aspect_ratio: "16:9",
        },
      },
    ],
  };

  it("handleReuseSettings delegates to promptBarService without legacy store writes or querySelector", () => {
    const querySelectorSpy = vi.spyOn(document, "querySelector");
    const legacyPromptState = usePromptStore.getState();

    const { result } = renderHook(() => useWorkflowActions(mockWorkflow));

    act(() => {
      result.current.handleReuseSettings();
    });

    // 1. Must call promptBarService with the correct project identity
    expect(mockPromptBarService).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: "generated-media",
        projectId: "proj_abc",
      }),
      expect.objectContaining({ resolveWorkflow: expect.any(Function) })
    );

    // 2. The card gives the service only its workflow ID; the resolver owns config lookup.
    expect(mockReuseGeneration).toHaveBeenCalledWith("wf_123");
    expect(mockApplyGeneration).not.toHaveBeenCalled();

    // 3. Must request focus through the service
    expect(mockFocus).toHaveBeenCalledTimes(1);

    // 4. Must NOT call getActivePromptBarStore
    expect(mockGetActivePromptBarStore).not.toHaveBeenCalled();

    // 5. Duplicated fields must NOT exist on legacy store
    expect(legacyPromptState.setPrompt).toBeUndefined();
    expect(legacyPromptState.setModelId).toBeUndefined();

    // 6. Must NOT query the DOM for editor focus
    expect(querySelectorSpy).not.toHaveBeenCalled();

    querySelectorSpy.mockRestore();
  });

  it("handleAnimate delegates to promptBarService.animateMedia and focus", () => {
    const querySelectorSpy = vi.spyOn(document, "querySelector");
    const legacyPromptState = usePromptStore.getState();

    const { result } = renderHook(() => useWorkflowActions(mockWorkflow));

    act(() => {
      result.current.handleAnimate();
    });

    expect(mockPromptBarService).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: "generated-media",
        projectId: "proj_abc",
      })
    );
    expect(mockAnimateMedia).toHaveBeenCalledTimes(1);
    expect(mockFocus).toHaveBeenCalledTimes(1);

    expect(mockGetActivePromptBarStore).not.toHaveBeenCalled();
    expect(legacyPromptState.addReference).toBeUndefined();
    expect(querySelectorSpy).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();

    querySelectorSpy.mockRestore();
  });

  it("handleAnimate navigates to assets page when unmounted (queued) and outside assets", () => {
    mockCurrentPath = "/cinema-studio/proj_abc/characters";
    mockAnimateMedia.mockReturnValue({ ok: false, reason: "NOT_MOUNTED", queued: true });

    const { result } = renderHook(() => useWorkflowActions(mockWorkflow));

    act(() => {
      result.current.handleAnimate();
    });

    expect(mockPromptBarService).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: "generated-media",
        projectId: "proj_abc",
      })
    );
    expect(mockAnimateMedia).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/cinema-studio/proj_abc/assets");
  });

  it("handleAddToPrompt delegates to promptBarService.addReference", () => {
    const legacyPromptState = usePromptStore.getState();

    const { result } = renderHook(() => useWorkflowActions(mockWorkflow));

    act(() => {
      result.current.handleAddToPrompt();
    });

    expect(mockPromptBarService).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: "generated-media",
        projectId: "proj_abc",
      })
    );
    expect(mockAddReference).toHaveBeenCalledTimes(1);
    expect(legacyPromptState.addReference).toBeUndefined();
  });
});
