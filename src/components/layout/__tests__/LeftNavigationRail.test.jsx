import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { LeftNavigationRail } from "../LeftNavigationRail";

const pushMock = vi.fn();
const updateProjectMock = vi.fn().mockResolvedValue({});
const deleteProjectMock = vi.fn().mockResolvedValue({});
let mockPathname = "/cinema-studio/proj-1/assets";
let mockFoldersData = [
  { id: "col-1", name: "Scenes", parent_id: null, color: null },
  { id: "col-2", name: "Act 1", parent_id: "col-1", color: "#FFC241" },
];
const createFolderDialogSpy = vi.fn();

vi.mock("next/link", () => ({
  default: React.forwardRef(function MockLink({ href, children, prefetch: _prefetch, ...props }, ref) {
    return (
      <a ref={ref} href={href} {...props}>
        {children}
      </a>
    );
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/features/workflows", () => ({
  useWorkflowsStore: (selector) =>
    selector({
      selectedProjectId: "proj-1",
      favoriteFolderIds: {},
      toggleFavoriteFolder: vi.fn(),
    }),
  useProjectData: () => ({
    data: {
      projectContents: {
        workflows: [
          { id: "wf-1", folder_id: "col-1" },
          { id: "wf-2", folder_id: "col-1" },
          { id: "wf-trash-1", deleted_at: "2026-11-20T00:00:00Z" },
        ],
      },
    },
  }),
  selectStudioWorkflows: (contents, opts) => {
    const wfs = contents?.workflows ?? [];
    if (opts?.lifecycle === "trash") {
      return wfs.filter((w) => Boolean(w.deleted_at));
    }
    return wfs.filter((w) => !w.deleted_at);
  },
}));

vi.mock("@/features/characters", () => ({
  useCharacterWorkflows: () => ({ workflows: [] }),
}));

vi.mock("@/features/elements", () => ({
  useElementSheetWorkflows: () => ({ workflows: [] }),
}));

vi.mock("@/features/projects/api/projectsApi", () => ({
  useProjects: () => ({
    data: [
      { id: "proj-1", project_id: "proj-1", project_name: "First project" },
      { id: "proj-2", project_id: "proj-2", project_name: "Second project" },
    ],
  }),
  useUpdateProject: () => ({ mutateAsync: updateProjectMock }),
  useDeleteProject: () => ({ mutateAsync: deleteProjectMock }),
}));

vi.mock("@/features/folders", () => ({
  useProjectFolders: () => ({
    data: mockFoldersData,
  }),
  useUpdateFolder: () => ({ mutateAsync: vi.fn() }),
  useDeleteFolder: () => ({ mutateAsync: vi.fn() }),
  useDownloadCollection: () => ({ downloadCollection: vi.fn(), isDownloading: false }),
  FOLDER_COLOR_OPTIONS: [],
  DEFAULT_FOLDER_GRADIENT: { hex: "#ffffff" },
}));

vi.mock("@/components/cinema-studio/collections/CreateFolderDialog", () => ({
  CreateFolderDialog: (props) => {
    createFolderDialogSpy(props);
    return props.open ? <div data-testid="create-folder-dialog" /> : null;
  },
}));

vi.mock("@/components/primitives/ConfirmDeleteDialog", () => ({
  ConfirmDeleteDialog: ({ open, onConfirm, title }) =>
    open ? (
      <div data-testid="confirm-delete-dialog">
        <span>{title}</span>
        <button type="button" onClick={onConfirm}>
          Confirm delete
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/cinema-studio/collections/MoveToDialog", () => ({
  MoveToDialog: () => null,
}));

vi.mock("@/components/layout/UserDropdown", () => ({
  UserDropdown: ({ variant, expanded }) => (
    <button
      type="button"
      data-testid="sidebar-user-dropdown"
      data-variant={variant}
      data-expanded={String(Boolean(expanded))}
      aria-label="Open user menu"
    >
      User
    </button>
  ),
}));

describe("LeftNavigationRail sidebar geometry & token contract", () => {
  beforeEach(() => {
    mockPathname = "/cinema-studio/proj-1/assets";
    mockFoldersData = [
      { id: "col-1", name: "Scenes", parent_id: null, color: null },
      { id: "col-2", name: "Act 1", parent_id: "col-1", color: "#FFC241" },
    ];
    pushMock.mockReset();
    updateProjectMock.mockReset().mockResolvedValue({});
    deleteProjectMock.mockReset().mockResolvedValue({});
    createFolderDialogSpy.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders collapsed state centered at 56px with .ds-nav-item rows and accessible sr-only labels", () => {
    const { container } = render(<LeftNavigationRail />);
    const aside = screen.getByLabelText("Navigation Studio");

    expect(aside.style.width).toBe("var(--studio-sidebar-width, 56px)");
    expect(aside.className).toContain("rounded-2xl");
    expect(aside.className).toContain("bg-transparent");
    expect(aside.className).toContain("px-2");
    expect(aside.className).toContain("py-3");
    expect(aside.className).toContain("gap-y-4");

    const assetsLink = screen.getByRole("link", { name: "All assets" });
    expect(assetsLink.className).toContain("ds-nav-item");
    expect(assetsLink.className).toContain("rounded-lg");
    expect(assetsLink.className).not.toContain("justify-center");
    expect(assetsLink.getAttribute("data-active")).toBe("true");
    expect(assetsLink.getAttribute("aria-current")).toBe("page");

    expect(screen.getByText("All assets").className).toContain("sr-only");
    expect(screen.queryByText("Add folder")).toBeNull();
    expect(screen.queryByRole("tree")).toBeNull();

    // No undefined legacy layout classes or hardcoded 48px spans
    expect(container.innerHTML).not.toContain("w-[48px]");
    expect(container.innerHTML).not.toContain("rail-smooth-transition");
    expect(container.innerHTML).not.toContain("bg-surface-elevated");
    expect(container.innerHTML).not.toContain("bis_skin_checked");
  });

  it("expands to show All assets -> indented Add folder -> folders tree underneath", () => {
    render(<LeftNavigationRail />);

    const toggleBtn = screen.getByRole("button", { name: "Développer la barre" });
    fireEvent.click(toggleBtn);

    const aside = screen.getByLabelText("Navigation Studio");
    expect(aside.style.width).toBe("224px");

    const mainNav = screen.getByLabelText("Navigation principale");
    expect(mainNav.className).toContain("flex-col");
    expect(mainNav.className).toContain("gap-0.5");
    expect(mainNav.className).toContain("items-start");
    expect(mainNav.parentElement?.className).toContain("gap-y-4");

    const homeLink = screen.getByRole("link", { name: "Accueil" });
    expect(homeLink.getAttribute("data-tour")).toBe("sidebar-back");
    expect(homeLink.className).toContain("ds-nav-item");
    expect(homeLink.className).toContain("w-auto");
    expect(homeLink.className).toContain("flex-1");
    expect(homeLink.className).toContain("shrink");
    expect(homeLink.className).not.toContain("justify-center");

    const collapseBtn = screen.getByRole("button", { name: "Réduire la barre" });
    expect(collapseBtn.getAttribute("data-slot")).toBe("icon-button");
    expect(collapseBtn.parentElement).toBe(homeLink.parentElement);
    expect(collapseBtn.parentElement?.className).toContain("flex-row");
    const collapseGlyph = collapseBtn.querySelector('[data-icon-provider="hugeicons"]');
    expect(collapseGlyph?.getAttribute("data-icon-name")).toBe("sidebar-left-01");
    expect(collapseGlyph?.className).toContain("hgi-sidebar-left-01");
    expect(collapseGlyph?.className).not.toContain("rotate-180");

    const assetsLabel = screen.getByText("All assets");
    expect(assetsLabel.className).not.toContain("sr-only");

    const foldersHeading = screen.getByText("Folders");
    expect(foldersHeading.tagName).toBe("P");
    expect(foldersHeading.className).toContain("text-sm");
    expect(foldersHeading.className).toContain("text-muted-foreground");

    const addFolderBtn = screen.getByRole("button", { name: "Add folder" });
    expect(addFolderBtn.className).toContain("ds-nav-item");
    expect(addFolderBtn.parentElement?.className).toContain("pl-4");

    const folderRow = screen.getByRole("treeitem", { name: "Scenes" });
    expect(folderRow.className).toContain("ds-nav-item");
    expect(folderRow.className).toContain("rounded-lg");
    expect(folderRow.firstElementChild?.className).toContain("size-4");

    // Order check: All assets -> Add folder -> Scenes folder
    const assetsLink = screen.getByRole("link", { name: "All assets" });
    expect(
      assetsLink.compareDocumentPosition(addFolderBtn) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      addFolderBtn.compareDocumentPosition(folderRow) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    // Clicking Add folder opens CreateFolderDialog for root folder creation
    fireEvent.click(addFolderBtn);
    expect(screen.getByTestId("create-folder-dialog")).toBeTruthy();
    expect(createFolderDialogSpy).toHaveBeenCalledWith(
      expect.objectContaining({ open: true, parentId: null, projectId: "proj-1" })
    );
  });

  it("renders All assets and Add folder without any empty placeholder when there are no folders", () => {
    mockFoldersData = [];
    render(<LeftNavigationRail />);
    fireEvent.click(screen.getByRole("button", { name: "Développer la barre" }));

    expect(screen.getByRole("link", { name: "All assets" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add folder" })).toBeTruthy();
    expect(screen.queryByRole("tree")).toBeNull();
    expect(screen.queryByText("Aucune collection")).toBeNull();
  });

  it("displays active project name with Actions menu (Open in new tab, Rename, Add folder, Delete)", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<LeftNavigationRail />);
    fireEvent.click(screen.getByRole("button", { name: "Développer la barre" }));

    const projectRow = screen.getByTestId("sidebar-project-row");
    expect(projectRow).toBeTruthy();
    expect(screen.getByText("First project")).toBeTruthy();

    // Open menu via keyboard/pointer on trigger
    const menuTrigger = screen.getByRole("button", { name: "Actions du projet" });
    fireEvent.pointerDown(menuTrigger, { button: 0, ctrlKey: false });
    fireEvent.click(menuTrigger);

    expect(await screen.findByText("Actions")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Open in new tab/i })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Rename/i })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Add folder/i })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Delete/i })).toBeTruthy();

    // Open in new tab
    fireEvent.click(screen.getByRole("menuitem", { name: /Open in new tab/i }));
    expect(openSpy).toHaveBeenCalledWith(
      "/cinema-studio/proj-1/assets",
      "_blank",
      "noopener,noreferrer"
    );

    // Rename inline via menu
    fireEvent.pointerDown(menuTrigger, { button: 0, ctrlKey: false });
    fireEvent.click(menuTrigger);
    fireEvent.click(await screen.findByRole("menuitem", { name: /Rename/i }));
    const renameInput = await screen.findByLabelText("Nom du projet");
    fireEvent.change(renameInput, { target: { value: "Renamed project" } });
    fireEvent.blur(renameInput);
    expect(updateProjectMock).toHaveBeenCalledWith({
      projectId: "proj-1",
      projectData: { project_name: "Renamed project" },
    });

    // Add folder via menu
    fireEvent.pointerDown(menuTrigger, { button: 0, ctrlKey: false });
    fireEvent.click(menuTrigger);
    fireEvent.click(await screen.findByRole("menuitem", { name: /Add folder/i }));
    expect(screen.getByTestId("create-folder-dialog")).toBeTruthy();

    // Delete project via menu -> ConfirmDeleteDialog
    fireEvent.pointerDown(menuTrigger, { button: 0, ctrlKey: false });
    fireEvent.click(menuTrigger);
    fireEvent.click(await screen.findByRole("menuitem", { name: /Delete/i }));
    expect(await screen.findByTestId("confirm-delete-dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
    expect(pushMock).toHaveBeenCalledWith("/cinema-studio");
    expect(deleteProjectMock).toHaveBeenCalledWith("proj-1");

    // Right-click on project row opens the same Actions context menu
    fireEvent.contextMenu(projectRow);
    expect(await screen.findByRole("menuitem", { name: /Open in new tab/i })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Rename/i })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Add folder/i })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Delete/i })).toBeTruthy();

    openSpy.mockRestore();
  });

  it("exposes sidebar folder and All assets drop attributes and highlights hovered targets on studio:pointer-hover-target", () => {
    render(<LeftNavigationRail />);

    const collapsedAssetsLink = screen.getByRole("link", { name: "All assets" });
    expect(collapsedAssetsLink.getAttribute("data-drop-project-root")).toBe("true");

    // Expand sidebar to inspect folder tree drop targets
    fireEvent.click(screen.getByRole("button", { name: "Développer la barre" }));

    const assetsLink = screen.getByRole("link", { name: "All assets" });
    expect(assetsLink.getAttribute("data-drop-project-root")).toBe("true");

    const parentFolderRow = screen.getByRole("treeitem", { name: "Scenes" });
    expect(parentFolderRow.getAttribute("data-collection-drop-id")).toBe("col-1");

    // Expand parent folder so leaf child FileTreeItem is also mounted
    fireEvent.click(parentFolderRow);
    const childFolderRow = screen.getByRole("treeitem", { name: "Act 1" });
    expect(childFolderRow.getAttribute("data-collection-drop-id")).toBe("col-2");

    // Hovering a sidebar folder highlights only that folder row
    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:pointer-hover-target", {
          detail: { target: "add-to-collection", collectionId: "col-1" },
        })
      );
    });
    expect(parentFolderRow.getAttribute("data-drag-over")).toBe("true");
    expect(parentFolderRow.className).toContain("bg-surface-tonal-hover");
    expect(parentFolderRow.className).toContain("ring-1");
    expect(parentFolderRow.className).toContain("ring-text-primary/70");
    expect(childFolderRow.getAttribute("data-drag-over")).toBeNull();
    expect(assetsLink.getAttribute("data-drag-over")).toBeNull();

    // Moving hover to leaf child folder switches highlight cleanly
    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:pointer-hover-target", {
          detail: { target: "add-to-collection", collectionId: "col-2" },
        })
      );
    });
    expect(parentFolderRow.getAttribute("data-drag-over")).toBeNull();
    expect(childFolderRow.getAttribute("data-drag-over")).toBe("true");
    expect(childFolderRow.className).toContain("bg-surface-tonal-hover");
    expect(childFolderRow.className).toContain("ring-text-primary/70");

    // Hovering All assets (move-to-root) highlights All assets and clears folders
    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:pointer-hover-target", {
          detail: { target: "move-to-root", area: "sidebar-root" },
        })
      );
    });
    expect(childFolderRow.getAttribute("data-drag-over")).toBeNull();
    expect(assetsLink.getAttribute("data-drag-over")).toBe("true");
    expect(assetsLink.className).toContain("bg-surface-tonal-hover");
    expect(assetsLink.className).toContain("ring-1");
    expect(assetsLink.className).toContain("ring-text-primary/70");

    // Clearing hover target removes all sidebar drag highlights
    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:pointer-hover-target", {
          detail: { target: null },
        })
      );
    });
    expect(assetsLink.getAttribute("data-drag-over")).toBeNull();
    expect(assetsLink.className).not.toContain("bg-surface-tonal-hover");
    expect(parentFolderRow.getAttribute("data-drag-over")).toBeNull();
    expect(childFolderRow.getAttribute("data-drag-over")).toBeNull();
  });

  it("supports Quick Project Switcher, subtle folder/trash counts, and Drag-to-Trash hover highlight", () => {
    const { container } = render(<LeftNavigationRail />);
    fireEvent.click(screen.getByRole("button", { name: "Développer la barre" }));

    // Subtle counts: col-1 has 2 direct workflows, Corbeille has 1 trashed workflow
    expect(screen.getByTestId("sidebar-folder-count-col-1").textContent).toBe("2");
    expect(screen.getByTestId("sidebar-count-trash").textContent).toBe("1");

    // Drag-to-Trash attribute and hover highlight
    const trashLink = container.querySelector('[data-drop-trash="true"]');
    expect(trashLink).toBeTruthy();
    act(() => {
      window.dispatchEvent(
        new CustomEvent("studio:pointer-hover-target", {
          detail: { target: "move-to-trash", area: "sidebar-trash" },
        })
      );
    });
    expect(trashLink.getAttribute("data-drag-over")).toBe("true");
    expect(trashLink.className).toContain("ring-error/70");

    // Quick Project Switcher expands INLINE inside the sidebar (not a floating popover) and navigates
    const switcher = screen.getByTestId("sidebar-project-switcher");
    expect(switcher.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(switcher);
    expect(switcher.getAttribute("aria-expanded")).toBe("true");
    const inlineCard = screen.getByTestId("sidebar-project-row").querySelector('[data-slot="inline-dropdown"]');
    expect(inlineCard?.getAttribute("data-state")).toBe("open");

    // Right-clicking another project item opens its own ContextMenu (Open, Open in new tab, Delete)
    const secondProjectItem = screen.getByText("Second project");
    fireEvent.contextMenu(secondProjectItem, { clientX: 80, clientY: 160 });
    expect(screen.getByText("Open in new tab")).toBeTruthy();
    fireEvent.click(screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Confirm delete"));
    expect(deleteProjectMock).toHaveBeenCalledWith("proj-2");
    expect(pushMock).not.toHaveBeenCalledWith("/cinema-studio");

    fireEvent.click(secondProjectItem);
    expect(pushMock).toHaveBeenCalledWith("/cinema-studio/proj-2/assets");
  });
});
