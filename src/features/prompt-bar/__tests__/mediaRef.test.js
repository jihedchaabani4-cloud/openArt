/**
 * Contract tests for mediaRef pure helpers (Task C2).
 */

import { describe, it, expect } from "vitest";
import {
  getAssetId,
  sameAsset,
  isPersistableMedia,
  describeMedia,
  resolveMediaUrl,
} from "../core/mediaRef.js";

describe("C2: mediaRef Contract", () => {
  describe("resolveMediaUrl", () => {
    it("extracts URL from string", () => {
      expect(resolveMediaUrl("https://example.com/a.png")).toBe("https://example.com/a.png");
    });

    it("extracts URL from various object shapes", () => {
      expect(resolveMediaUrl({ url: "https://example.com/url.png" })).toBe("https://example.com/url.png");
      expect(resolveMediaUrl({ preview: "https://example.com/prev.png" })).toBe("https://example.com/prev.png");
      expect(resolveMediaUrl({ file_url: "https://example.com/file.png" })).toBe("https://example.com/file.png");
      expect(resolveMediaUrl({ thumbnail: "https://example.com/thumb.png" })).toBe("https://example.com/thumb.png");
      expect(resolveMediaUrl({ image: { url: "https://example.com/img.png" } })).toBe("https://example.com/img.png");
      expect(resolveMediaUrl({ video: { url: "https://example.com/vid.mp4" } })).toBe("https://example.com/vid.mp4");
      expect(resolveMediaUrl({ rawValue: { preview: "https://example.com/raw.png" } })).toBe("https://example.com/raw.png");
    });

    it("returns empty string for null, undefined, or empty object", () => {
      expect(resolveMediaUrl(null)).toBe("");
      expect(resolveMediaUrl(undefined)).toBe("");
      expect(resolveMediaUrl({})).toBe("");
    });
  });
  describe("getAssetId", () => {
    it("extracts ID from string", () => {
      expect(getAssetId("wf_123")).toBe("wf_123");
    });

    it("extracts ID from various object shapes", () => {
      expect(getAssetId({ workflow_id: "wf_1" })).toBe("wf_1");
      expect(getAssetId({ workflowId: "wf_2" })).toBe("wf_2");
      expect(getAssetId({ id: "item_3" })).toBe("item_3");
      expect(getAssetId({ asset_id: "asset_4" })).toBe("asset_4");
      expect(getAssetId({ assetId: "asset_5" })).toBe("asset_5");
      expect(getAssetId({ ref_media_id: "ref_6" })).toBe("ref_6");
      expect(getAssetId({ url: "https://example.com/asset.png" })).toBe("https://example.com/asset.png");
    });

    it("returns null for falsy or empty values", () => {
      expect(getAssetId(null)).toBe(null);
      expect(getAssetId(undefined)).toBe(null);
      expect(getAssetId("")).toBe(null);
      expect(getAssetId({})).toBe(null);
    });
  });

  describe("sameAsset", () => {
    it("returns true for identical references", () => {
      expect(sameAsset("wf_123", "wf_123")).toBe(true);
      expect(sameAsset({ id: "a1" }, { id: "a1" })).toBe(true);
      expect(sameAsset("wf_123", { workflow_id: "wf_123" })).toBe(true);
      expect(sameAsset({ workflow_id: "wf_123" }, "wf_123")).toBe(true);
    });

    it("matches by url when no ID matches", () => {
      expect(
        sameAsset(
          { url: "https://cdn.example.com/pic.jpg" },
          { preview: "https://cdn.example.com/pic.jpg" }
        )
      ).toBe(true);
    });

    it("returns false for distinct assets or falsy inputs", () => {
      expect(sameAsset("wf_1", "wf_2")).toBe(false);
      expect(sameAsset({ id: "wf_1" }, { id: "wf_2" })).toBe(false);
      expect(sameAsset(null, "wf_1")).toBe(false);
      expect(sameAsset("wf_1", undefined)).toBe(false);
    });
  });

  describe("isPersistableMedia", () => {
    it("returns true for string IDs and persistent objects", () => {
      expect(isPersistableMedia("wf_persistent_123")).toBe(true);
      expect(
        isPersistableMedia({
          workflow_id: "wf_123",
          url: "https://s3.amazonaws.com/bucket/image.png",
        })
      ).toBe(true);
      expect(
        isPersistableMedia({
          id: "asset_789",
          preview: "https://cdn.example.com/preview.webp",
        })
      ).toBe(true);
    });

    it("returns false for blob: and data: URLs", () => {
      expect(isPersistableMedia("blob:http://localhost:3000/1234-5678")).toBe(false);
      expect(isPersistableMedia("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==")).toBe(false);
      expect(
        isPersistableMedia({
          workflow_id: "wf_temp",
          url: "blob:http://localhost:3000/test-blob",
        })
      ).toBe(false);
      expect(
        isPersistableMedia({
          id: "temp",
          preview: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        })
      ).toBe(false);
    });

    it("returns false for Blob and File instances", () => {
      const mockBlob = new Blob(["test"], { type: "text/plain" });
      expect(isPersistableMedia(mockBlob)).toBe(false);

      const mockFile = new File(["test"], "test.png", { type: "image/png" });
      expect(isPersistableMedia(mockFile)).toBe(false);
    });

    it("returns false for null, undefined, or empty values", () => {
      expect(isPersistableMedia(null)).toBe(false);
      expect(isPersistableMedia(undefined)).toBe(false);
      expect(isPersistableMedia("")).toBe(false);
    });
  });

  describe("describeMedia", () => {
    it("describes media id and kind without exposing URLs", () => {
      expect(describeMedia("wf_123")).toBe("id:wf_123");
      expect(describeMedia({ workflow_id: "wf_456", is_character: true })).toBe("character:wf_456");
      expect(describeMedia({ id: "wf_elem", type: "element" })).toBe("element:wf_elem");
      expect(describeMedia({ workflow_id: "wf_789", url: "https://secret.cdn.com/asset.png" })).toBe("media:wf_789");
    });

    it("masks raw URLs in ID to avoid leaking signed tokens", () => {
      const desc = describeMedia("https://s3.amazonaws.com/private/img.jpg?token=secret123");
      expect(desc).not.toContain("secret123");
      expect(desc).toBe("url:[media_url]");
    });

    it("returns none for falsy values", () => {
      expect(describeMedia(null)).toBe("none");
      expect(describeMedia(undefined)).toBe("none");
    });
  });
});
