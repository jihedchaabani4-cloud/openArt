import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { CharacterSheetSection } from "./CharacterSheetSection";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/cinema-studio/proj-1/characters/wf-1",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ projectId: "proj-1", workflowId: "wf-1" }),
}));

// Mock store
vi.mock("@/features/workflows", () => ({
  useWorkflowsStore: (selector) =>
    selector?.({
      selectedProjectId: "proj-1",
      isNavbarHidden: false,
      showTileDetails: false,
    }),
  useToggleWorkflowLike: () => ({ mutate: vi.fn() }),
  useRemoveWorkflow: () => ({ mutate: vi.fn() }),
  useRemoveAsset: () => ({ mutate: vi.fn() }),
  useUpdateWorkflow: () => ({ mutateAsync: vi.fn() }),
}));

const { mockPromptStore } = vi.hoisted(() => {
  const store = Object.assign(
    (selector) => (selector ? selector({ isDraggingGalleryItem: false }) : { isDraggingGalleryItem: false }),
    {
      getState: () => ({
        setIsDraggingGalleryItem: vi.fn(),
        setDraggedItem: vi.fn(),
        isDraggingGalleryItem: false,
      }),
    }
  );
  return { mockPromptStore: store };
});

vi.mock("@/features/studio", () => ({
  usePromptStore: mockPromptStore,
  useStudioItemDrag: () => ({
    isDraggingThis: false,
    dragTarget: null,
    justDraggedRef: { current: false },
    handlePointerDown: vi.fn(),
  }),
}));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

function renderWithClient(ui) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe("CharacterSheetSection - MediaItemView Integration", () => {
  afterEach(() => {
    cleanup();
  });

  const mockSheetSrc = "https://example.com/character-sheet-3view.png";

  it("renders character sheet image using MediaItemView with fit contain and border-none", () => {
    const { container } = renderWithClient(
      <CharacterSheetSection
        activeSheetSrc={mockSheetSrc}
      />
    );

    // MediaItemView renders the image with object-contain
    const img = screen.getByRole("img");
    expect(img).toBeDefined();
    expect(img.getAttribute("src")).toBe(mockSheetSrc);
    expect(img.className).toContain("object-contain");

    // Container has border-none
    const sheetCard = container.querySelector(".group\\/sheet");
    expect(sheetCard).not.toBeNull();
    expect(sheetCard.className).toContain("border-none");
    expect(sheetCard.className).not.toContain("border-white/10");
  });

  it("renders action buttons in topRight slot with upload, assets, download, and delete", () => {
    const onDownload = vi.fn();
    const onDelete = vi.fn();
    const onOpenAssets = vi.fn();

    renderWithClient(
      <CharacterSheetSection
        activeSheetSrc={mockSheetSrc}
        onDownload={onDownload}
        onDelete={onDelete}
        onOpenAssets={onOpenAssets}
      />
    );

    expect(screen.getByTitle("Importer une image de corps (Turnaround)")).toBeDefined();
    expect(screen.getByTitle("Select Body Sheet from assets")).toBeDefined();

    const downloadBtn = screen.getByTitle("Download character sheet");
    expect(downloadBtn).toBeDefined();
    fireEvent.click(downloadBtn);
    expect(onDownload).toHaveBeenCalledTimes(1);

    const deleteBtn = screen.getByTitle("Delete character");
    expect(deleteBtn).toBeDefined();
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("provides right-click context menu containing sheet actions", () => {
    const onDownload = vi.fn();
    const onDelete = vi.fn();
    const { container } = renderWithClient(
      <CharacterSheetSection
        activeSheetSrc={mockSheetSrc}
        onDownload={onDownload}
        onDelete={onDelete}
      />
    );

    const sheetCard = container.querySelector(".group\\/sheet");
    expect(sheetCard).not.toBeNull();

    fireEvent.contextMenu(sheetCard);

    expect(screen.getByText("Télécharger")).toBeDefined();
    expect(screen.getByText("Importer une image (Turnaround)")).toBeDefined();
    expect(screen.getByText("Supprimer le personnage")).toBeDefined();
  });

  it("renders FlowCharacterImagePreview empty state when activeSheetSrc is absent", () => {
    const { container } = renderWithClient(
      <CharacterSheetSection
        activeSheetSrc={null}
      />
    );

    expect(container.querySelector("[data-component='flow-character-image-preview']")).not.toBeNull();
  });

  it("renders loader during sheet generation in progress", () => {
    renderWithClient(
      <CharacterSheetSection
        activeSheetSrc={null}
        isProcessing={true}
      />
    );

    expect(screen.getByText("Generating character sheet…")).toBeDefined();
  });
});
