import { describe, expect, it } from "vitest";
import {
  getMediaItemId,
  getWorkflowId,
  isVideoUrl,
  getWorkflowThumbInfo,
  isWorkflowTrashed,
  resolveActiveWorkflowItem,
  resolveEditPreviewUrl,
  resolveWorkflowDisplayTitle,
} from "../assetEditHelpers";

describe("assetEditHelpers", () => {
  describe("getMediaItemId", () => {
    it("resolves id, then media_id, then name, or null", () => {
      expect(getMediaItemId({ id: "m-1", media_id: "m-2", name: "m-3" })).toBe("m-1");
      expect(getMediaItemId({ media_id: "m-2", name: "m-3" })).toBe("m-2");
      expect(getMediaItemId({ name: "m-3" })).toBe("m-3");
      expect(getMediaItemId({})).toBeNull();
      expect(getMediaItemId(null)).toBeNull();
      expect(getMediaItemId(undefined)).toBeNull();
    });
  });

  describe("getWorkflowId", () => {
    it("resolves id, then name, or null", () => {
      expect(getWorkflowId({ id: "wf-1", name: "wf-name" })).toBe("wf-1");
      expect(getWorkflowId({ name: "wf-name" })).toBe("wf-name");
      expect(getWorkflowId({})).toBeNull();
      expect(getWorkflowId(null)).toBeNull();
    });
  });

  describe("isVideoUrl", () => {
    it("detects mp4, webm, mov, m4v extensions case-insensitively with optional query params", () => {
      expect(isVideoUrl("https://cdn.example.com/clip.mp4")).toBe(true);
      expect(isVideoUrl("https://cdn.example.com/clip.WEBM?token=abc")).toBe(true);
      expect(isVideoUrl("https://cdn.example.com/clip.mov?v=2")).toBe(true);
      expect(isVideoUrl("https://cdn.example.com/clip.m4v")).toBe(true);
    });

    it("returns false for image urls, non-strings, and non-matching paths", () => {
      expect(isVideoUrl("https://cdn.example.com/frame.png")).toBe(false);
      expect(isVideoUrl("https://cdn.example.com/frame.webp?mp4=1")).toBe(false);
      expect(isVideoUrl("https://cdn.example.com/mp4/frame.jpg")).toBe(false);
      expect(isVideoUrl("")).toBe(false);
      expect(isVideoUrl(null)).toBe(false);
      expect(isVideoUrl(123)).toBe(false);
    });
  });

  describe("getWorkflowThumbInfo", () => {
    it("returns empty info for null or empty workflows", () => {
      expect(getWorkflowThumbInfo(null)).toEqual({
        isVideo: false,
        posterUrl: null,
        url: null,
      });
      expect(getWorkflowThumbInfo({ id: "wf-empty", items: [] })).toEqual({
        isVideo: false,
        posterUrl: null,
        url: null,
      });
    });

    it("extracts image primary url and non-video posterUrl", () => {
      const wf = {
        id: "wf-img",
        items: [
          {
            id: "m-1",
            status: "completed",
            url: "https://cdn.example.com/photo.png",
            thumb_url: "https://cdn.example.com/photo-thumb.jpg",
          },
        ],
      };

      expect(getWorkflowThumbInfo(wf)).toEqual({
        isVideo: false,
        posterUrl: "https://cdn.example.com/photo-thumb.jpg",
        url: "https://cdn.example.com/photo.png",
      });
    });

    it("detects video primary media and omits video urls from posterUrl", () => {
      const wfWithPoster = {
        id: "wf-vid-poster",
        items: [
          {
            id: "v-1",
            type: "video",
            status: "completed",
            url: "https://cdn.example.com/render.mp4",
            thumb_url: "https://cdn.example.com/poster.jpg",
          },
        ],
      };
      expect(getWorkflowThumbInfo(wfWithPoster)).toEqual({
        isVideo: true,
        posterUrl: "https://cdn.example.com/poster.jpg",
        url: "https://cdn.example.com/render.mp4",
      });

      const wfVideoOnly = {
        id: "wf-vid-only",
        items: [
          {
            id: "v-2",
            type: "video",
            status: "completed",
            url: "https://cdn.example.com/render.mp4",
            thumb_url: "https://cdn.example.com/render.mp4",
          },
        ],
      };
      expect(getWorkflowThumbInfo(wfVideoOnly)).toEqual({
        isVideo: true,
        posterUrl: null,
        url: "https://cdn.example.com/render.mp4",
      });
    });

    it("falls back to scanning workflow items when primary has no url", () => {
      const wf = {
        id: "wf-fallback",
        primary_media_id: "m-pending",
        items: [
          { id: "m-pending", status: "processing", url: null },
          {
            id: "m-ready",
            status: "completed",
            url: "https://cdn.example.com/fallback.png",
          },
        ],
      };

      const info = getWorkflowThumbInfo(wf);
      expect(info.isVideo).toBe(false);
      expect(info.url).toBe("https://cdn.example.com/fallback.png");
    });
  });

  describe("isWorkflowTrashed", () => {
    it("returns true for any soft-delete marker or trashed status", () => {
      expect(isWorkflowTrashed({ deleted_at: "2026-01-01T00:00:00Z" })).toBe(true);
      expect(isWorkflowTrashed({ deletedAt: "2026-01-01T00:00:00Z" })).toBe(true);
      expect(isWorkflowTrashed({ trashed_at: "2026-01-01T00:00:00Z" })).toBe(true);
      expect(isWorkflowTrashed({ is_deleted: true })).toBe(true);
      expect(isWorkflowTrashed({ status: "trashed" })).toBe(true);
    });

    it("returns false for active or missing workflows", () => {
      expect(isWorkflowTrashed({ id: "wf-1", status: "completed" })).toBe(false);
      expect(isWorkflowTrashed({ id: "wf-2", is_deleted: false })).toBe(false);
      expect(isWorkflowTrashed(null)).toBe(false);
    });
  });

  describe("resolveActiveWorkflowItem", () => {
    const itemA = { id: "m-a", url: "https://cdn.example.com/a.png" };
    const itemB = { media_id: "m-b", url: "https://cdn.example.com/b.png" };
    const workflow = { id: "wf-1", status: "completed", items: [itemA, itemB] };

    it("returns null when workflow is missing", () => {
      expect(resolveActiveWorkflowItem(null, "m-a", { raw: itemA })).toBeNull();
    });

    it("prefers the item matching selectedItemId", () => {
      expect(resolveActiveWorkflowItem(workflow, "m-b", { raw: itemA })).toBe(itemB);
    });

    it("falls back to resolvedPrimary.raw or resolvedPrimary when selectedItemId does not match", () => {
      expect(resolveActiveWorkflowItem(workflow, "missing-id", { raw: itemA })).toBe(itemA);
      const directPrimary = { id: "primary-direct", url: "https://cdn.example.com/p.png" };
      expect(resolveActiveWorkflowItem(workflow, null, directPrimary)).toBe(directPrimary);
    });

    it("falls back to a placeholder item when neither selection nor primary exists", () => {
      expect(resolveActiveWorkflowItem({ id: "wf-pending" }, null, null)).toEqual({
        id: "wf-pending",
        status: "processing",
        url: null,
      });
      expect(
        resolveActiveWorkflowItem({ name: "wf-failed", status: "failed" }, null, null)
      ).toEqual({
        id: "wf-failed",
        status: "failed",
        url: null,
      });
    });
  });

  describe("resolveEditPreviewUrl", () => {
    it("prefers activeMeta.url, then resolvedPrimary thumbUrl/url, then workflow items", () => {
      expect(
        resolveEditPreviewUrl({
          activeMeta: { url: "https://cdn.example.com/active.png" },
          resolvedPrimary: {
            thumbUrl: "https://cdn.example.com/thumb.png",
            url: "https://cdn.example.com/primary.png",
          },
          workflow: { items: [{ url: "https://cdn.example.com/item.png" }] },
        })
      ).toBe("https://cdn.example.com/active.png");

      expect(
        resolveEditPreviewUrl({
          activeMeta: null,
          resolvedPrimary: {
            thumbUrl: "https://cdn.example.com/thumb.png",
            url: "https://cdn.example.com/primary.png",
          },
          workflow: null,
        })
      ).toBe("https://cdn.example.com/thumb.png");

      expect(
        resolveEditPreviewUrl({
          activeMeta: null,
          resolvedPrimary: { url: "https://cdn.example.com/primary.png" },
          workflow: null,
        })
      ).toBe("https://cdn.example.com/primary.png");

      expect(
        resolveEditPreviewUrl({
          activeMeta: null,
          resolvedPrimary: null,
          workflow: {
            items: [
              { id: "m-1", url: null },
              { id: "m-2", url: "https://cdn.example.com/item2.png" },
            ],
          },
        })
      ).toBe("https://cdn.example.com/item2.png");
    });

    it("returns null when no preview url is available", () => {
      expect(resolveEditPreviewUrl()).toBeNull();
      expect(resolveEditPreviewUrl({ activeMeta: null, resolvedPrimary: null, workflow: { items: [] } })).toBeNull();
    });
  });

  describe("resolveWorkflowDisplayTitle", () => {
    it("prefers display_name, then metadata.displayName, then default fallback", () => {
      expect(
        resolveWorkflowDisplayTitle({
          display_name: "Hero Shot",
          metadata: { displayName: "Fallback Name" },
        })
      ).toBe("Hero Shot");
      expect(
        resolveWorkflowDisplayTitle({ metadata: { displayName: "Meta Name" } })
      ).toBe("Meta Name");
      expect(resolveWorkflowDisplayTitle({})).toBe("Untitled Workflow");
      expect(resolveWorkflowDisplayTitle(null)).toBe("Untitled Workflow");
    });
  });
});
