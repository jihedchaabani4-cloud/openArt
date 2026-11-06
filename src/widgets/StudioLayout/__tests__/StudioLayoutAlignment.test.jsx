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

  it("renders top nav items (Assets, Éléments, Personnages) and places Corbeille (Trash) at the bottom above Réduire", () => {
    mockNavbarHidden = false;
    const { container } = render(<LeftNavigationRail />);
    const topNav = container.querySelector("nav");
    const topLinks = Array.from(topNav.querySelectorAll("a span.tracking-normal")).map((s) => s.textContent?.trim());
    expect(topLinks).toEqual(["Assets", "Éléments", "Personnages"]);

    const bottomContainer = container.querySelector("div.mt-auto");
    expect(bottomContainer).toBeDefined();

    const bottomTrashLink = bottomContainer.querySelector("a");
    expect(bottomTrashLink).toBeDefined();
    expect(bottomTrashLink.querySelector("span.tracking-normal")?.textContent?.trim()).toBe("Corbeille");

    const bottomReduceBtn = bottomContainer.querySelector("button");
    expect(bottomReduceBtn).toBeDefined();
    expect(bottomReduceBtn.querySelector("span.tracking-normal")?.textContent?.trim()).toBe("Réduire");
    expect(bottomReduceBtn.className).toContain("p-0");
    expect(bottomReduceBtn.className).toContain("gap-0");
    expect(bottomReduceBtn.querySelector("span.w-\\[48px\\]")).toBeDefined();

    // Verify Corbeille precedes Réduire in DOM order (placed above it)
    expect(bottomTrashLink.compareDocumentPosition(bottomReduceBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("Media grid scroll containers use pt-[72px] and remove py-3 / pt-4 across all studio views", () => {
    const assetsFile = fs.readFileSync(
      path.resolve(__dirname, "../../../app/cinema-studio/[projectId]/assets/page.js"),
      "utf8"
    );
    const collectionFile = fs.readFileSync(
      path.resolve(__dirname, "../../../app/cinema-studio/[projectId]/collection/[collectionId]/page.jsx"),
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
  it("uses rounded-lg instead of rounded-2xl across MediaGridItem and gallery views", () => {
    const assetsFile = fs.readFileSync(
      path.resolve(__dirname, "../../../app/cinema-studio/[projectId]/assets/page.js"),
      "utf8"
    );
    const mediaGridItemFile = fs.readFileSync(
      path.resolve(__dirname, "../GenerationsStudio/MediaGridItem/MediaGridItem.jsx"),
      "utf8"
    );

    expect(assetsFile).toContain("rounded-lg");
    expect(assetsFile).not.toContain("rounded-2xl");
    expect(mediaGridItemFile).toContain("rounded-lg");
    expect(mediaGridItemFile).not.toContain("rounded-2xl");
  });
});

describe("CollectionMediaGridItem action button group & menu styling", () => {
  it("matches generated media item ButtonGroup background and button styles", () => {
    const mediaGridItemFile = fs.readFileSync(
      path.resolve(__dirname, "../GenerationsStudio/MediaGridItem/MediaGridItem.jsx"),
      "utf8"
    );

    // Collection item must use the same bg-white/60 backdrop-blur-md rounded-lg as generated items
    expect(mediaGridItemFile).not.toContain('rounded-[10px] border border-white/10 bg-[#343434]/95 backdrop-blur-md shadow-[0_14px_34px_rgba(0,0,0,0.48)]');
    expect(mediaGridItemFile).not.toContain('className="bg-transparent text-white hover:bg-white/12"');
  });

  it("ensures media grid item ButtonGroup and ActionBtn have no border", () => {
    const mediaGridItemFile = fs.readFileSync(
      path.resolve(__dirname, "../GenerationsStudio/MediaGridItem/MediaGridItem.jsx"),
      "utf8"
    );
    const buttonGroupFile = fs.readFileSync(
      path.resolve(__dirname, "../../../shared/ui/button-group.jsx"),
      "utf8"
    );

    expect(mediaGridItemFile).toContain('ButtonGroup variant="pill"');
    expect(buttonGroupFile).not.toContain("border border-[var(--mat-sys-outline-variant");
  });
});

describe("Media item borderless design and video indicator", () => {
  it("removes border from CoreMediaItemView and collection tiles, and includes video icon indicator", () => {
    const coreMediaFile = fs.readFileSync(
      path.resolve(__dirname, "../../CoreMediaItemView/CoreMediaItemView.jsx"),
      "utf8"
    );
    const globalsCssFile = fs.readFileSync(
      path.resolve(__dirname, "../../../app/globals.css"),
      "utf8"
    );

    expect(coreMediaFile).not.toContain("border border-white/10");
    expect(globalsCssFile).not.toContain("border: 1px solid rgba(255, 255, 255, 0.1);");
    expect(coreMediaFile).toContain('iconName="videocam"');
  });
});

describe("Header backdrop bottom smoothing", () => {
  it("uses an ultra-smooth feathered easing at the bottom of header-backdrop", () => {
    const globalsCssFile = fs.readFileSync(
      path.resolve(__dirname, "../../../app/globals.css"),
      "utf8"
    );

    // Verifies that the mask has smooth feathered tapering stops at the bottom
    expect(globalsCssFile).toContain(".header-backdrop");
    expect(globalsCssFile).toMatch(/mask-image:.*rgba\(0,\s*0,\s*0,\s*0\.03\)/);
  });
});




