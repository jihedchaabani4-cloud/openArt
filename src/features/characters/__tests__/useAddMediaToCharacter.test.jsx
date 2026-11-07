import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { characterService } from "../services/characterService";
import { queryKeys } from "@/shared/api/queryKeys";
import { useAddMediaToCharacter } from "../hooks/useAddMediaToCharacter";

vi.mock("../services/characterService", () => ({
  characterService: {
    addDetailMedia: vi.fn(),
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
      queryKeys.projectData.byProject("proj-char-1"),
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

describe("useAddMediaToCharacter", () => {
  let createObjectURLMock;
  let revokeObjectURLMock;

  beforeEach(() => {
    vi.clearAllMocks();
    createObjectURLMock = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:http://localhost/char-preview");
    revokeObjectURLMock = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    createObjectURLMock.mockRestore();
    revokeObjectURLMock.mockRestore();
  });

  it("calls characterService.addDetailMedia and cleans up blob URLs on success", async () => {
    characterService.addDetailMedia.mockResolvedValueOnce({
      ok: true,
      media: { id: "media-char-1", url: "https://cdn.example.com/char1.png" },
    });

    const { wrapper } = createWrapper({
      projectContents: { media: [] },
    });

    const { result } = renderHook(() => useAddMediaToCharacter(), { wrapper });
    const dummyFile = new File(["dummy char"], "detail.png", { type: "image/png" });

    await act(async () => {
      await result.current.mutateAsync({
        characterId: "char-123",
        file: dummyFile,
        projectId: "proj-char-1",
      });
    });

    expect(characterService.addDetailMedia).toHaveBeenCalledWith({
      characterId: "char-123",
      file: dummyFile,
      projectId: "proj-char-1",
      _isBlob: true,
      _localUrl: "blob:http://localhost/char-preview",
      _tempId: expect.stringContaining("optimistic-char-media-"),
    });

    expect(createObjectURLMock).toHaveBeenCalledWith(dummyFile);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:http://localhost/char-preview");
  });

  it("attaches existing Project Cache asset via mediaId with zero blob creation", async () => {
    characterService.addDetailMedia.mockResolvedValueOnce({
      ok: true,
      media: { id: "media-cached-char", url: "https://cdn.example.com/cached.png" },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAddMediaToCharacter(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        characterId: "char-123",
        mediaId: "media-cached-char",
        projectId: "proj-char-1",
      });
    });

    expect(characterService.addDetailMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        characterId: "char-123",
        mediaId: "media-cached-char",
        projectId: "proj-char-1",
      })
    );
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });
});
