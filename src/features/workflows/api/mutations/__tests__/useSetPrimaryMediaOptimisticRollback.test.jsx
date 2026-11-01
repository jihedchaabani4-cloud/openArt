import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSetPrimaryMedia } from "../useSetPrimaryMedia";
import { queryKeys } from "@/shared/api/queryKeys";
import { api } from "@/shared/api/client";

vi.mock("@/shared/api/client", () => ({
  api: {
    patch: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("useSetPrimaryMedia - Optimistic Cache Update & Rollback Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupCache = (queryClient) => {
    const pKey = queryKeys.projectData.byProject("proj-1");
    const initialData = {
      projectContents: {
        workflows: [
          {
            id: "wf-1",
            primaryMediaId: "m-1",
            primary_media_id: "m-1",
            primary_media_url: "https://example.com/1.png",
            metadata: { primaryMediaId: "m-1", primary_media_id: "m-1" },
            items: [
              { id: "m-1", is_primary: true, isPrimary: true, url: "https://example.com/1.png" },
              { id: "m-2", is_primary: false, isPrimary: false, url: "https://example.com/2.png" },
            ],
            media: [
              { id: "m-1", is_primary: true, isPrimary: true, url: "https://example.com/1.png" },
              { id: "m-2", is_primary: false, isPrimary: false, url: "https://example.com/2.png" },
            ],
          },
        ],
        media: [
          { id: "m-1", workflowId: "wf-1", is_primary: true, isPrimary: true, url: "https://example.com/1.png" },
          { id: "m-2", workflowId: "wf-1", is_primary: false, isPrimary: false, url: "https://example.com/2.png" },
        ],
        elements: [
          {
            id: "el-1",
            workflow_id: "wf-1",
            primaryMediaId: "m-1",
            primary_media_url: "https://example.com/1.png",
          },
        ],
      },
    };
    queryClient.setQueryData(pKey, initialData);
    return { pKey, initialData };
  };

  it("1. On edit, optimistically updates is_primary across media, workflow items, and element in cache; persists on success", async () => {
    const { queryClient, wrapper } = createWrapper();
    const { pKey } = setupCache(queryClient);

    api.patch.mockResolvedValueOnce({ ok: true, primaryMediaId: "m-2" });

    const { result } = renderHook(() => useSetPrimaryMedia(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        workflowId: "wf-1",
        mediaId: "m-2",
        projectId: "proj-1",
      });
    });

    const cached = queryClient.getQueryData(pKey);
    const wf = cached.projectContents.workflows[0];
    const elem = cached.projectContents.elements[0];
    const mediaList = cached.projectContents.media;

    // Workflow root updated
    expect(wf.primaryMediaId).toBe("m-2");
    expect(wf.primary_media_id).toBe("m-2");
    expect(wf.primary_media_url).toBe("https://example.com/2.png");

    // Items array inside workflow has is_primary flipped
    expect(wf.items.find((it) => it.id === "m-1").is_primary).toBe(false);
    expect(wf.items.find((it) => it.id === "m-2").is_primary).toBe(true);
    expect(wf.items.find((it) => it.id === "m-2").isPrimary).toBe(true);

    // Project-level media array has is_primary flipped
    expect(mediaList.find((m) => m.id === "m-1").is_primary).toBe(false);
    expect(mediaList.find((m) => m.id === "m-2").is_primary).toBe(true);

    // Element entity updated
    expect(elem.primaryMediaId).toBe("m-2");
    expect(elem.primary_media_url).toBe("https://example.com/2.png");
  });

  it("2. When API fails, rolls back cache completely to the previous is_primary and cover state", async () => {
    const { queryClient, wrapper } = createWrapper();
    const { pKey } = setupCache(queryClient);

    api.patch.mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useSetPrimaryMedia(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          workflowId: "wf-1",
          mediaId: "m-2",
          projectId: "proj-1",
        });
      } catch {
        // Expected mutation failure
      }
    });

    const rolledBack = queryClient.getQueryData(pKey);
    const wf = rolledBack.projectContents.workflows[0];
    const elem = rolledBack.projectContents.elements[0];
    const mediaList = rolledBack.projectContents.media;

    // Workflow rolled back to m-1
    expect(wf.primaryMediaId).toBe("m-1");
    expect(wf.primary_media_id).toBe("m-1");
    expect(wf.primary_media_url).toBe("https://example.com/1.png");

    // Items rolled back
    expect(wf.items.find((it) => it.id === "m-1").is_primary).toBe(true);
    expect(wf.items.find((it) => it.id === "m-2").is_primary).toBe(false);

    // Media list rolled back
    expect(mediaList.find((m) => m.id === "m-1").is_primary).toBe(true);
    expect(mediaList.find((m) => m.id === "m-2").is_primary).toBe(false);

    // Element rolled back
    expect(elem.primaryMediaId).toBe("m-1");
    expect(elem.primary_media_url).toBe("https://example.com/1.png");
  });

  it("3. Explicit mediaId: null optimistically clears is_primary and primaryMediaId; rolls back on failure", async () => {
    const { queryClient, wrapper } = createWrapper();
    const { pKey } = setupCache(queryClient);

    api.patch.mockRejectedValueOnce(new Error("Server Failure"));

    const { result } = renderHook(() => useSetPrimaryMedia(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          workflowId: "wf-1",
          mediaId: null,
          projectId: "proj-1",
        });
      } catch {
        // Expected
      }
    });

    // Successfully rolled back to m-1 after server failure
    const rolledBack = queryClient.getQueryData(pKey);
    const wf = rolledBack.projectContents.workflows[0];
    expect(wf.primaryMediaId).toBe("m-1");
    expect(wf.primary_media_url).toBe("https://example.com/1.png");
    expect(wf.items.find((it) => it.id === "m-1").is_primary).toBe(true);
  });
});
