import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { CharacterDetailsGallery } from "./CharacterDetailsGallery";
import { CharacterMediaGalleryGrid, DEFAULT_CHARACTER_ROW_HEIGHT } from "./CharacterMediaGalleryGrid";

// Mock router
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

describe("CharacterDetailsGallery - Studio Media Grid Form", () => {
  let clientWidthSpy;

  beforeEach(() => {
    clientWidthSpy = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => 800);
  });

  afterEach(() => {
    cleanup();
    clientWidthSpy?.mockRestore();
  });

  const mockItems = [
    {
      id: "item-1",
      name: "item-1",
      url: "https://example.com/ref1.png",
      status: "completed",
    },
    {
      id: "item-2",
      name: "item-2",
      url: "https://example.com/ref2.png",
      status: "completed",
    },
  ];

  it("renders cards conforming to studio form without border-white/10 and without like buttons", () => {
    const { container } = renderWithClient(
      <CharacterDetailsGallery
        items={mockItems}
        primaryMediaId="item-1"
      />
    );

    const cards = container.querySelectorAll(".group");
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      expect(card.className).not.toContain("border-white/10");
    });

    // Clean media items: no like button or video icons by default
    expect(screen.queryByTitle("Liked")).toBeNull();
    expect(screen.queryByTitle("Video")).toBeNull();
  });

  it("does not render the top-left 'Couverture' badge, keeping the media card clean", () => {
    renderWithClient(
      <CharacterDetailsGallery
        items={mockItems}
        primaryMediaId="item-1"
      />
    );

    expect(screen.queryByText("Couverture")).toBeNull();
  });

  it("renders sleek header with compact action buttons and without counter badge", () => {
    const sixItems = [
      ...mockItems,
      { id: "item-3", url: "https://example.com/3.png" },
      { id: "item-4", url: "https://example.com/4.png" },
      { id: "item-5", url: "https://example.com/5.png" },
      { id: "item-6", url: "https://example.com/6.png" },
    ];

    renderWithClient(
      <CharacterDetailsGallery
        items={sixItems}
        primaryMediaId="item-1"
        onOpenAssets={vi.fn()}
      />
    );

    // No legacy clumsy counter badge or 'Photos de référence' text
    expect(screen.queryByText("Photos de référence")).toBeNull();
    expect(screen.queryByText(/6 \/ 5/)).toBeNull();
    expect(screen.queryByText(/\d+ \/ \d+/)).toBeNull();

    // 2 action buttons (Upload and Select Assets) with blur variant must be present
    const uploadBtn = screen.getByTitle("Importer depuis l'ordinateur");
    const assetsBtn = screen.getByTitle("Ajouter à partir du projet");
    expect(uploadBtn).toBeDefined();
    expect(assetsBtn).toBeDefined();
    expect(uploadBtn.className).toContain("rounded-full");
  });

  it("renders minimal empty state without big clumsy banner when items is empty", () => {
    const { container } = renderWithClient(
      <CharacterDetailsGallery
        items={[]}
        onOpenAssets={vi.fn()}
      />
    );

    expect(screen.getByText("Aucune image de référence")).toBeDefined();
    expect(container.querySelector("[data-component='flow-character-image-preview']")).toBeNull();
  });

  it("CharacterMediaGalleryGrid renders reference items cleanly without forced 1:1 or 4:3 aspect ratio", () => {
    const { container } = renderWithClient(
      <CharacterMediaGalleryGrid
        items={mockItems}
        primaryMediaId="item-1"
        onUploadFiles={vi.fn()}
      />
    );

    const cards = container.querySelectorAll(".group");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    cards.forEach((card) => {
      expect(card.style.aspectRatio).not.toBe("1/1");
      expect(card.style.aspectRatio).not.toBe("4/3");
    });
  });

  it("CharacterMediaGalleryGrid uses RowsPhotoAlbum photo layout conforming to studio media grid", () => {
    const multiAspectItems = [
      {
        id: "wide-1",
        url: "https://example.com/wide.png",
        aspectRatio: "16:9",
        status: "completed",
      },
      {
        id: "tall-2",
        url: "https://example.com/tall.png",
        aspectRatio: "9:16",
        status: "completed",
      },
    ];

    const { container } = renderWithClient(
      <CharacterMediaGalleryGrid
        items={multiAspectItems}
        onUploadFiles={vi.fn()}
      />
    );

    const photoAlbum = container.querySelector(".react-photo-album, .react-photo-album--rows");
    expect(photoAlbum).not.toBeNull();
  });

  it("configures RowsPhotoAlbum with larger grid size (DEFAULT_CHARACTER_ROW_HEIGHT >= 300)", () => {
    expect(DEFAULT_CHARACTER_ROW_HEIGHT).toBeGreaterThanOrEqual(300);
  });

  it("renders a ButtonGroup with bookmark (save) and delete icon action buttons on cards", () => {
    const onSetCover = vi.fn();
    const onDeleteImage = vi.fn();

    const { container } = renderWithClient(
      <CharacterMediaGalleryGrid
        items={mockItems}
        primaryMediaId="item-1"
        onSetCover={onSetCover}
        onDeleteImage={onDeleteImage}
      />
    );

    // ButtonGroup with studio glassmorphic styling
    const buttonGroup = container.querySelector(".bg-white\\/60");
    expect(buttonGroup).not.toBeNull();

    // Check Cover (bookmark/save) icon and Delete icon buttons
    const coverBtns = screen.getAllByTitle(/couverture/i);
    expect(coverBtns.length).toBeGreaterThan(0);
    expect(coverBtns[0].textContent).toContain("bookmark");
    const coverIcon = coverBtns[0].querySelector("[role='img']");
    expect(coverIcon?.className).toContain("text-[#303031]");

    const deleteBtns = screen.getAllByTitle(/supprimer/i);
    expect(deleteBtns.length).toBeGreaterThan(0);
    expect(deleteBtns[0].textContent).toContain("delete");
  });

  it("renders cards with rounded-xl border radius matching media item standard", () => {
    const { container } = renderWithClient(
      <CharacterMediaGalleryGrid
        items={mockItems}
      />
    );

    const cards = container.querySelectorAll(".rounded-xl");
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      expect(card.className).toContain("rounded-xl");
      expect(card.className).not.toContain("rounded-2xl");
    });
  });

  it("provides right-click context menu containing cover and delete actions", () => {
    const onSetCover = vi.fn();
    const onDeleteImage = vi.fn();

    const { container } = renderWithClient(
      <CharacterMediaGalleryGrid
        items={mockItems}
        primaryMediaId="item-1"
        onSetCover={onSetCover}
        onDeleteImage={onDeleteImage}
      />
    );

    const cards = container.querySelectorAll(".group");
    expect(cards.length).toBeGreaterThan(1);

    // Right-click on second item (item-2, which is not cover)
    fireEvent.contextMenu(cards[1]);

    expect(screen.getByText("Définir comme couverture")).toBeDefined();
    expect(screen.getByText("Supprimer l'image")).toBeDefined();
  });

  it("does not render the 'Ajouter une image' tile in CharacterMediaGalleryGrid even when onUploadFiles is provided", () => {
    renderWithClient(
      <CharacterMediaGalleryGrid
        items={mockItems}
        onUploadFiles={vi.fn()}
      />
    );

    expect(screen.queryByText("Ajouter une image")).toBeNull();
    expect(screen.queryByTitle("Ajouter une image de référence")).toBeNull();
  });

  it("supports backward compatibility when passing displayDetailImages or detailPhotos", () => {
    const { container: container1 } = renderWithClient(
      <CharacterDetailsGallery
        displayDetailImages={mockItems}
      />
    );
    expect(container1.querySelectorAll(".group").length).toBe(2);

    const { container: container2 } = renderWithClient(
      <CharacterDetailsGallery
        detailPhotos={[
          { key: "p-1", src: "https://example.com/p1.png" },
          { key: "p-2", src: "https://example.com/p2.png" },
        ]}
      />
    );
    expect(container2.querySelectorAll(".group").length).toBe(2);
  });
});
