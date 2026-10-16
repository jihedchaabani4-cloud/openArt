import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useAddImageToElement } from "@/features/elements/hooks/useAddImageToElement";
import { useAddMediaToCharacter } from "@/features/characters/hooks/useAddMediaToCharacter";
import { api } from "@/shared/api/client";
import { characterService } from "@/features/characters/services/characterService";

vi.mock("@/shared/api/client", () => ({
  api: {
    post: vi.fn(),
  },
}));

vi.mock("@/features/characters/services/characterService", () => ({
  characterService: {
    addDetailMedia: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-preview-url");
globalThis.URL.revokeObjectURL = vi.fn();

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

describe("Optimistic Detail Media Insertion and Success Transition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAddMediaToCharacter", () => {
    it("optimistically adds detail media with status processing and transitions to success upon backend return", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      queryClient.setQueryData(pKey, {
        projectContents: {
          media: [],
          characters: [{ id: "char-1" }],
        },
      });

      let resolveApi;
      const apiPromise = new Promise((resolve) => {
        resolveApi = resolve;
      });
      characterService.addDetailMedia.mockImplementationOnce(() => apiPromise);

      const fakeFile = new Blob(["test"], { type: "image/png" });
      const { result } = renderHook(() => useAddMediaToCharacter(), { wrapper });

      let mutatePromise;
      act(() => {
        mutatePromise = result.current.mutateAsync({
          characterId: "char-1",
          file: fakeFile,
          projectId: "proj-1",
        });
      });
      await act(async () => {
        await Promise.resolve();
      });

      // 1. In-flight: optimistic item must exist in cache with status processing and step_id character_detail
      const inFlightCache = queryClient.getQueryData(pKey);
      expect(inFlightCache.projectContents.media).toHaveLength(1);
      const optimisticItem = inFlightCache.projectContents.media[0];
      expect(optimisticItem.status).toBe("processing");
      expect(optimisticItem.step_id).toBe("character_detail");
      expect(optimisticItem.workflow_id).toBe("char-1");
      expect(optimisticItem.url).toBe("blob:mock-preview-url");

      // 2. Resolve backend API with success
      await act(async () => {
        resolveApi({
          ok: true,
          media: {
            id: "real-char-media-99",
            url: "https://storage.openart.ai/char-sheets/real.png",
            status: "success",
            step_id: "character_detail",
            workflow_id: "char-1",
          },
        });
        await mutatePromise;
      });

      // 3. Settled: cache should be updated to success with real id and url
      const settledCache = queryClient.getQueryData(pKey);
      const settledItem = settledCache.projectContents.media.find(
        (m) => m.id === "real-char-media-99" || m.id === optimisticItem.id
      );
      expect(settledItem).toBeDefined();
      expect(settledItem.status).toBe("success");
      expect(settledItem.url).toBe("https://storage.openart.ai/char-sheets/real.png");
    });

    it("optimistically adds detail media when selected from project assets (imageUrl)", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      queryClient.setQueryData(pKey, {
        projectContents: {
          media: [],
          characters: [{ id: "char-1" }],
        },
      });

      characterService.addDetailMedia.mockResolvedValueOnce({
        ok: true,
        media: {
          id: "real-media-from-asset",
          url: "https://storage.openart.ai/existing.png",
          status: "success",
        },
      });

      const { result } = renderHook(() => useAddMediaToCharacter(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          characterId: "char-1",
          imageUrl: "https://storage.openart.ai/existing.png",
          mediaId: "existing-media-id",
          projectId: "proj-1",
        });
      });

      const cache = queryClient.getQueryData(pKey);
      expect(cache.projectContents.media).toHaveLength(1);
      expect(cache.projectContents.media[0].status).toBe("success");
      expect(cache.projectContents.media[0].url).toBe("https://storage.openart.ai/existing.png");
    });
  });

  describe("useAddImageToElement", () => {
    it("optimistically adds element reference image with status processing and transitions to success", async () => {
      const { queryClient, wrapper } = createWrapper();
      const pKey = queryKeys.projectData.byProject("proj-1");

      queryClient.setQueryData(pKey, {
        projectContents: {
          media: [],
          elements: [{ id: "el-1", workflow_id: "el-1" }],
        },
      });

      let resolveApi;
      const apiPromise = new Promise((resolve) => {
        resolveApi = resolve;
      });
      api.post.mockImplementationOnce(() => apiPromise);

      const fakeFile = new Blob(["test"], { type: "image/png" });
      const { result } = renderHook(() => useAddImageToElement(), { wrapper });

      let mutatePromise;
      act(() => {
        mutatePromise = result.current.mutateAsync({
          elementId: "el-1",
          file: fakeFile,
          projectId: "proj-1",
        });
      });
      await act(async () => {
        await Promise.resolve();
      });

      // 1. In-flight: optimistic item must exist in cache with status processing and step_id element_reference
      const inFlightCache = queryClient.getQueryData(pKey);
      expect(inFlightCache.projectContents.media).toHaveLength(1);
      const optimisticItem = inFlightCache.projectContents.media[0];
      expect(optimisticItem.status).toBe("processing");
      expect(optimisticItem.step_id).toBe("element_reference");
      expect(optimisticItem.workflow_id).toBe("el-1");
      expect(optimisticItem.url).toBe("blob:mock-preview-url");

      // 2. Resolve backend API with success
      await act(async () => {
        resolveApi({
          status: "created",
          media: {
            id: "real-el-media-88",
            url: "https://storage.openart.ai/elements/real-el.png",
            status: "success",
            step_id: "element_reference",
            workflow_id: "el-1",
          },
        });
        await mutatePromise;
      });

      // 3. Settled: cache should be updated to success with real id and url
      const settledCache = queryClient.getQueryData(pKey);
      const settledItem = settledCache.projectContents.media.find(
        (m) => m.id === "real-el-media-88" || m.id === optimisticItem.id
      );
      expect(settledItem).toBeDefined();
      expect(settledItem.status).toBe("success");
      expect(settledItem.url).toBe("https://storage.openart.ai/elements/real-el.png");
    });
  });
});
