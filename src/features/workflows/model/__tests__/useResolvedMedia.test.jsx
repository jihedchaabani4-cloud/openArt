import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useResolvedMedia } from "../useResolvedMedia";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";

vi.mock("@/features/workflows/api/queries/useProjectData", () => ({
  useProjectData: vi.fn(),
}));

describe("useResolvedMedia - Pure Cache Selector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("returns state: 'loading' while project query is in-flight", () => {
    useProjectData.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    const { result } = renderHook(() =>
      useResolvedMedia({ mediaId: "m-1", projectId: "proj-1" })
    );

    expect(result.current).toEqual({
      item: null,
      state: "loading",
    });
  });

  it("resolves media by mediaId directly from projectContents", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [{ id: "wf-1" }],
          media: [
            {
              id: "m-1",
              workflow_id: "wf-1",
              url: "https://example.com/m1.png",
              status: "success",
            },
          ],
        },
      },
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() =>
      useResolvedMedia({ mediaId: "m-1", projectId: "proj-1" })
    );

    expect(result.current.state).toBe("ready");
    expect(result.current.item).toMatchObject({
      id: "m-1",
      workflowId: "wf-1",
      url: "https://example.com/m1.png",
      status: "ready",
    });
  });

  it("resolves workflow-scoped placement when duplicate media items exist across workflows", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [{ id: "wf-home" }, { id: "wf-char" }],
          media: [
            {
              id: "shared-asset",
              workflow_id: "wf-home",
              role: "output",
              url: "https://example.com/shared.png",
              status: "success",
            },
            {
              id: "shared-asset",
              workflow_id: "wf-char",
              role: "detail",
              url: "https://example.com/shared.png",
              status: "success",
            },
          ],
        },
      },
      isLoading: false,
      isError: false,
    });

    // Lookup with explicit workflowId scoping
    const { result: charResult } = renderHook(() =>
      useResolvedMedia({ mediaId: "shared-asset", workflowId: "wf-char", projectId: "proj-1" })
    );
    expect(charResult.current.item.workflowId).toBe("wf-char");
    expect(charResult.current.item.role).toBe("detail");

    // Standalone lookup without workflowId -> primary home workflow wins
    const { result: standaloneResult } = renderHook(() =>
      useResolvedMedia({ mediaId: "shared-asset", projectId: "proj-1" })
    );
    expect(standaloneResult.current.item.workflowId).toBe("wf-home");
    expect(standaloneResult.current.item.role).toBe("output");
  });

  it("returns state: 'notFound' when mediaId does not exist after query settled", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [],
          media: [],
        },
      },
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() =>
      useResolvedMedia({ mediaId: "non-existent", projectId: "proj-1" })
    );

    expect(result.current).toEqual({
      item: null,
      state: "notFound",
    });
  });

  it("returns state: 'empty' for workflows with zero media items", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [{ id: "empty-wf", items: [] }],
          media: [],
        },
      },
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() =>
      useResolvedMedia({ workflowId: "empty-wf", projectId: "proj-1" })
    );

    expect(result.current).toEqual({
      item: null,
      state: "empty",
    });
  });

  it("resolves character workflow main media with sheet priority over detail", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [{ id: "char-wf", workflow_type: "CHARACTER" }],
          media: [
            { id: "detail-1", workflow_id: "char-wf", role: "detail", url: "https://example.com/d.png", status: "success" },
            { id: "sheet-1", workflow_id: "char-wf", role: "sheet", url: "https://example.com/s.png", status: "success" },
          ],
        },
      },
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() =>
      useResolvedMedia({ workflowId: "char-wf", projectId: "proj-1" })
    );

    expect(result.current.state).toBe("ready");
    expect(result.current.item.id).toBe("sheet-1");
  });

  it("resolves element cover when workflow.primary_media_id is set", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [{ id: "elem-wf", workflow_type: "ELEMENT", primary_media_id: "elem-cover" }],
          media: [
            { id: "elem-1", workflow_id: "elem-wf", url: "https://example.com/e1.png", status: "success" },
            { id: "elem-cover", workflow_id: "elem-wf", url: "https://example.com/cover.png", status: "success" },
          ],
        },
      },
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() =>
      useResolvedMedia({ workflowId: "elem-wf", projectId: "proj-1" })
    );

    expect(result.current.state).toBe("ready");
    expect(result.current.item.id).toBe("elem-cover");
  });

  it("resolves generation completed item over processing item when no pin is set", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [{ id: "gen-wf", workflow_type: "GENERATION" }],
          media: [
            { id: "gen-proc", workflow_id: "gen-wf", url: "https://example.com/p.png", status: "processing" },
            { id: "gen-ready", workflow_id: "gen-wf", url: "https://example.com/r.png", status: "success" },
          ],
        },
      },
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() =>
      useResolvedMedia({ workflowId: "gen-wf", projectId: "proj-1" })
    );

    expect(result.current.state).toBe("ready");
    expect(result.current.item.id).toBe("gen-ready");
  });
});
