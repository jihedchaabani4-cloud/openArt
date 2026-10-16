import { describe, it, expect } from "vitest";
import {
  toMediaItem,
  resolveMediaUrl,
  resolveThumbUrl,
  isVideoMedia,
  normalizeMediaStatus,
  normalizeRole,
} from "../toMediaItem";

describe("core/toMediaItem - Canonical Media Normalizer", () => {
  describe("resolveMediaUrl union ladder", () => {
    it("resolves top-level string URL", () => {
      expect(resolveMediaUrl("https://example.com/item.png")).toBe("https://example.com/item.png");
    });

    it("resolves direct .url property", () => {
      expect(resolveMediaUrl({ url: "https://example.com/url.png" })).toBe("https://example.com/url.png");
    });

    it("resolves image.generatedImage.url branch", () => {
      expect(resolveMediaUrl({ image: { generatedImage: { url: "https://example.com/gen.png" } } }))
        .toBe("https://example.com/gen.png");
    });

    it("resolves image.url branch", () => {
      expect(resolveMediaUrl({ image: { url: "https://example.com/img.png" } }))
        .toBe("https://example.com/img.png");
    });

    it("resolves video.generatedVideo.uri and url branches", () => {
      expect(resolveMediaUrl({ video: { generatedVideo: { uri: "https://example.com/video.mp4" } } }))
        .toBe("https://example.com/video.mp4");
      expect(resolveMediaUrl({ video: { generatedVideo: { url: "https://example.com/video2.mp4" } } }))
        .toBe("https://example.com/video2.mp4");
      expect(resolveMediaUrl({ video: { url: "https://example.com/video3.mp4" } }))
        .toBe("https://example.com/video3.mp4");
    });

    it("resolves preview, thumbnail, file_url, asset.file_url, and src branches", () => {
      expect(resolveMediaUrl({ preview: "https://example.com/prev.png" })).toBe("https://example.com/prev.png");
      expect(resolveMediaUrl({ thumbnail: "https://example.com/thumb.png" })).toBe("https://example.com/thumb.png");
      expect(resolveMediaUrl({ file_url: "https://example.com/file.png" })).toBe("https://example.com/file.png");
      expect(resolveMediaUrl({ asset: { file_url: "https://example.com/asset_file.png" } }))
        .toBe("https://example.com/asset_file.png");
      expect(resolveMediaUrl({ image_url: "https://example.com/img_url.png" })).toBe("https://example.com/img_url.png");
      expect(resolveMediaUrl({ src: "https://example.com/src.png" })).toBe("https://example.com/src.png");
    });

    it("resolves rawValue nested properties", () => {
      expect(resolveMediaUrl({ rawValue: { url: "https://example.com/raw.png" } })).toBe("https://example.com/raw.png");
      expect(resolveMediaUrl({ rawValue: { preview: "https://example.com/raw_prev.png" } })).toBe("https://example.com/raw_prev.png");
      expect(resolveMediaUrl({ rawValue: { file_url: "https://example.com/raw_file.png" } })).toBe("https://example.com/raw_file.png");
    });

    it("returns null for empty or invalid media", () => {
      expect(resolveMediaUrl(null)).toBeNull();
      expect(resolveMediaUrl(undefined)).toBeNull();
      expect(resolveMediaUrl("   ")).toBeNull();
      expect(resolveMediaUrl({})).toBeNull();
    });
  });

  describe("resolveThumbUrl helper", () => {
    it("resolves thumbUrl, thumbnail, and preview", () => {
      expect(resolveThumbUrl({ thumbUrl: "https://example.com/thumb.png" })).toBe("https://example.com/thumb.png");
      expect(resolveThumbUrl({ thumbnail: "https://example.com/t.png" })).toBe("https://example.com/t.png");
      expect(resolveThumbUrl({ preview: "https://example.com/p.png" })).toBe("https://example.com/p.png");
      expect(resolveThumbUrl(null)).toBeNull();
    });
  });

  describe("isVideoMedia helper", () => {
    it("identifies video media by flag or url extension", () => {
      expect(isVideoMedia({ is_video: true })).toBe(true);
      expect(isVideoMedia({ url: "https://example.com/clip.mp4" })).toBe(true);
      expect(isVideoMedia({ url: "https://example.com/photo.jpg" })).toBe(false);
      expect(isVideoMedia(null)).toBe(false);
    });
  });

  describe("status normalization", () => {
    it("maps DB 'success' and UI 'completed' to 'ready'", () => {
      expect(normalizeMediaStatus("success")).toBe("ready");
      expect(normalizeMediaStatus("completed")).toBe("ready");
      expect(normalizeMediaStatus("ready")).toBe("ready");
      expect(normalizeMediaStatus(null, null, "https://example.com/image.png")).toBe("ready");
    });

    it("maps pending, uploading, queued, processing to 'processing'", () => {
      expect(normalizeMediaStatus("processing")).toBe("processing");
      expect(normalizeMediaStatus("pending")).toBe("processing");
      expect(normalizeMediaStatus("uploading")).toBe("processing");
      expect(normalizeMediaStatus("queued")).toBe("processing");
    });

    it("maps error, rejected, failed or error object to 'failed'", () => {
      expect(normalizeMediaStatus("failed")).toBe("failed");
      expect(normalizeMediaStatus("error")).toBe("failed");
      expect(normalizeMediaStatus("rejected")).toBe("failed");
      expect(normalizeMediaStatus("completed", "Network error")).toBe("failed");
    });
  });

  describe("role normalization", () => {
    it("preserves valid roles", () => {
      expect(normalizeRole("sheet")).toBe("sheet");
      expect(normalizeRole("detail")).toBe("detail");
      expect(normalizeRole("output")).toBe("output");
      expect(normalizeRole("turnaround")).toBe("turnaround");
    });

    it("maps legacy step aliases", () => {
      expect(normalizeRole("character_sheet")).toBe("sheet");
      expect(normalizeRole("character_detail")).toBe("detail");
    });

    it("returns null for unknown roles", () => {
      expect(normalizeRole("unknown_tag")).toBeNull();
      expect(normalizeRole(null)).toBeNull();
    });
  });

  describe("toMediaItem conversion", () => {
    it("normalizes a complete raw media record", () => {
      const raw = {
        id: "media-123",
        workflow_id: "wf-456",
        url: "https://example.com/render.png",
        status: "success",
        role: "sheet",
        width: 1024,
        height: 768,
        display_name: "Hero Render",
      };

      const item = toMediaItem(raw);

      expect(item).toEqual({
        id: "media-123",
        workflowId: "wf-456",
        kind: "image",
        role: "sheet",
        url: "https://example.com/render.png",
        thumbUrl: null,
        width: 1024,
        height: 768,
        status: "ready",
        error: null,
        name: "Hero Render",
        owner: {
          type: "workflow",
          id: "wf-456",
        },
        raw,
      });
    });

    it("correctly identifies video items by extension and flag", () => {
      const videoItem = toMediaItem({
        id: "v-1",
        workflowId: "wf-1",
        url: "https://example.com/animation.mp4",
        status: "completed",
      });

      expect(videoItem.kind).toBe("video");
    });

    it("respects placement context overrides for workflowId and role", () => {
      const raw = {
        id: "shared-asset-1",
        workflow_id: "home-wf",
        url: "https://example.com/pic.jpg",
        status: "ready",
      };

      const item = toMediaItem(raw, {
        workflowId: "character-wf",
        role: "detail",
        owner: { type: "character", id: "char-9" },
      });

      expect(item.workflowId).toBe("character-wf");
      expect(item.role).toBe("detail");
      expect(item.owner).toEqual({ type: "character", id: "char-9" });
    });
  });
});
