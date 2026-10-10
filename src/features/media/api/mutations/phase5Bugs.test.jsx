import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useRemoveMediaFromCharacter } from "@/features/characters/hooks/useRemoveMediaFromCharacter";
import { useBatchUploadAssets } from "./useBatchUploadAssets";
import { characterService } from "@/features/characters/services/characterService";
import { api } from "@/shared/api/client";

vi.mock("@/shared/api/client", () => ({
  api: { postForm: vi.fn() },
}));

vi.mock("@/features/characters/services/characterService", () => ({
  characterService: { removeDetailMedia: vi.fn() },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-preview-url");
globalThis.URL.revokeObjectURL = vi.fn();

// jsdom never loads images: fire onerror as soon as src is set so getMediaMetadata resolves(null).
class FakeImage {
  set src(_v) {
    setTimeout(() => this.onerror?.(), 0);
  }
}
globalThis.Image = FakeImage;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("Phase 5 known bugs", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("T5.1 useRemoveMediaFromCharacter", () => {
    it("removes the media optimistically", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");
      queryClient.setQueryData(pKey, {
        projectContents: { media: [{ id: "m-1" }, { id: "m-2" }] },
      });
      let resolveApi;
      characterService.removeDetailMedia.mockReturnValueOnce(
        new Promise((r) => { resolveApi = r; })
      );

      const { result } = renderHook(() => useRemoveMediaFromCharacter(), { wrapper });
      act(() => {
        result.current.mutate({ characterId: "char-1", mediaId: "m-1", projectId: "proj-1" });
      });

      await waitFor(() => {
        const ids = queryClient.getQueryData(pKey).projectContents.media.map((m) => m.id);
        expect(ids).toEqual(["m-2"]);
      });
      await act(async () => { resolveApi({ ok: true }); });
    });

    it("restores the media if the API fails", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");
      queryClient.setQueryData(pKey, {
        projectContents: { media: [{ id: "m-1" }, { id: "m-2" }] },
      });
      characterService.removeDetailMedia.mockRejectedValueOnce(new Error("boom"));

      const { result } = renderHook(() => useRemoveMediaFromCharacter(), { wrapper });
      await act(async () => {
        try {
          await result.current.mutateAsync({ characterId: "char-1", mediaId: "m-1", projectId: "proj-1" });
        } catch {
          // expected
        }
      });

      const ids = queryClient.getQueryData(pKey).projectContents.media.map((m) => m.id);
      expect(ids).toEqual(["m-1", "m-2"]);
    });
  });

  describe("T5.2 useBatchUploadAssets", () => {
    it("writes the 4 folder_id variants on the optimistic workflow", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");
      queryClient.setQueryData(pKey, { projectContents: { workflows: [], media: [] } });

      let resolveUpload;
      api.postForm.mockReturnValue(new Promise((r) => { resolveUpload = r; }));

      const file = new File(["x"], "a.png", { type: "image/png" });
      const { result } = renderHook(() => useBatchUploadAssets(), { wrapper });
      act(() => {
        result.current.mutate({ files: [file], projectId: "proj-1", folderId: "folder-9" });
      });

      await waitFor(() => {
        expect(queryClient.getQueryData(pKey).projectContents.workflows).toHaveLength(1);
      });
      const wf = queryClient.getQueryData(pKey).projectContents.workflows[0];
      expect(wf.folder_id).toBe("folder-9");
      expect(wf.folderId).toBe("folder-9");
      expect(wf.metadata.folder_id).toBe("folder-9");
      expect(wf.metadata.folderId).toBe("folder-9");

      await act(async () => { resolveUpload?.({ ok: true }); });
    });
  });
});
