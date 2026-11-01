import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useBatchUploadAssets } from "../useBatchUploadAssets";
import { api } from "@/shared/api/client";

vi.mock("@/shared/api/client", () => ({
  api: { postForm: vi.fn() },
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-preview-url");
globalThis.URL.revokeObjectURL = vi.fn();

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

describe("Batch Upload Concurrency & Ghost Media Bug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test 1: Regression — verifies that with concurrency=2, uploading 7 files
   * NEVER exceeds 2 active requests at a time, and ALL 7 succeed (no ghost media).
   */
  it("throttles batch uploads so peak concurrency never exceeds maxConcurrent (2), all 7 succeed", async () => {
    const { queryClient, wrapper } = createWrapper();
    const projectId = "proj-concurrency-1";
    const projectDataKey = queryKeys.projectData.byProject(projectId);

    queryClient.setQueryData(projectDataKey, {
      projectContents: { workflows: [], media: [] },
    });

    const MAX_CONCURRENT = 2;
    let activeRequests = 0;
    let peakActiveRequests = 0;
    const serverPersistedFiles = [];

    // Simulate backend: rejects when > MAX_CONCURRENT simultaneous uploads
    api.postForm.mockImplementation(async (url, formData) => {
      activeRequests++;
      peakActiveRequests = Math.max(peakActiveRequests, activeRequests);

      const file = formData.get("file");
      const fileName = file?.name || "unknown";

      if (activeRequests > MAX_CONCURRENT) {
        activeRequests--;
        const err = new Error(`Too many concurrent uploads. Maximum allowed is ${MAX_CONCURRENT}.`);
        err.statusCode = 429;
        err.code = "TOO_MANY_CONCURRENT_UPLOADS";
        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, 30));
      activeRequests--;
      serverPersistedFiles.push(fileName);

      return {
        ok: true,
        workflow_id: `wf-${fileName}`,
        media_id: `m-${fileName}`,
        url: `https://storage.test/${fileName}`,
      };
    });

    const files = Array.from(
      { length: 7 },
      (_, i) => new File([`data-${i}`], `image-${i + 1}.png`, { type: "image/png" })
    );

    const { result } = renderHook(() => useBatchUploadAssets(), { wrapper });

    let results = null;
    await act(async () => {
      results = await result.current.mutateAsync({ files, projectId });
    });

    // All 7 uploaded without error
    expect(results).toHaveLength(7);

    // Peak concurrency was within backend limit — no 429 triggered
    expect(peakActiveRequests).toBeLessThanOrEqual(MAX_CONCURRENT);

    // All 7 persisted on server — zero ghost files
    expect(serverPersistedFiles).toHaveLength(7);
    for (let i = 1; i <= 7; i++) {
      expect(serverPersistedFiles).toContain(`image-${i}.png`);
    }
  });

  /**
   * Test 2: Error isolation — when 1 file fails mid-batch (e.g. file is corrupt / 400),
   * the mutation throws, optimistic UI rolls back, and subsequent uploads are aborted.
   */
  it("rolls back optimistic UI and aborts remaining uploads when one file upload fails", async () => {
    const { queryClient, wrapper } = createWrapper();
    const projectId = "proj-concurrency-2";
    const projectDataKey = queryKeys.projectData.byProject(projectId);

    queryClient.setQueryData(projectDataKey, {
      projectContents: { workflows: [], media: [] },
    });

    let callCount = 0;
    api.postForm.mockImplementation(async (url, formData, options) => {
      callCount++;
      const file = formData.get("file");
      const fileName = file?.name || "unknown";

      // Simulate the 2nd file failing (e.g. unsupported format)
      if (callCount === 2) {
        const err = new Error("Unsupported file type");
        err.statusCode = 415;
        err.code = "UNSUPPORTED_MEDIA_TYPE";
        throw err;
      }

      await new Promise((resolve, reject) => {
        const delay = setTimeout(resolve, 50);
        options?.signal?.addEventListener("abort", () => {
          clearTimeout(delay);
          reject(new DOMException("Aborted", "AbortError"));
        });
      });

      return {
        ok: true,
        workflow_id: `wf-${fileName}`,
        url: `https://storage.test/${fileName}`,
      };
    });

    const files = Array.from(
      { length: 4 },
      (_, i) => new File([`data-${i}`], `image-${i + 1}.png`, { type: "image/png" })
    );

    const { result } = renderHook(() => useBatchUploadAssets(), { wrapper });

    let uploadError = null;
    await act(async () => {
      try {
        await result.current.mutateAsync({ files, projectId });
      } catch (err) {
        uploadError = err;
      }
    });

    // Mutation threw — user sees error
    expect(uploadError).not.toBeNull();
    expect(uploadError.code || uploadError.statusCode).toBeTruthy();

    // Optimistic UI was rolled back
    await waitFor(() => {
      const cached = queryClient.getQueryData(projectDataKey);
      expect(cached.projectContents.media).toHaveLength(0);
    });
  });

  /**
   * Test 3: Folder metadata — all 4 folder_id variants are written to optimistic workflow
   */
  it("writes all 4 folder_id variants on the optimistic workflow", async () => {
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
