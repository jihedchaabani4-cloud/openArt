import { describe, it, expect } from "vitest";

describe("UI Check Detection Rules (P3 Improvements)", () => {
  // Extract U1 and U4 rules matching logic from scripts/ui-check.cjs
  const u1Re = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:rgba?|hsla?)\(\s*\d|\b(?:oklch|oklab)\(/g;
  const u4Re = /\bfetch\s*\(/g;
  const u4SliceFilter = (r) => /(^|\/)(components|features|widgets)\//.test(r);

  describe("Rule U1: Color literals including modern CSS Color 4 (oklch, oklab)", () => {
    it("detects standard hex codes", () => {
      const line = 'color: "#282a2c", background: "#fff"';
      const matches = line.match(u1Re);
      expect(matches).toHaveLength(2);
      expect(matches).toContain("#282a2c");
      expect(matches).toContain("#fff");
    });

    it("detects rgba and hsla functions", () => {
      const line = "background: rgba(22, 23, 24, 0.9); color: hsl(200, 50%, 50%);";
      const matches = line.match(u1Re);
      expect(matches).toBeDefined();
      expect(matches?.length).toBeGreaterThanOrEqual(2);
    });

    it("detects oklch() color function literals", () => {
      const line = 'className="bg-[oklch(26.9%_0_0)] text-[oklch(31%_0.005_260)]"';
      const matches = line.match(u1Re);
      expect(matches).toBeDefined();
      expect(matches).toHaveLength(2);
      expect(matches?.[0]).toBe("oklch(");
      expect(matches?.[1]).toBe("oklch(");
    });

    it("detects oklab() color function literals", () => {
      const line = "const border = 'oklab(0.4 -0.01 -0.04)';";
      const matches = line.match(u1Re);
      expect(matches).toBeDefined();
      expect(matches?.[0]).toBe("oklab(");
    });
  });

  describe("Rule U4: fetch() detection across slices", () => {
    it("detects raw fetch calls", () => {
      expect("const res = await fetch('/api/data');".match(u4Re)).not.toBeNull();
      expect("fetch(url).then(...)".match(u4Re)).not.toBeNull();
    });

    it("does not false-positive on refetch()", () => {
      expect("onClick={() => refetch()}".match(u4Re)).toBeNull();
      expect("const { data, refetch } = useQuery()".match(u4Re)).toBeNull();
    });

    it("flags files within src/components, src/features, and src/widgets", () => {
      expect(u4SliceFilter("src/components/LoginDialog.jsx")).toBe(true);
      expect(u4SliceFilter("src/features/payments/ui/PackageSelectionDialog.jsx")).toBe(true);
      expect(u4SliceFilter("src/widgets/StudioNavbar/StudioNavbar.jsx")).toBe(true);
    });

    it("preserves exclusions outside target slices", () => {
      expect(u4SliceFilter("src/shared/api/client.js")).toBe(false);
      expect(u4SliceFilter("src/shared/lib/logger.js")).toBe(false);
    });
  });
});
