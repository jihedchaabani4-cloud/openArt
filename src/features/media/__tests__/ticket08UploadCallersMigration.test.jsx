import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { elementService } from "@/features/elements/services/elementService";
import { characterService } from "@/features/characters/services/characterService";
import { useUploadMedia } from "../model/useUploadMedia";
import {
  validateFilesAgainstPolicy,
  ELEMENT_REFERENCE_UPLOAD_POLICY,
  CHARACTER_DETAIL_UPLOAD_POLICY,
  getAcceptedMimeTypes,
} from "../uploadPolicy";
import { CharacterDetailsGallery } from "@/features/characters";
import { CharacterEditNavbar } from "@/widgets/CharacterEditNavbar/CharacterEditNavbar";
import { api } from "@/shared/api/client";

const mockBatchUploadAsync = vi.fn();
vi.mock("../api/mediaApi", () => ({
  useBatchUploadAssets: () => ({
    mutateAsync: mockBatchUploadAsync,
    isPending: false,
  }),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ projectId: "proj-test", workflowId: "wf-test" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/cinema-studio/proj-test/characters/wf-test",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/shared/api/client", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Ticket 08: Frontend Upload Callers Migration to FormData and mediaId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Policy constraints & Pre-flight UX validation", () => {
    it("rejects video/* files for ELEMENT_REFERENCE_UPLOAD_POLICY", () => {
      const videoFile = new File(["dummy video"], "video.mp4", { type: "video/mp4" });
      const result = validateFilesAgainstPolicy(videoFile, ELEMENT_REFERENCE_UPLOAD_POLICY);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/unsupported file type|not permitted/i);
    });

    it("rejects video/* files for CHARACTER_DETAIL_UPLOAD_POLICY", () => {
      const videoFile = new File(["dummy video"], "clip.webm", { type: "video/webm" });
      const result = validateFilesAgainstPolicy(videoFile, CHARACTER_DETAIL_UPLOAD_POLICY);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/unsupported file type|not permitted/i);
    });

    it("rejects images larger than 20 MB", () => {
      const bigFile = new File(["x"], "big.png", { type: "image/png" });
      Object.defineProperty(bigFile, "size", { value: 25 * 1024 * 1024 });

      const result = validateFilesAgainstPolicy(bigFile, ELEMENT_REFERENCE_UPLOAD_POLICY);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/exceeds the maximum image size of 20 MB/i);
    });

    it("rejects more than 6 files for element reference upload", () => {
      const files = Array.from({ length: 7 }, (_, i) =>
        new File(["data"], `img_${i}.png`, { type: "image/png" })
      );
      const result = validateFilesAgainstPolicy(files, ELEMENT_REFERENCE_UPLOAD_POLICY);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/Maximum allowed is 6/i);
    });

    it("accepts valid image formats within 20 MB", () => {
      const file = new File(["image-bytes"], "ref.png", { type: "image/png" });
      const result = validateFilesAgainstPolicy(file, ELEMENT_REFERENCE_UPLOAD_POLICY);
      expect(result.valid).toBe(true);
      expect(result.message).toBeNull();
    });

    it("derives file picker accept from policies (no video on element)", () => {
      const accept = getAcceptedMimeTypes(ELEMENT_REFERENCE_UPLOAD_POLICY);
      expect(accept).toContain("image/jpeg");
      expect(accept).toContain("image/png");
      expect(accept).not.toContain("video/");
    });
  });

  describe("2. elementService FormData and mediaId dispatch (no Base64, no double-upload)", () => {
    it("dispatches local File via FormData directly to POST /v2/elements/:id/images", async () => {
      api.post.mockResolvedValueOnce({ status: "created", media: { id: "m-123" } });

      const file = new File(["pixels"], "photo.png", { type: "image/png" });
      const res = await elementService.addReferenceImage("elem-abc", file, { projectId: "proj-1" });

      expect(api.post).toHaveBeenCalledTimes(1);
      const [endpoint, body] = api.post.mock.calls[0];
      expect(endpoint).toBe("/v2/elements/elem-abc/images");
      expect(body instanceof FormData).toBe(true);
      expect(body.get("file")).toBe(file);
      expect(body.get("projectId")).toBe("proj-1");
      expect(res).toEqual({ status: "created", media: { id: "m-123" } });
    });

    it("dispatches existing Project Cache asset via { mediaId } as JSON without re-upload", async () => {
      api.post.mockResolvedValueOnce({ status: "created", media: { id: "m-existing" } });

      await elementService.addReferenceImage("elem-abc", { mediaId: "m-existing" }, { projectId: "proj-1" });

      expect(api.post).toHaveBeenCalledTimes(1);
      const [endpoint, body] = api.post.mock.calls[0];
      expect(endpoint).toBe("/v2/elements/elem-abc/images");
      expect(body instanceof FormData).toBe(false);
      expect(body).toEqual({ mediaId: "m-existing", projectId: "proj-1" });
    });

    it("attachImages dispatches mixed batch of File and mediaId without Base64 encoding", async () => {
      api.post.mockResolvedValue({ status: "created" });

      const file = new File(["bytes"], "upload.jpg", { type: "image/jpeg" });
      const items = [{ file }, { mediaId: "cached-media-99" }];

      await elementService.attachImages("elem-xyz", items, { projectId: "proj-test" });

      expect(api.post).toHaveBeenCalledTimes(2);

      // Call 1: FormData with file
      const [ep1, body1] = api.post.mock.calls[0];
      expect(ep1).toBe("/v2/elements/elem-xyz/images");
      expect(body1 instanceof FormData).toBe(true);
      expect(body1.get("file")).toBe(file);

      // Call 2: JSON with mediaId
      const [ep2, body2] = api.post.mock.calls[1];
      expect(ep2).toBe("/v2/elements/elem-xyz/images");
      expect(body2).toEqual({ mediaId: "cached-media-99", projectId: "proj-test" });
    });
  });

  describe("3. characterService FormData and mediaId dispatch", () => {
    it("setSheetMedia sends File via FormData to /characters/:id/sheet-media", async () => {
      api.post.mockResolvedValueOnce({ ok: true });

      const sheetFile = new File(["sheet"], "turnaround.png", { type: "image/png" });
      await characterService.setSheetMedia({
        characterId: "char-1",
        file: sheetFile,
        projectId: "proj-1",
      });

      expect(api.post).toHaveBeenCalledTimes(1);
      const [endpoint, body] = api.post.mock.calls[0];
      expect(endpoint).toBe("/characters/char-1/sheet-media");
      expect(body instanceof FormData).toBe(true);
      expect(body.get("file")).toBe(sheetFile);
    });

    it("setSheetMedia sends mediaId as JSON without re-upload", async () => {
      api.post.mockResolvedValueOnce({ ok: true });

      await characterService.setSheetMedia({
        characterId: "char-1",
        mediaId: "sheet-media-uuid",
        projectId: "proj-1",
      });

      expect(api.post).toHaveBeenCalledTimes(1);
      const [endpoint, body] = api.post.mock.calls[0];
      expect(endpoint).toBe("/characters/char-1/sheet-media");
      expect(body instanceof FormData).toBe(false);
      expect(body).toEqual({ mediaId: "sheet-media-uuid", imageUrl: undefined, projectId: "proj-1" });
    });

    it("addDetailMedia sends File via FormData to /characters/:id/media", async () => {
      api.post.mockResolvedValueOnce({ ok: true });

      const detailFile = new File(["detail"], "detail.png", { type: "image/png" });
      await characterService.addDetailMedia({
        characterId: "char-2",
        file: detailFile,
        projectId: "proj-1",
      });

      expect(api.post).toHaveBeenCalledTimes(1);
      const [endpoint, body] = api.post.mock.calls[0];
      expect(endpoint).toBe("/characters/char-2/media");
      expect(body instanceof FormData).toBe(true);
      expect(body.get("file")).toBe(detailFile);
    });

    it("addDetailMedia sends mediaId as JSON to /characters/:id/media", async () => {
      api.post.mockResolvedValueOnce({ ok: true });

      await characterService.addDetailMedia({
        characterId: "char-2",
        mediaId: "detail-media-uuid",
        projectId: "proj-1",
      });

      expect(api.post).toHaveBeenCalledTimes(1);
      const [endpoint, body] = api.post.mock.calls[0];
      expect(endpoint).toBe("/characters/char-2/media");
      expect(body instanceof FormData).toBe(false);
      expect(body).toEqual({ mediaId: "detail-media-uuid", imageUrl: undefined, projectId: "proj-1" });
    });
  });

  describe("4. Character Detail Quota UX: Disable Add at 5 while rendering all existing if > 5", () => {
    let clientWidthSpy;

    beforeEach(() => {
      clientWidthSpy = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => 800);
    });

    afterEach(() => {
      cleanup();
      clientWidthSpy?.mockRestore?.();
    });

    it("disables CharacterEditNavbar add trigger when isAddDisabled is true", () => {
      renderWithClient(
        <CharacterEditNavbar
          onUpload={vi.fn()}
          onOpenAssets={vi.fn()}
          isAddDisabled={true}
        />
      );

      const trigger = screen.getByTestId("import-dropdown-trigger");
      expect(trigger.disabled || trigger.hasAttribute("disabled")).toBe(true);
      expect(trigger.getAttribute("title")).toMatch(/Maximum 5 images/i);
    });

    it("enables CharacterEditNavbar add trigger when isAddDisabled is false", () => {
      renderWithClient(
        <CharacterEditNavbar
          onUpload={vi.fn()}
          onOpenAssets={vi.fn()}
          isAddDisabled={false}
        />
      );

      const trigger = screen.getByTestId("import-dropdown-trigger");
      expect(trigger.disabled || trigger.hasAttribute("disabled")).toBe(false);
    });

    it("renders all existing detail photos non-destructively even if count exceeds 5", () => {
      const sevenDetails = Array.from({ length: 7 }, (_, i) => ({
        id: `med-${i + 1}`,
        url: `https://example.com/img${i + 1}.png`,
        name: `detail_${i + 1}.png`,
        width: 1000,
        height: 1000,
      }));

      const { container } = renderWithClient(
        <CharacterDetailsGallery
          items={sevenDetails}
          displayDetailImages={sevenDetails}
          maxAllowed={5}
          isAddDisabled={true}
          showTopActions={true}
          onUploadFiles={vi.fn()}
        />
      );

      // Top action buttons should be disabled because count is >= 5
      const buttons = screen.getAllByRole("button");
      const importButton = buttons.find((b) => b.textContent?.includes("Importer"));
      if (importButton) {
        expect(importButton.disabled || importButton.hasAttribute("disabled")).toBe(true);
      }

      // Non-destructive read invariant: all 7 media cards / images are present
      const cards = container.querySelectorAll(".group");
      expect(cards.length).toBe(7);
    });
  });

  describe("5. useUploadMedia batch multi-file pre-flight validation", () => {
    it("allows batch multi-file upload by validating each file individually against DEFAULT_UPLOAD_POLICY", async () => {
      mockBatchUploadAsync.mockResolvedValueOnce([
        { id: "wf-1", url: "https://example.com/1.png" },
        { id: "wf-2", url: "https://example.com/2.png" },
      ]);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUploadMedia("proj-test"), { wrapper });

      const file1 = new File(["bytes1"], "f1.png", { type: "image/png" });
      const file2 = new File(["bytes2"], "f2.png", { type: "image/png" });

      const uploaded = await result.current.uploadMedia([file1, file2]);
      expect(uploaded).toHaveLength(2);
      expect(mockBatchUploadAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          files: [file1, file2],
          projectId: "proj-test",
        })
      );
    });

    it("rejects batch multi-file upload when more than 15 files are provided in a single upload", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });
      const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useUploadMedia("proj-test"), { wrapper });

      const files = Array.from({ length: 16 }, (_, i) =>
        new File([`bytes${i}`], `file-${i}.png`, { type: "image/png" })
      );

      await expect(result.current.uploadMedia(files)).rejects.toThrow(
        /Maximum allowed is 15 files per upload/i
      );
      expect(mockBatchUploadAsync).not.toHaveBeenCalled();
    });
  });
});
