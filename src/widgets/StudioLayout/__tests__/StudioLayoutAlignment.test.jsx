import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { render } from "@testing-library/react";
import fs from "fs";
import path from "path";
import { LeftNavigationRail } from "../LeftNavigationRail";

// Mock router & store
let mockNavbarHidden = false;

vi.mock("next/navigation", () => ({
  usePathname: () => "/cinema-studio/proj-1/assets",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/workflows", () => ({
  useWorkflowsStore: (selector) =>
    selector({
      selectedProjectId: "proj-1",
      isNavbarHidden: mockNavbarHidden,
    }),
}));

vi.mock("@/features/characters", () => ({
  useCharacterWorkflows: () => ({ workflows: [] }),
}));

vi.mock("@/features/elements", () => ({
  useElementSheetWorkflows: () => ({ workflows: [] }),
}));

describe("LeftNavigationRail & Media Grid Baseline Alignment", () => {
  it("LeftNavigationRail aside removes py-3 / pt-3 and uses pt-0 so menu items sit higher", () => {
    mockNavbarHidden = false;
    const { container } = render(<LeftNavigationRail />);
    const aside = container.querySelector("aside");
    expect(aside).toBeDefined();

    // Must NOT have py-3 or pt-3 which adds unwanted top gap
    expect(aside.className).not.toContain("py-3");
    expect(aside.className).toContain("pt-0");
  });

  it("LeftNavigationRail top spacer animates to 56px when navbar is visible", () => {
    mockNavbarHidden = false;
    const railFile = fs.readFileSync(
      path.resolve(__dirname, "../LeftNavigationRail.jsx"),
      "utf8"
    );
    // Spacer height must be 56 when navbar is visible (isNavbarHidden ? ... : 56)
    expect(railFile).toMatch(/animate=\{\{\s*height:\s*isNavbarHidden\s*\?\s*\d+\s*:\s*56\s*\}\}/);
  });

  it("Media grid scroll containers use pt-[56px] and remove py-3 / pt-4 across all studio views", () => {
    const assetsFile = fs.readFileSync(
      path.resolve(__dirname, "../../../app/cinema-studio/[projectId]/assets/page.js"),
      "utf8"
    );
    const collectionFile = fs.readFileSync(
      path.resolve(__dirname, "../../../app/cinema-studio/[projectId]/collection/[collectionId]/page.js"),
      "utf8"
    );
    const elementsFile = fs.readFileSync(
      path.resolve(__dirname, "../../../app/cinema-studio/[projectId]/elements/page.js"),
      "utf8"
    );
    const charactersFile = fs.readFileSync(
      path.resolve(__dirname, "../../../app/cinema-studio/[projectId]/characters/page.js"),
      "utf8"
    );

    // Assets page: pt-[56px], no py-3
    expect(assetsFile).toContain("pt-[56px]");
    expect(assetsFile).not.toMatch(/pt-\[72px\]/);
    expect(assetsFile).not.toMatch(/pt-\[56px\][^\n]*\bpy-3\b/);

    // Collection page: pt-[56px], no py-3
    expect(collectionFile).toContain("pt-[56px]");
    expect(collectionFile).not.toMatch(/pt-\[72px\]/);
    expect(collectionFile).not.toMatch(/pt-\[56px\][^\n]*\bpy-3\b/);

    // Elements page: pt-[56px], no py-3, no pt-4 on grid
    expect(elementsFile).toContain("pt-[56px]");
    expect(elementsFile).not.toMatch(/pt-\[72px\]/);
    expect(elementsFile).not.toMatch(/pt-\[56px\][^\n]*\bpy-3\b/);
    expect(elementsFile).not.toMatch(/pb-32\s+pt-4/);

    // Characters page: pt-[56px], no py-3, no pt-4 on grid
    expect(charactersFile).toContain("pt-[56px]");
    expect(charactersFile).not.toMatch(/pt-\[72px\]/);
    expect(charactersFile).not.toMatch(/pt-\[56px\][^\n]*\bpy-3\b/);
    expect(charactersFile).not.toMatch(/pb-32\s+pt-4/);
  });
});
