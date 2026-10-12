import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { render } from "@testing-library/react";
import fs from "fs";
import path from "path";
import { LeftNavigationRail } from "../LeftNavigationRail";
import { NavbarCore } from "@/widgets/NavbarCore";

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
  it("LeftNavigationRail aside removes py-3 / pt-3 and uses pt-0 so menu items sit cleanly under spacer", () => {
    mockNavbarHidden = false;
    const { container } = render(<LeftNavigationRail />);
    const aside = container.querySelector("aside");
    expect(aside).toBeDefined();

    expect(aside.className).not.toContain("py-3");
    expect(aside.className).toContain("pt-0");
  });

  it("LeftNavigationRail top spacer animates to 72px when navbar is visible", () => {
    mockNavbarHidden = false;
    const railFile = fs.readFileSync(
      path.resolve(__dirname, "../LeftNavigationRail.jsx"),
      "utf8"
    );
    // Spacer height must be 72 when navbar is visible (isNavbarHidden ? ... : 72)
    expect(railFile).toMatch(/animate=\{\{\s*height:\s*isNavbarHidden\s*\?\s*\d+\s*:\s*72\s*\}\}/);
  });

  it("Media grid scroll containers use pt-[72px] and remove py-3 / pt-4 across all studio views", () => {
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

    // Assets page: pt-[72px], no py-3
    expect(assetsFile).toContain("pt-[72px]");
    expect(assetsFile).not.toMatch(/pt-\[64px\]/);
    expect(assetsFile).not.toMatch(/pt-\[72px\][^\n]*\bpy-3\b/);

    // Collection page: pt-[72px], no py-3
    expect(collectionFile).toContain("pt-[72px]");
    expect(collectionFile).not.toMatch(/pt-\[64px\]/);
    expect(collectionFile).not.toMatch(/pt-\[72px\][^\n]*\bpy-3\b/);

    // Elements page: pt-[72px], no py-3, no pt-4 on grid
    expect(elementsFile).toContain("pt-[72px]");
    expect(elementsFile).not.toMatch(/pt-\[64px\]/);
    expect(elementsFile).not.toMatch(/pt-\[72px\][^\n]*\bpy-3\b/);
    expect(elementsFile).not.toMatch(/pb-32\s+pt-4/);

    // Characters page: pt-[72px], no py-3, no pt-4 on grid
    expect(charactersFile).toContain("pt-[72px]");
    expect(charactersFile).not.toMatch(/pt-\[64px\]/);
    expect(charactersFile).not.toMatch(/pt-\[72px\][^\n]*\bpy-3\b/);
    expect(charactersFile).not.toMatch(/pb-32\s+pt-4/);
  });
});

describe("EditNavbar & NavbarCore matches StudioNavbar layout", () => {
  it("removes px-6 padding and matches StudioNavbar pl-3, transparent background, and borderless design", () => {
    const { container } = render(
      <NavbarCore onBack={vi.fn()} backLabel="Back" showUserDropdown={false} left={<span>Edit Item</span>} />
    );

    const nav = container.querySelector("nav");
    expect(nav).toBeDefined();

    // Must NOT have px-6 or border-b or bg-black/40
    expect(nav.className).not.toContain("px-6");
    expect(nav.className).not.toContain("border-b");
    expect(nav.className).not.toContain("bg-black/40");

    // Must match StudioNavbar pl-3, pr-4 / pr-6, bg-transparent
    expect(nav.className).toContain("pl-3");
    expect(nav.className).toContain("bg-transparent");
  });

  it("disables entry animation on mount by setting initial={false} without initial opacity/offset", () => {
    const navbarCoreFile = fs.readFileSync(
      path.resolve(__dirname, "../../NavbarCore/NavbarCore.jsx"),
      "utf8"
    );
    expect(navbarCoreFile).not.toContain("initial={{ opacity: 0");
    expect(navbarCoreFile).toMatch(/initial=\{false\}/);
  });
});

describe("Media Item border radius", () => {
  it("uses rounded-xl instead of rounded-2xl across MediaGridItem and gallery views", () => {
    const assetsFile = fs.readFileSync(
      path.resolve(__dirname, "../../../app/cinema-studio/[projectId]/assets/page.js"),
      "utf8"
    );
    const mediaGridItemFile = fs.readFileSync(
      path.resolve(__dirname, "../GenerationsStudio/MediaGridItem/MediaGridItem.jsx"),
      "utf8"
    );

    expect(assetsFile).toContain("rounded-xl");
    expect(assetsFile).not.toContain("rounded-2xl");
    expect(mediaGridItemFile).toContain("rounded-xl");
    expect(mediaGridItemFile).not.toContain("rounded-2xl");
  });
});
