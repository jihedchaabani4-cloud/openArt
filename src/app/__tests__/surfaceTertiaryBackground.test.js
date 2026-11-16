import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Root Body Background Token (--body-bg #0E1015)", () => {
  const globalsCssPath = path.resolve(__dirname, "../globals.css");

  it("registers --body-bg as #0E1015 in globals.css", () => {
    const globalsContent = fs.readFileSync(globalsCssPath, "utf-8");
    expect(globalsContent).toMatch(/--body-bg:\s*#0E1015;/);
  });

  it("applies --body-bg to html element in globals.css", () => {
    const globalsContent = fs.readFileSync(globalsCssPath, "utf-8");
    expect(globalsContent).toMatch(/html\s*\{[^}]*background-color:\s*var\(--body-bg\);/);
  });
});
