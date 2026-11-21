import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockPush = vi.fn();
let mockPathname = "/cinema-studio/proj-1/assets";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));

vi.mock("@/features/workflows/api/workflowsApi", () => ({
  useToggleWorkflowLike: () => ({ mutate: vi.fn() }),
  useRemoveWorkflow: () => ({ mutate: vi.fn() }),
}));

const mockAnimateMedia = vi.fn();
const mockAddReference = vi.fn();
const mockAttachMedia = vi.fn();
const mockReuseGeneration = vi.fn();
const mockFocus = vi.fn();
let mockPromptBarSnapshot = {
  prompt: "",
  selectedModelId: null,
  activeMode: "image",
  activeSubMode: "frames",
  isGenerating: false,
};
const mockPromptBarService = vi.fn(() => ({
  animateMedia: mockAnimateMedia,
  addReference: mockAddReference,
  attachMedia: mockAttachMedia,
  reuseGeneration: mockReuseGeneration,
  focus: mockFocus,
}));

vi.mock("@/features/prompt-bar", () => ({
  promptBarService: (...args) => mockPromptBarService(...args),
  usePromptBarSnapshot: (_identity, selector) =>
    typeof selector === "function" ? selector(mockPromptBarSnapshot) : mockPromptBarSnapshot,
  useRealBackendModels: () => ({ data: { models: [] } }),
  resolveReusableGeneration: () => null,
  hasGeneratedPrimaryMedia: () => true,
  withPrimaryMediaFallback: (wf) => wf,
}));

vi.mock("@/features/studio", () => ({
  canAnyModelAcceptEntity: () => true,
}));

import { useWorkflowActions } from "@/features/workflows/model/useMediaActions";

const BASE_WORKFLOW = {
  id: "wf-1",
  projectId: "proj-1",
  workflow_type: "CHARACTER_SHEET",
  display_name: "Elena",
  items: [
    {
      id: "item-1",
      url: "https://example.com/elena.png",
      mediaMetadata: { status: "completed" },
    },
  ],
};

describe("useWorkflowActions — Public Service & Route Fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/cinema-studio/proj-1/assets";
    mockPromptBarSnapshot = {
      prompt: "",
      selectedModelId: null,
      activeMode: "image",
      activeSubMode: "frames",
      isGenerating: false,
    };
    mockAnimateMedia.mockReturnValue({ ok: true });
    mockAddReference.mockReturnValue({ ok: true });
    mockAttachMedia.mockReturnValue({ ok: true });
    mockReuseGeneration.mockReturnValue({ ok: true });
    mockFocus.mockReturnValue({ ok: true });
  });

  it("does NOT navigate away from /collection when handleAddToPrompt returns NOT_MOUNTED", () => {
    mockPathname = "/cinema-studio/proj-1/collection/col-9";
    mockAddReference.mockReturnValue({ ok: false, reason: "NOT_MOUNTED", queued: true });

    const { result } = renderHook(() => useWorkflowActions(BASE_WORKFLOW));
    act(() => {
      result.current.handleAddToPrompt();
    });

    expect(mockAddReference).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to /assets when handleAddToPrompt returns NOT_MOUNTED outside prompt-bar routes", () => {
    mockPathname = "/cinema-studio/proj-1/characters";
    mockAddReference.mockReturnValue({ ok: false, reason: "NOT_MOUNTED", queued: true });

    const { result } = renderHook(() => useWorkflowActions(BASE_WORKFLOW));
    act(() => {
      result.current.handleAddToPrompt();
    });

    expect(mockPush).toHaveBeenCalledWith("/cinema-studio/proj-1/assets");
  });

  it("preserves workflow_type and displayName when adding a character/element sheet item", () => {
    const { result } = renderHook(() => useWorkflowActions(BASE_WORKFLOW));
    act(() => {
      result.current.handleAddToPrompt();
    });

    expect(mockAddReference).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "item-1",
        workflow_type: "CHARACTER_SHEET",
        workflow_id: "wf-1",
        displayName: "Elena",
      })
    );
  });

  it("calls service.focus() in handleAnimate ONLY when animateMedia succeeds", () => {
    mockAnimateMedia.mockReturnValue({ ok: false, reason: "NO_ELIGIBLE_MODEL" });

    const { result } = renderHook(() => useWorkflowActions(BASE_WORKFLOW));
    act(() => {
      result.current.handleAnimate();
    });

    expect(mockAnimateMedia).toHaveBeenCalledTimes(1);
    expect(mockFocus).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("exposes reactive isFrameMode only for video/frames mode", () => {
    mockPromptBarSnapshot = { activeMode: "image", activeSubMode: "frames" };
    const { result, rerender } = renderHook(() => useWorkflowActions(BASE_WORKFLOW));
    expect(result.current.isFrameMode).toBe(false);

    mockPromptBarSnapshot = { activeMode: "video", activeSubMode: "reference" };
    rerender();
    expect(result.current.isFrameMode).toBe(false);

    mockPromptBarSnapshot = { activeMode: "video", activeSubMode: "frames" };
    rerender();
    expect(result.current.isFrameMode).toBe(true);
  });

  it("handleAddStartFrame attaches media to role 'start' and focuses on success", () => {
    const imageWorkflow = {
      id: "wf-img-1",
      projectId: "proj-1",
      workflow_type: "IMAGE_GENERATION",
      display_name: "Neon Street",
      items: [
        {
          id: "img-item-1",
          url: "https://example.com/neon.png",
          mediaMetadata: { status: "completed" },
        },
      ],
    };

    const { result } = renderHook(() => useWorkflowActions(imageWorkflow));
    act(() => {
      result.current.handleAddStartFrame();
    });

    expect(mockPromptBarService).toHaveBeenCalledWith({
      templateId: "generated-media",
      projectId: "proj-1",
    });
    expect(mockAttachMedia).toHaveBeenCalledWith({
      role: "start",
      value: expect.objectContaining({
        id: "img-item-1",
        workflow_id: "wf-img-1",
        workflow_type: "IMAGE_GENERATION",
        url: "https://example.com/neon.png",
        preview: "https://example.com/neon.png",
        displayName: "Neon Street",
      }),
    });
    expect(mockFocus).toHaveBeenCalledTimes(1);
  });

  it("handleAddEndFrame attaches media to role 'end', focuses on success, and respects NOT_MOUNTED fallback", () => {
    const imageWorkflow = {
      id: "wf-img-2",
      projectId: "proj-1",
      workflow_type: "UPLOAD",
      items: [
        {
          id: "img-item-2",
          url: "https://example.com/end.png",
          mediaMetadata: { status: "completed" },
        },
      ],
    };

    const { result } = renderHook(() => useWorkflowActions(imageWorkflow));
    act(() => {
      result.current.handleAddEndFrame();
    });

    expect(mockAttachMedia).toHaveBeenCalledWith({
      role: "end",
      value: expect.objectContaining({
        id: "img-item-2",
        workflow_id: "wf-img-2",
        workflow_type: "UPLOAD",
        url: "https://example.com/end.png",
        preview: "https://example.com/end.png",
      }),
    });
    expect(mockFocus).toHaveBeenCalledTimes(1);

    // NOT_MOUNTED on non-prompt-bar route navigates without focusing
    vi.clearAllMocks();
    mockPathname = "/cinema-studio/proj-1/characters";
    mockAttachMedia.mockReturnValue({ ok: false, reason: "NOT_MOUNTED", queued: true });

    const { result: unmountedResult } = renderHook(() => useWorkflowActions(imageWorkflow));
    act(() => {
      unmountedResult.current.handleAddEndFrame();
    });

    expect(mockPush).toHaveBeenCalledWith("/cinema-studio/proj-1/assets");
    expect(mockFocus).not.toHaveBeenCalled();
  });

  it("blocks handleAddStartFrame and handleAddEndFrame for video items", () => {
    const videoWorkflow = {
      id: "wf-vid-1",
      projectId: "proj-1",
      workflow_type: "VIDEO_GENERATION",
      items: [
        {
          id: "vid-item-1",
          url: "https://example.com/clip.mp4",
          asset_type: "video",
          video: { generatedVideo: { url: "https://example.com/clip.mp4" } },
          mediaMetadata: { status: "completed" },
        },
      ],
    };

    const { result } = renderHook(() => useWorkflowActions(videoWorkflow));
    expect(result.current.isVideo).toBe(true);
    act(() => {
      result.current.handleAddStartFrame();
      result.current.handleAddEndFrame();
    });

    expect(mockAttachMedia).not.toHaveBeenCalled();
    expect(mockFocus).not.toHaveBeenCalled();
  });
});
