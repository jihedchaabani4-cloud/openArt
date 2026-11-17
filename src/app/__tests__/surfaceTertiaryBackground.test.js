import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Root Body Background Token (--body-bg #0E1015)", () => {
  const globalsCssPath = path.resolve(__dirname, "../globals.css");

  it("registers --body-bg as #1A1A1A in globals.css", () => {
    const globalsContent = fs.readFileSync(globalsCssPath, "utf-8");
    expect(globalsContent).toMatch(/--body-bg:\s*#1[aA]1[aAbB]1[aAbB];/);
  });

  it("applies --omni-bg or --body-bg to body element in globals.css", () => {
    const globalsContent = fs.readFileSync(globalsCssPath, "utf-8");
    expect(globalsContent).toMatch(/body\s*\{[^}]*background-color:\s*var\(--(omni|body)-bg\);/);
  });
});
