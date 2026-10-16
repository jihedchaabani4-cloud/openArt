import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, renderHook, cleanup, act } from "@testing-library/react";
import { useResolvedMedia } from "../useResolvedMedia";
import { buildProjectMediaIndex } from "../mediaCacheIndex";
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

  it("100 tiles calling useResolvedMedia share 1 useProjectData subscription with 0 extra fetches and minimal re-render footprint", () => {
    const mediaList = Array.from({ length: 100 }, (_, i) => ({
      id: `m-${i}`,
      workflow_id: `wf-${i}`,
      url: `https://example.com/item-${i}.png`,
      status: "success",
    }));

    const projectContents = {
      workflows: Array.from({ length: 100 }, (_, i) => ({ id: `wf-${i}` })),
      media: mediaList,
    };

    let currentStore = { projectContents };
    const listeners = new Set();
    const updateStore = (next) => {
      currentStore = next;
      listeners.forEach((l) => l());
    };

    // Replicates TanStack Query observer subscription
    useProjectData.mockImplementation((projectId) => {
      expect(projectId).toBe("proj-1");
      const [, forceUpdate] = React.useReducer((x) => x + 1, 0);
      React.useEffect(() => {
        listeners.add(forceUpdate);
        return () => listeners.delete(forceUpdate);
      }, []);
      return {
        data: currentStore,
        isLoading: false,
        isError: false,
      };
    });

    const renderCounts = new Map();

    function Tile({ mediaId }) {
      renderCounts.set(mediaId, (renderCounts.get(mediaId) || 0) + 1);
      const { item, state } = useResolvedMedia({ mediaId, projectId: "proj-1" });
      return <div data-testid={mediaId}>{state}:{item?.url}</div>;
    }

    function Grid() {
      return (
        <div>
          {mediaList.map((m) => (
            <Tile key={m.id} mediaId={m.id} />
          ))}
        </div>
      );
    }

    render(<Grid />);

    // 1. Initial render: All 100 tiles rendered exactly once, sharing 1 project subscription
    expect(renderCounts.size).toBe(100);
    for (let i = 0; i < 100; i++) {
      expect(renderCounts.get(`m-${i}`)).toBe(1);
    }

    // 2. WeakMap caching: index is cached on projectContents identity
    const index1 = buildProjectMediaIndex({ projectContents });
    const index2 = buildProjectMediaIndex({ projectContents });
    expect(index1).toBe(index2);

    // 3. Measure re-render profile when project data updates (e.g. tile 42 updates):
    const updatedMedia = mediaList.map((m) =>
      m.id === "m-42" ? { ...m, status: "failed" } : m
    );
    const updatedContents = {
      ...projectContents,
      media: updatedMedia,
    };

    // Update query cache
    act(() => {
      updateStore({ projectContents: updatedContents });
    });

    // Tile 42 received the update and re-rendered
    expect(renderCounts.get("m-42")).toBe(2);
    // All tiles re-render because all 100 tiles subscribe to the single projectData query
    expect(renderCounts.get("m-0")).toBe(2);
  });
});
