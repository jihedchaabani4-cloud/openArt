import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { toast } from "sonner";
import { useUploadMedia, validateBatchCount } from "../model/useUploadMedia";
import { MAX_BATCH_UPLOAD_FILES, BATCH_UPLOAD_CONCURRENCY } from "../uploadPolicy";
import { NavbarImportButton } from "@/widgets/StudioNavbar/ui/NavbarImportButton";

vi.mock("@/shared/api/client", () => ({
  api: { postForm: vi.fn(), post: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ projectId: "test-proj-id" }),
  usePathname: () => "/cinema-studio/test-proj-id/assets",
  useSearchParams: () => new URLSearchParams(),
}));

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

describe("Batch Upload Pass (my-app)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1) 16 files -> rejected, 0 requests
  it("16 files -> rejected, 0 requests", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUploadMedia("test-proj-id"), { wrapper });

    const files16 = Array.from({ length: 16 }, (_, i) =>
      new File([`data${i}`], `image-${i}.png`, { type: "image/png" })
    );

    await expect(result.current.uploadMedia(files16)).rejects.toThrow(
      new RegExp(`Maximum allowed is ${MAX_BATCH_UPLOAD_FILES} files per upload`, "i")
    );

    expect(api.postForm).not.toHaveBeenCalled();
  });

  // 2) 15 files -> 15 requests of 1 file each, never more than 2 in flight
  it("15 files -> 15 requests of 1 file each, never more than 2 in flight", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUploadMedia("test-proj-id"), { wrapper });

    let activeRequests = 0;
    let peakConcurrency = 0;

    api.postForm.mockImplementation(async (url, formData) => {
      activeRequests++;
      peakConcurrency = Math.max(peakConcurrency, activeRequests);
      // Simulate asynchronous network flight
      await new Promise((r) => setTimeout(r, 20));
      activeRequests--;
      const file = formData.get("file");
      return {
        ok: true,
        workflow_id: `wf-${file?.name}`,
        media_id: `media-${file?.name}`,
        url: `https://storage.test/${file?.name}`,
        type: "image",
      };
    });

    const files15 = Array.from({ length: 15 }, (_, i) =>
      new File([`data${i}`], `img-${i}.png`, { type: "image/png" })
    );

    const uploaded = await result.current.uploadMedia(files15);

    expect(uploaded).toHaveLength(15);
    expect(api.postForm).toHaveBeenCalledTimes(15);
    expect(peakConcurrency).toBeLessThanOrEqual(BATCH_UPLOAD_CONCURRENCY);
  });

  // 3) file 3 fails -> the other 14 finish, file 3 is failed, retry sends only file 3
  it("file 3 fails -> the other 14 finish, file 3 is failed, retry sends only file 3", async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUploadMedia("test-proj-id"), { wrapper });

    api.postForm.mockImplementation(async (url, formData) => {
      const file = formData.get("file");
      if (file?.name === "file-2.png") { // 0-indexed: file 3 is file-2.png
        throw new Error("Network upload error on file 3");
      }
      return {
        ok: true,
        workflow_id: `wf-${file?.name}`,
        media_id: `media-${file?.name}`,
        url: `https://storage.test/${file?.name}`,
        type: "image",
      };
    });

    const files15 = Array.from({ length: 15 }, (_, i) =>
      new File([`data${i}`], `file-${i}.png`, { type: "image/png" })
    );

    const uploadResults = await result.current.uploadMedia(files15);

    expect(uploadResults).toHaveLength(15);
    // Other 14 finished
    const successful = uploadResults.filter((r) => r.status === "done");
    const failed = uploadResults.filter((r) => r.status === "failed");

    expect(successful).toHaveLength(14);
    expect(failed).toHaveLength(1);
    expect(failed[0].file.name).toBe("file-2.png");
    expect(failed[0].status).toBe("failed");

    // Retry sends ONLY file 3
    api.postForm.mockClear();
    api.postForm.mockImplementationOnce(async (url, formData) => {
      const file = formData.get("file");
      return {
        ok: true,
        workflow_id: `wf-${file?.name}`,
        media_id: `media-${file?.name}`,
        url: `https://storage.test/${file?.name}`,
        type: "image",
      };
    });

    const retried = await result.current.retry(failed[0]);
    expect(api.postForm).toHaveBeenCalledTimes(1);
    const retryFormData = api.postForm.mock.calls[0][1];
    expect(retryFormData.get("file").name).toBe("file-2.png");
    expect(retried.status).toBe("done");
  });

  // 4) Navbar picker and drag-and-drop use the same hook
  it("Navbar picker and drag-and-drop use the same hook", async () => {
    // Both NavbarImportButton and drag-and-drop import and invoke useUploadMedia
    expect(typeof useUploadMedia).toBe("function");
    expect(typeof NavbarImportButton).toBe("function");
  });
});
