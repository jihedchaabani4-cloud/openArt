import { describe, it, expect, vi } from "vitest";
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

vi.mock("@/features/folders", () => ({
  useProjectFolders: () => ({ data: [] }),
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

  it("LeftNavigationRail has fixed top spacing independent of scroll and default width of 52px matching navbar height", () => {
    mockNavbarHidden = false;
    const { container } = render(<LeftNavigationRail />);
    const aside = container.querySelector("aside");
    expect(aside).toBeDefined();
    expect(aside.style.width).toMatch(/52px/);

    const spacer = container.querySelector("aside > div.shrink-0");
    expect(spacer).toBeDefined();
  });

  it("renders top nav items (Accueil, Assets, Éléments, Personnages) and places Corbeille (Trash) at the bottom above Réduire", () => {
    mockNavbarHidden = false;
    const { container } = render(<LeftNavigationRail />);
    const topNav = container.querySelector("nav");
    const topLinks = Array.from(topNav.querySelectorAll("a span.tracking-normal")).map((s) => s.textContent?.trim());
    expect(topLinks).toEqual(["Accueil", "Assets", "Éléments", "Personnages"]);

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

  it("Media grid scroll containers sit directly under navbar in flex column without artificial top padding", () => {
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

    // Assets page: no artificial top padding
    expect(assetsFile).not.toMatch(/pt-\[72px\]/);
    expect(assetsFile).not.toMatch(/pt-\[64px\]/);

    // Collection page: no artificial top padding
    expect(collectionFile).not.toMatch(/pt-\[72px\]/);
    expect(collectionFile).not.toMatch(/pt-\[64px\]/);

    // Elements page: no artificial top padding
    expect(elementsFile).not.toMatch(/pt-\[72px\]/);
    expect(elementsFile).not.toMatch(/pt-\[64px\]/);

    // Characters page: no artificial top padding
    expect(charactersFile).not.toMatch(/pt-\[72px\]/);
    expect(charactersFile).not.toMatch(/pt-\[64px\]/);
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
  it("centralizes rounded-xxxs media surface inside MediaView without gallery or page overrides", () => {
    const mediaViewFile = fs.readFileSync(
      path.resolve(__dirname, "../../../features/media/ui/MediaView.jsx"),
      "utf8"
    );
    const mediaGridItemFile = fs.readFileSync(
      path.resolve(__dirname, "../GenerationsStudio/MediaGridItem/MediaGridItem.jsx"),
      "utf8"
    );
    const sharedGalleryGridFile = fs.readFileSync(
      path.resolve(__dirname, "../../../features/media/ui/SharedGalleryGrid.jsx"),
      "utf8"
    );

    expect(mediaViewFile).toContain("rounded-xxxs");
    expect(mediaViewFile).not.toContain("rounded-2xl");
    expect(mediaGridItemFile).toContain("rounded-xxxs");
    expect(mediaGridItemFile).not.toContain("rounded-2xl");
    expect(sharedGalleryGridFile).not.toContain('itemClassName = "rounded-lg');
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

describe("Unified Studio Gallery CardComponent wiring", () => {
  it("wires CardComponent={MediaGridItem} across assets, characters, elements, collection, and trash screens", () => {
    const screenPaths = [
      "../../../app/cinema-studio/[projectId]/assets/page.js",
      "../../../app/cinema-studio/[projectId]/characters/page.js",
      "../../../app/cinema-studio/[projectId]/elements/page.js",
      "../../../app/cinema-studio/[projectId]/collection/[collectionId]/page.jsx",
      "../../../features/trash/ui/TrashView.jsx",
    ];

    for (const relPath of screenPaths) {
      const source = fs.readFileSync(path.resolve(__dirname, relPath), "utf8");
      expect(source, `${relPath} must pass CardComponent={MediaGridItem} to SharedGalleryGrid`).toContain(
        "CardComponent={MediaGridItem}"
      );
      expect(source, `${relPath} must not duplicate card styling via itemClassName`).not.toContain(
        "itemClassName="
      );
    }
  });
});




