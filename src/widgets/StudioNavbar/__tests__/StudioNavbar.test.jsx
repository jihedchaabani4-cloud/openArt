import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudioNavbarLeft } from "../ui/StudioNavbarLeft";
import { StudioNavbarCenter } from "../ui/StudioNavbarCenter";
import { StudioNavbarRight } from "../ui/StudioNavbarRight";

// Mock Next.js navigation
let mockPathname = "/cinema-studio/proj-1";
let mockParams = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useParams: () => mockParams,
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

// Mock projects API & folders
vi.mock("@/features/projects/api/projectsApi", () => ({
  useDeleteProject: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/features/folders", () => ({
  useProjectFolders: () => ({
    data: [{ id: "col-1", name: "My Collection", parent_id: null }],
  }),
  useCreateFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateFolder: () => ({ mutateAsync: vi.fn() }),
  useDeleteFolder: () => ({ mutateAsync: vi.fn() }),
  useFolderMove: () => ({ moveFolder: vi.fn() }),
  useDownloadCollection: () => ({
    downloadCollectionZip: vi.fn(),
    isDownloading: false,
  }),
}));

vi.mock("@/features/workflows/model/useWorkflowsStore", () => ({
  useWorkflowsStore: () => false, // isDragging = false
}));

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe("StudioNavbar Layout & Collection Page Header", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockPathname = "/cinema-studio/proj-1";
    mockParams = {};
  });

  it("normalizes collection title font size and removes border from back button on collection pages", () => {
    mockPathname = "/cinema-studio/proj-1/collection/col-1";
    mockParams = { projectId: "proj-1", collectionId: "col-1" };

    const { container } = renderWithClient(
      <StudioNavbarLeft
        searchExpanded={false}
        selectedProjectName="My Project"
        onEditProjectName={vi.fn()}
        activeProjectId="proj-1"
      />
    );

    // 1. Back button check
    const backBtn = screen.getByRole("link", { name: /back/i });
    expect(backBtn).toBeDefined();
    // Must NOT have border classes
    expect(backBtn.className).not.toContain("border-white/15");
    expect(backBtn.className).not.toContain("border border-white");

    // 2. Collection title check
    const input = container.querySelector("input[aria-label='Display name']");
    expect(input).toBeDefined();
    // Must NOT have oversized text classes
    expect(input.className).not.toContain("text-[28px]");
    expect(input.className).not.toContain("text-2xl");
    // Must have standard text size matching other titles
    expect(input.className).toContain("text-md");
    expect(input.className).toContain("font-medium");
  });

  it("centers search bar with absolute 50% anchor container instead of asymmetrical flex basis", () => {
    const { container } = renderWithClient(
      <StudioNavbarCenter
        searchExpanded={false}
        searchInputRef={{ current: null }}
        handleCloseSearch={vi.fn()}
        handleOpenSearch={vi.fn()}
        filters={{}}
        setFilter={vi.fn()}
      />
    );

    const centerWrapper = container.firstChild;
    expect(centerWrapper.className).not.toContain("flex-[1_1_38%]");
    expect(centerWrapper.className).toContain("left-1/2");
    expect(centerWrapper.className).toContain("-translate-x-1/2");
  });

  it("sets balanced flex-1 layout on right navbar section for horizontal symmetry", () => {
    const { container } = renderWithClient(
      <StudioNavbarRight searchExpanded={false} />
    );

    const rightWrapper = container.firstChild;
    expect(rightWrapper.className).not.toContain("ml-auto flex flex-none");
    expect(rightWrapper.className).toContain("flex-1");
  });

  it("smoothly expands search input from default max-width to full navbar width (max-w-full) without collapsing to width 0 or zero flex-basis", () => {
    const { container: collapsedContainer } = renderWithClient(
      <StudioNavbarCenter
        searchExpanded={false}
        searchInputRef={{ current: null }}
        handleCloseSearch={vi.fn()}
        handleOpenSearch={vi.fn()}
        filters={{}}
        setFilter={vi.fn()}
      />
    );
    const collapsedWrapper = collapsedContainer.firstChild;
    expect(collapsedWrapper.className).toContain("max-w-[460px]");

    cleanup();

    const { container: expandedContainer } = renderWithClient(
      <StudioNavbarCenter
        searchExpanded={true}
        searchInputRef={{ current: null }}
        handleCloseSearch={vi.fn()}
        handleOpenSearch={vi.fn()}
        filters={{}}
        setFilter={vi.fn()}
      />
    );
    const expandedWrapper = expandedContainer.firstChild;
    // Must expand across the entire navbar (max-w-full)
    expect(expandedWrapper.className).toContain("max-w-full");
    expect(expandedWrapper.className).not.toContain("flex-1");
  });
});
