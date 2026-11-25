import { describe, it, expect, vi } from "vitest";
import {
  getItemMetadata,
  getCachedImageDimensions,
  STUDIO_GRID_CONFIG,
  STUDIO_GRID_SPACING_CONFIG,
  getStudioGridDensity,
  getStudioGridSpacingPx,
  getResponsiveTargetRowHeight,
  setCachedImageDimensions,
  subscribeImageDimensions,
  parseAspectRatioValue,
  normalizeCssAspectRatio,
} from "./displayUtils";

describe("displayUtils - getItemMetadata aspect ratio resolution", () => {
  it("resolves aspect ratio from item.generationConfig.ratio when present", () => {
    const item = {
      id: "media-1",
      file_url: "https://example.com/item.png",
      status: "completed",
      generationConfig: {
        ratio: "16:9",
        prompt: "A beautiful scenery",
      },
      image: {
        dimensions: { width: 1024, height: 1024 }, // placeholder square dimensions
      },
    };
    const workflow = {
      id: "wf-1",
      workflow_type: "GENERATION",
    };

    const meta = getItemMetadata(item, workflow);
    expect(meta.aspect).toBe("16/9");
  });

  it("resolves aspect ratio from workflow.metadata.generationConfig.ratio for element sheets", () => {
    const item = {
      id: "elem-item-1",
      file_url: "https://example.com/sheet.png",
      status: "completed",
      workflowStepId: "CAE",
    };
    const workflow = {
      id: "wf-elem-1",
      workflow_type: "ELEMENT_SHEET",
      metadata: {
        generationConfig: {
          ratio: "16:9",
        },
      },
    };

    const meta = getItemMetadata(item, workflow);
    expect(meta.aspect).toBe("16/9");
  });

  it("resolves aspect ratio from group.generationConfig.ratio", () => {
    const item = {
      id: "item-2",
      file_url: "https://example.com/char.png",
      status: "completed",
    };
    const workflow = {
      id: "wf-char-1",
      workflow_type: "CHARACTER",
      generationConfig: {
        ratio: "9:16",
      },
    };

    const meta = getItemMetadata(item, workflow);
    expect(meta.aspect).toBe("9/16");
  });

  it("preserves processing status even when item was created more than 10 minutes ago", () => {
    const item = {
      id: "proc-1",
      status: "processing",
      create_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    };
    const workflow = {
      id: "wf-proc",
      workflow_type: "CHARACTER",
      status: "processing",
    };

    const meta = getItemMetadata(item, workflow);
    expect(meta.status).toBe("processing");
  });

  it("defaults aspect ratio to 16/9 for character workflows without cached dimensions or explicit config", () => {
    const item = {
      id: "char-item-default",
      status: "processing",
      role: "sheet",
    };
    const workflow = {
      id: "wf-char-default",
      workflow_type: "CHARACTER",
      status: "processing",
    };

    const meta = getItemMetadata(item, workflow);
    expect(meta.aspect).toBe("16/9");
  });

  it("ignores non-ratio strings like 'auto' and falls back to item's real dimensions", () => {
    const item = {
      id: "auto-item",
      url: "https://example.com/auto-item.png",
      status: "completed",
      aspectRatio: "auto",
      image: { dimensions: { width: 736, height: 1308 } },
    };

    const meta = getItemMetadata(item);
    expect(meta.aspect).toBe("736/1308");
  });

  it("supports snake_case aspect_ratio and WxH ratio strings without misparsing", () => {
    const snakeMeta = getItemMetadata({
      id: "snake-1",
      url: "https://example.com/snake.png",
      status: "processing",
      aspect_ratio: "9:16",
    });
    expect(snakeMeta.aspect).toBe("9/16");

    expect(parseAspectRatioValue("9x16")?.ratio).toBeCloseTo(9 / 16, 4);
    expect(normalizeCssAspectRatio("9:16")).toBe("9/16");
    expect(normalizeCssAspectRatio("auto")).toBeNull();
  });

  it("prefers an item's own real pixel dimensions over parent workflow ratio", () => {
    const workflow = {
      id: "wf-char-parent",
      workflow_type: "CHARACTER_SHEET",
      generationConfig: { ratio: "16:9" },
    };
    const detailItem = {
      id: "detail-portrait",
      url: "https://example.com/detail-portrait.png",
      status: "completed",
      role: "detail",
      width: 736,
      height: 1308,
    };

    const meta = getItemMetadata(detailItem, workflow);
    expect(meta.aspect).toBe("736/1308");
  });

  it("does not force 16/9 sheet fallback on character detail items without dimensions", () => {
    const workflow = { id: "wf-char-only", workflow_type: "CHARACTER" };
    const detailItem = {
      id: "detail-no-dims",
      url: "https://example.com/detail-no-dims.png",
      status: "completed",
      role: "detail",
    };

    const meta = getItemMetadata(detailItem, workflow);
    expect(meta.aspect).toBeNull();
  });

  it("preserves cached dimensions across signed URL auth-token refreshes", () => {
    const urlV1 = "https://storage.supabase.co/storage/v1/object/sign/media/signed-test.png?token=aaa&Expires=100";
    const urlV2 = "https://storage.supabase.co/storage/v1/object/sign/media/signed-test.png?token=bbb&Expires=200";

    setCachedImageDimensions(urlV1, 736, 1308);
    expect(getCachedImageDimensions(urlV2)).toMatchObject({ width: 736, height: 1308, aspect: "736/1308" });
  });

  describe("STUDIO_GRID_CONFIG & STUDIO_GRID_SPACING_CONFIG - Space between media (S/M/L)", () => {
    it("maps spacing options to pixels: S=4px, M=8px, L=16px", () => {
      expect(STUDIO_GRID_SPACING_CONFIG.sm.px).toBe(4);
      expect(getStudioGridSpacingPx("sm")).toBe(4);

      expect(STUDIO_GRID_SPACING_CONFIG.md.px).toBe(8);
      expect(getStudioGridSpacingPx("md")).toBe(8);

      expect(STUDIO_GRID_SPACING_CONFIG.lg.px).toBe(16);
      expect(getStudioGridSpacingPx("lg")).toBe(16);
    });

    it("evaluates getStudioGridDensity with dynamic gridSpacing (default sm = 4px)", () => {
      expect(getStudioGridDensity("md", "sm").spacing).toBe(4);
      expect(getStudioGridDensity("md", "md").spacing).toBe(8);
      expect(getStudioGridDensity("md", "lg").spacing).toBe(16);

      // Default calls
      expect(getStudioGridDensity().spacing).toBe(4);
      expect(getStudioGridDensity("sm").spacing).toBe(4);
    });

    it("calibrates S/M/L target row heights and min/max bounds", () => {
      expect(STUDIO_GRID_CONFIG.sm).toMatchObject({
        targetRowHeight: 190,
        minRowHeight: 130,
        maxRowHeight: 240,
        maxRowHeightMultiplier: 1.25,
      });
      expect(STUDIO_GRID_CONFIG.md).toMatchObject({
        targetRowHeight: 280,
        minRowHeight: 190,
        maxRowHeight: 350,
        maxRowHeightMultiplier: 1.25,
      });
      expect(STUDIO_GRID_CONFIG.lg).toMatchObject({
        targetRowHeight: 400,
        minRowHeight: 260,
        maxRowHeight: 490,
        maxRowHeightMultiplier: 1.25,
      });
    });

    it("scales target row height responsively across viewport widths", () => {
      expect(getResponsiveTargetRowHeight(280, 500)).toBe(Math.round(280 * 0.72));
      expect(getResponsiveTargetRowHeight(280, 700)).toBe(Math.round(280 * 0.78));
      expect(getResponsiveTargetRowHeight(280, 900)).toBe(Math.round(280 * 0.88));
      expect(getResponsiveTargetRowHeight(280, 1280)).toBe(280);
      expect(getResponsiveTargetRowHeight(280, 2000)).toBe(Math.round(280 * 1.12));
    });

    it("notifies subscribeImageDimensions listeners on first measurement and >3% ratio changes only", () => {
      const listener = vi.fn();
      const unsubscribe = subscribeImageDimensions(listener);
      const url = "https://example.com/sub-test-ratio.png";

      // First measurement -> notifies
      setCachedImageDimensions(url, 1000, 1000);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith(url, 1000, 1000);

      // Within 3% ratio change (1.02 vs 1.00 = 2%) -> suppressed
      setCachedImageDimensions(url, 1020, 1000);
      expect(listener).toHaveBeenCalledTimes(1);

      // Greater than 3% ratio change (16:9 vs 1.02) -> notifies
      setCachedImageDimensions(url, 1600, 900);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith(url, 1600, 900);

      // Unsubscribe stops future notifications
      unsubscribe();
      setCachedImageDimensions(url, 900, 1600);
      expect(listener).toHaveBeenCalledTimes(2);
    });
  });
});
