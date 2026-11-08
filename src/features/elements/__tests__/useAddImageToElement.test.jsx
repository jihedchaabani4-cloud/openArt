import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { useAddImageToElement } from "../api/mutations/useAddImageToElement";

vi.mock("@/shared/api/client", () => ({
  api: {
    post: vi.fn(),
  },
}));

function createWrapper(initialProjectData = null) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  if (initialProjectData) {
    queryClient.setQueryData(
      queryKeys.projectData.byProject("proj-1"),
      initialProjectData
    );
  }

  return {
    queryClient,
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe("useAddImageToElement", () => {
  let createObjectURLMock;
  let revokeObjectURLMock;

  beforeEach(() => {
    vi.clearAllMocks();
    createObjectURLMock = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:http://localhost/elem-preview");
    revokeObjectURLMock = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    createObjectURLMock.mockRestore();
    revokeObjectURLMock.mockRestore();
  });

  it("uploads local image file via FormData directly to /v2/elements/:id/images", async () => {
    api.post.mockResolvedValueOnce({
      ok: true,
      media: { id: "media-new-1", url: "https://cdn.example.com/elem1.png" },
    });

    const { wrapper } = createWrapper({
      projectContents: { media: [] },
    });

    const { result } = renderHook(() => useAddImageToElement(), { wrapper });
    const dummyFile = new File(["dummy content"], "ref.png", { type: "image/png" });

    await act(async () => {
      await result.current.mutateAsync({
        elementId: "elem-123",
        file: dummyFile,
        projectId: "proj-1",
      });
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    const [endpoint, body] = api.post.mock.calls[0];
    expect(endpoint).toBe("/v2/elements/elem-123/images");
    expect(body instanceof FormData).toBe(true);
    expect(body.get("file")).toBe(dummyFile);
    expect(body.get("projectId")).toBe("proj-1");

    expect(createObjectURLMock).toHaveBeenCalledWith(dummyFile);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/elem-preview");
  });

  it("attaches existing Project Cache asset via mediaId with JSON payload (zero re-upload)", async () => {
    api.post.mockResolvedValueOnce({
      ok: true,
      media: { id: "media-cached-99", url: "https://cdn.example.com/cached.png" },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAddImageToElement(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        elementId: "elem-123",
        mediaId: "media-cached-99",
        imageUrl: "https://cdn.example.com/cached.png",
        projectId: "proj-1",
      });
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    const [endpoint, body] = api.post.mock.calls[0];
    expect(endpoint).toBe("/v2/elements/elem-123/images");
    expect(body).toEqual({
      imageUrl: "https://cdn.example.com/cached.png",
      mediaId: "media-cached-99",
      workflowId: "media-cached-99",
      projectId: "proj-1",
    });
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it("enforces optimistic reference limit and stops adding if existingCount >= 6", async () => {
    api.post.mockResolvedValueOnce({ ok: true, media: { id: "media-7" } });

    const existing6Media = Array.from({ length: 6 }, (_, i) => ({
      id: `m-${i}`,
      workflowId: "elem-123",
    }));

    const { wrapper, queryClient } = createWrapper({
      projectContents: { media: existing6Media },
    });

    const { result } = renderHook(() => useAddImageToElement(), { wrapper });
    const dummyFile = new File(["dummy"], "overflow.png", { type: "image/png" });

    await act(async () => {
      await result.current.mutateAsync({
        elementId: "elem-123",
        file: dummyFile,
        projectId: "proj-1",
      });
    });

    const cached = queryClient.getQueryData(queryKeys.projectData.byProject("proj-1"));
    expect(cached.projectContents.media.length).toBe(6);
  });
});
