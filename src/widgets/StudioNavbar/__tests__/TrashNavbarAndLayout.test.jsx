import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StudioNavbarLeft } from "../ui/StudioNavbarLeft";
import { StudioNavbar } from "../StudioNavbar";
import { LeftNavigationRail } from "@/widgets/StudioLayout/LeftNavigationRail";
import { useWorkflowsStore } from "@/features/workflows";

let mockPathname = "/cinema-studio/proj-1/trash";
let mockParams = { projectId: "proj-1" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
  }),
  useParams: () => mockParams,
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/projects/api/projectsApi", () => ({
  useProjects: () => ({ data: [{ project_id: "proj-1", project_name: "My Project" }] }),
  useUpdateProject: () => ({ mutateAsync: vi.fn() }),
  useDeleteProject: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/features/folders", () => ({
  useProjectFolders: () => ({
    data: [{ id: "col-1", name: "My Collection", parent_id: null }],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCreateFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateFolder: () => ({ mutateAsync: vi.fn() }),
  useDeleteFolder: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useFolderMove: () => ({ executeMoveFromPayload: vi.fn() }),
  useDownloadCollection: () => ({
    downloadCollection: vi.fn(),
    isDownloading: false,
  }),
}));

vi.mock("@/features/workflows/api/queries/useProjectData", () => ({
  useProjectData: () => ({
    data: { projectContents: { workflows: [], trashedWorkflows: [] } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/features/characters", () => ({
  useCharacterWorkflows: () => ({ workflows: [] }),
}));

vi.mock("@/features/elements", () => ({
  useElementSheetWorkflows: () => ({ workflows: [] }),
}));

vi.mock("@/shared/api/auth", () => ({
  useAuthSession: () => ({ data: { id: "user-1", email: "user@example.com" }, isLoading: false }),
  useWalletBalance: () => ({ data: 100 }),
  useLogout: () => ({ mutate: vi.fn(), isPending: false }),
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

describe("Trash Page Standalone Layout & Navbar Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/cinema-studio/proj-1/trash";
    mockParams = { projectId: "proj-1" };
    useWorkflowsStore.setState({
      selectedProjectId: "proj-1",
      activeStudioTab: "trash",
      isNavbarHidden: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders arrow_back button linking to the project assets page and static Trash title without project rename input or 3-dots menu when on the trash route", () => {
    const { container } = renderWithClient(
      <StudioNavbarLeft
        searchExpanded={false}
        selectedProjectName="My Project"
        onEditProjectName={vi.fn()}
        activeProjectId="proj-1"
      />
    );

    const backLink = screen.getByRole("link", { name: /back/i });
    expect(backLink).toBeDefined();
    expect(backLink.getAttribute("href")).toBe("/cinema-studio/proj-1/assets");
    expect(backLink.textContent).toContain("arrow_back");
    expect(backLink.textContent).not.toContain("home");

    expect(screen.getByText("Trash")).toBeDefined();
    expect(container.querySelector("input[aria-label='Display name']")).toBeNull();
    expect(container.textContent).not.toContain("more_vert");
  });

  it("keeps the home button, editable project name, and 3-dots menu on normal project routes like /assets", () => {
    mockPathname = "/cinema-studio/proj-1/assets";
    useWorkflowsStore.setState({
      selectedProjectId: "proj-1",
      activeStudioTab: "assets",
    });

    const { container } = renderWithClient(
      <StudioNavbarLeft
        searchExpanded={false}
        selectedProjectName="My Project"
        onEditProjectName={vi.fn()}
        activeProjectId="proj-1"
      />
    );

    const homeLink = screen.getByRole("link", { name: /accueil/i });
    expect(homeLink.getAttribute("href")).toBe("/cinema-studio");
    expect(homeLink.textContent).toContain("home");

    const input = container.querySelector("input[aria-label='Display name']");
    expect(input).not.toBeNull();
    expect(input.value).toBe("My Project");
    expect(container.textContent).toContain("more_vert");
  });

  it("keeps center search bar and right actions (Tout restaurer, settings) in StudioNavbar on the trash route", () => {
    renderWithClient(<StudioNavbar />);

    expect(screen.getByRole("searchbox")).toBeDefined();
    expect(screen.getByRole("button", { name: /tout restaurer/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /paramètres de la grille/i })).toBeDefined();
  });

  it("hides LeftNavigationRail when pathname is /cinema-studio/proj-1/trash", () => {
    mockPathname = "/cinema-studio/proj-1/trash";
    const { container } = renderWithClient(<LeftNavigationRail />);
    expect(container.querySelector("aside[aria-label='Navigation Studio']")).toBeNull();
  });

  it("renders LeftNavigationRail when pathname is /cinema-studio/proj-1/assets", () => {
    mockPathname = "/cinema-studio/proj-1/assets";
    useWorkflowsStore.setState({
      selectedProjectId: "proj-1",
      activeStudioTab: "assets",
    });

    const { container } = renderWithClient(<LeftNavigationRail />);
    expect(container.querySelector("aside[aria-label='Navigation Studio']")).not.toBeNull();
  });
});
