import { describe, it, expect } from "vitest";
import { clampAspectRatio, computeJustifiedRows } from "../justifiedLayout";
import { STUDIO_GRID_CONFIG } from "../displayUtils";

describe("justifiedLayout - clampAspectRatio", () => {
  it("clamps extreme ratios to [0.45, 2.5] by default", () => {
    expect(clampAspectRatio(0.1)).toBe(0.45);
    expect(clampAspectRatio(10)).toBe(2.5);
    expect(clampAspectRatio(9 / 16)).toBeCloseTo(0.5625, 4);
    expect(clampAspectRatio(1)).toBe(1);
    expect(clampAspectRatio(16 / 9)).toBeCloseTo(16 / 9, 4);
    expect(clampAspectRatio(21 / 9)).toBeCloseTo(21 / 9, 4);
  });

  it("falls back safely for NaN, 0, negative, or non-finite values", () => {
    expect(clampAspectRatio(NaN)).toBe(1);
    expect(clampAspectRatio(0)).toBe(1);
    expect(clampAspectRatio(-1.5)).toBe(1);
    expect(clampAspectRatio(Infinity)).toBe(1);
    expect(clampAspectRatio(null)).toBe(1);
    expect(clampAspectRatio(undefined)).toBe(1);
  });
});

describe("justifiedLayout - computeJustifiedRows", () => {
  it("returns empty rows for empty items or invalid containerWidth", () => {
    expect(computeJustifiedRows([], 1200)).toEqual({ rows: [] });
    expect(computeJustifiedRows([{ aspectRatio: 1 }], 0)).toEqual({ rows: [] });
    expect(computeJustifiedRows([{ aspectRatio: 1 }], -400)).toEqual({ rows: [] });
    expect(computeJustifiedRows([{ aspectRatio: 1 }], NaN)).toEqual({ rows: [] });
  });

  it("fills 100% edge-to-edge on every full row with mixed 9:16, 1:1, and 16:9 items", () => {
    const containerWidth = 1200;
    const gap = 8;
    const items = [
      { id: "1", aspectRatio: 9 / 16 },
      { id: "2", aspectRatio: 1 },
      { id: "3", aspectRatio: 16 / 9 },
      { id: "4", aspectRatio: 16 / 9 },
      { id: "5", aspectRatio: 9 / 16 },
      { id: "6", aspectRatio: 1 },
      { id: "7", aspectRatio: 16 / 9 },
      { id: "8", aspectRatio: 1 },
      { id: "9", aspectRatio: 9 / 16 },
    ];

    const { rows } = computeJustifiedRows(items, containerWidth, {
      targetRowHeight: 280,
      gap,
    });

    expect(rows.length).toBeGreaterThanOrEqual(2);

    // Every item appears once in original order
    const flattened = rows.flatMap((r) => r.items);
    expect(flattened.map((i) => i.item.id)).toEqual(items.map((i) => i.id));
    expect(flattened.map((i) => i.index)).toEqual(items.map((_, idx) => idx));

    // Every justified row sums to exact containerWidth with zero right gap
    rows.forEach((row) => {
      const totalCardWidth = row.items.reduce((sum, entry) => sum + entry.width, 0);
      const totalGap = (row.items.length - 1) * gap;
      row.items.forEach((entry) => {
        expect(entry.height).toBe(row.height);
        expect(entry.width).toBeGreaterThan(0);
      });

      if (row.isJustified) {
        expect(totalCardWidth + totalGap).toBe(containerWidth);
      } else {
        expect(totalCardWidth + totalGap).toBeLessThanOrEqual(containerWidth);
      }
    });
  });

  it("does NOT stretch last incomplete row when fill < 72%", () => {
    const containerWidth = 1200;
    const gap = 8;
    const items = [
      // Row 0: two 2:1 items -> naturalWidth = 4 * 280 + 8 = 1128px, justified at ~298px
      { id: "1", aspectRatio: 2 },
      { id: "2", aspectRatio: 2 },
      // Last row: single portrait card (~158px wide out of 1200px = 13%)
      { id: "3", aspectRatio: 9 / 16 },
    ];

    const { rows } = computeJustifiedRows(items, containerWidth, {
      targetRowHeight: 280,
      gap,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0].isJustified).toBe(true);
    const lastRow = rows[1];
    expect(lastRow.isJustified).toBe(false);
    expect(lastRow.height).toBe(280);
    expect(lastRow.items).toHaveLength(1);
    expect(lastRow.items[0].width).toBe(Math.round(280 * (9 / 16)));
  });

  it("does NOT stretch a single-item portrait gallery into a full-width banner", () => {
    const { rows } = computeJustifiedRows(
      [{ id: "solo", aspectRatio: 9 / 16 }],
      1280,
      { targetRowHeight: 280, gap: 8 }
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].isJustified).toBe(false);
    expect(rows[0].height).toBe(280);
    expect(rows[0].items[0].width).toBe(Math.round(280 * (9 / 16)));
  });

  it("justifies last row cleanly when natural width >= 72% and justified height <= 1.25x target", () => {
    const containerWidth = 1200;
    const gap = 8;
    // Two 16:9 items at target 280px => naturalWidth = 2*(16/9)*280 + 8 = 1003.6 >= 864 (72%)
    // justifiedHeight = (1200 - 8) / (32/9) = 335.25 <= 350 (1.25 * 280)
    const items = [
      { id: "1", aspectRatio: 16 / 9 },
      { id: "2", aspectRatio: 16 / 9 },
    ];

    const { rows } = computeJustifiedRows(items, containerWidth, {
      targetRowHeight: 280,
      gap,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].isJustified).toBe(true);
    expect(rows[0].height).toBeLessThanOrEqual(Math.round(280 * 1.25));
    const totalWidth = rows[0].items.reduce((sum, i) => sum + i.width, 0) + gap;
    expect(totalWidth).toBe(containerWidth);
  });

  it("caps a single wide item on a narrow viewport so it never overflows containerWidth", () => {
    const containerWidth = 320;
    const items = [{ id: "wide", aspectRatio: 16 / 9 }];

    const { rows } = computeJustifiedRows(items, containerWidth, {
      targetRowHeight: 280,
      gap: 8,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].items[0].width).toBeLessThanOrEqual(containerWidth);
    expect(rows[0].items[0].width).toBe(containerWidth);
    expect(rows[0].height).toBe(Math.round(320 / (16 / 9)));
  });

  it("clamps extreme item aspect ratios (0.1 -> 0.45, 10 -> 2.5)", () => {
    const { rows } = computeJustifiedRows(
      [
        { id: "sliver", aspectRatio: 0.1 },
        { id: "panorama", aspectRatio: 10 },
      ],
      1200,
      { targetRowHeight: 280, gap: 8 }
    );

    const flat = rows.flatMap((r) => r.items);
    expect(flat[0].aspectRatio).toBe(0.45);
    expect(flat[1].aspectRatio).toBe(2.5);
  });

  it("produces denser rows for S than M and M than L (S/M/L density calibration)", () => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      id: `item-${i}`,
      aspectRatio: i % 3 === 0 ? 16 / 9 : i % 3 === 1 ? 1 : 9 / 16,
    }));

    const sm = computeJustifiedRows(items, 1280, {
      targetRowHeight: STUDIO_GRID_CONFIG.sm.targetRowHeight,
      gap: 8,
    });
    const md = computeJustifiedRows(items, 1280, {
      targetRowHeight: STUDIO_GRID_CONFIG.md.targetRowHeight,
      gap: 8,
    });
    const lg = computeJustifiedRows(items, 1280, {
      targetRowHeight: STUDIO_GRID_CONFIG.lg.targetRowHeight,
      gap: 8,
    });

    const avgPerRow = (res) => items.length / res.rows.length;
    expect(avgPerRow(sm)).toBeGreaterThan(avgPerRow(md));
    expect(avgPerRow(md)).toBeGreaterThan(avgPerRow(lg));
  });
});
