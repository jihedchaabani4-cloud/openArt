import { describe, it, expect } from "vitest";
import { matchRoute, isPathAllowed, normalizePathSegments } from "../store/routePolicy.js";

describe("routePolicy — Pure Route Matching (PB-D-14 / W2a)", () => {
  describe("normalizePathSegments", () => {
    it("handles null, undefined, empty strings", () => {
      expect(normalizePathSegments(null)).toEqual([]);
      expect(normalizePathSegments(undefined)).toEqual([]);
      expect(normalizePathSegments("")).toEqual([]);
      expect(normalizePathSegments("   ")).toEqual([]);
    });

    it("strips queries, hashes, and extra slashes", () => {
      expect(normalizePathSegments("/cinema-studio/p1/assets?tab=all#top")).toEqual([
        "cinema-studio",
        "p1",
        "assets",
      ]);
      expect(normalizePathSegments("///cinema-studio///p1///")).toEqual([
        "cinema-studio",
        "p1",
      ]);
    });

    it("returns empty array for root path", () => {
      expect(normalizePathSegments("/")).toEqual([]);
      expect(normalizePathSegments("///")).toEqual([]);
    });
  });

  describe("matchRoute", () => {
    it("exact match", () => {
      expect(matchRoute("/cinema-studio/new", "/cinema-studio/new")).toBe(true);
      expect(matchRoute("/cinema-studio/new", "/cinema-studio/other")).toBe(false);
    });

    it(":param matches exactly one segment", () => {
      expect(matchRoute("/cinema-studio/:projectId/assets", "/cinema-studio/proj_123/assets")).toBe(true);
      expect(matchRoute("/cinema-studio/:projectId/assets", "/cinema-studio/proj_abc/assets")).toBe(true);
      // Fails when extra or missing segments
      expect(matchRoute("/cinema-studio/:projectId/assets", "/cinema-studio/assets")).toBe(false);
      expect(matchRoute("/cinema-studio/:projectId/assets", "/cinema-studio/p1/sub/assets")).toBe(false);
    });

    it("trailing /* matches that path and anything below it", () => {
      const pattern = "/cinema-studio/:projectId/collection/*";
      expect(matchRoute(pattern, "/cinema-studio/p1/collection")).toBe(true);
      expect(matchRoute(pattern, "/cinema-studio/p1/collection/col-456")).toBe(true);
      expect(matchRoute(pattern, "/cinema-studio/p1/collection/col-456/item-789")).toBe(true);
      expect(matchRoute(pattern, "/cinema-studio/p1/other")).toBe(false);
    });

    it("/collection does not match /collections", () => {
      expect(matchRoute("/collection", "/collections")).toBe(false);
      expect(matchRoute("/cinema-studio/:projectId/collection", "/cinema-studio/p1/collections")).toBe(false);
      expect(matchRoute("/cinema-studio/:projectId/collection/*", "/cinema-studio/p1/collections")).toBe(false);
      expect(matchRoute("/cinema-studio/:projectId/collection/*", "/cinema-studio/p1/collections/col-1")).toBe(false);
    });

    it("trailing slash is ignored", () => {
      expect(matchRoute("/cinema-studio/new/", "/cinema-studio/new")).toBe(true);
      expect(matchRoute("/cinema-studio/new", "/cinema-studio/new/")).toBe(true);
      expect(matchRoute("/cinema-studio/:projectId/assets/", "/cinema-studio/p1/assets/")).toBe(true);
    });

    it("query string and hash are ignored", () => {
      expect(matchRoute("/cinema-studio/new", "/cinema-studio/new?foo=bar&baz=1#section")).toBe(true);
      expect(matchRoute("/cinema-studio/:projectId/assets", "/cinema-studio/p1/assets?view=grid")).toBe(true);
    });

    it("root matches root and does not match non-root", () => {
      expect(matchRoute("/", "/")).toBe(true);
      expect(matchRoute("/", "/assets")).toBe(false);
      expect(matchRoute("/*", "/")).toBe(true);
      expect(matchRoute("/*", "/assets")).toBe(true);
    });

    it("returns false for invalid arguments", () => {
      expect(matchRoute(null, "/assets")).toBe(false);
      expect(matchRoute("/assets", null)).toBe(false);
      expect(matchRoute("", "")).toBe(false);
    });
  });

  describe("isPathAllowed", () => {
    const allowedPatterns = [
      "/cinema-studio/:projectId/assets",
      "/cinema-studio/:projectId/collection/*",
      "/cinema-studio/:projectId/collections/*",
      "/cinema-studio/new",
      "/cinema-studio/test/prompt-bar-compare",
    ];

    it("empty, null, or undefined patterns means always allowed (persist everywhere)", () => {
      expect(isPathAllowed("/anywhere/on/earth", null)).toBe(true);
      expect(isPathAllowed("/anywhere/on/earth", undefined)).toBe(true);
      expect(isPathAllowed("/anywhere/on/earth", [])).toBe(true);
    });

    it("the two real studio paths match", () => {
      expect(isPathAllowed("/cinema-studio/proj_alpha/assets", allowedPatterns)).toBe(true);
      expect(isPathAllowed("/cinema-studio/proj_alpha/collection/folder_123", allowedPatterns)).toBe(true);
      expect(isPathAllowed("/cinema-studio/proj_beta/collections/folder_456", allowedPatterns)).toBe(true);
      expect(isPathAllowed("/cinema-studio/new", allowedPatterns)).toBe(true);
    });

    it("/cinema-studio/p1/settings does not match", () => {
      expect(isPathAllowed("/cinema-studio/p1/settings", allowedPatterns)).toBe(false);
      expect(isPathAllowed("/cinema-studio/p1/profile", allowedPatterns)).toBe(false);
      expect(isPathAllowed("/dashboard", allowedPatterns)).toBe(false);
    });
  });
});
