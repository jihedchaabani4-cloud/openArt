import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import { ElementDetailsGallery } from "./ElementDetailsGallery";
import { ElementMediaGalleryGrid } from "./ElementMediaGalleryGrid";

// Mock router
vi.mock("next/navigation", () => ({
  usePathname: () => "/cinema-studio/proj-1/elements/wf-1",
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

describe("ElementDetailsGallery - Studio Media Grid Form", () => {
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
      <ElementDetailsGallery
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
      <ElementDetailsGallery
        items={mockItems}
        primaryMediaId="item-1"
      />
    );

    expect(screen.queryByText("Couverture")).toBeNull();
  });

  it("renders sleek header with compact action buttons and counter", () => {
    renderWithClient(
      <ElementDetailsGallery
        items={mockItems}
        primaryMediaId="item-1"
        onOpenAssets={vi.fn()}
      />
    );

    expect(screen.getByText("Images de référence")).toBeDefined();
    expect(screen.getByText("2 / 6")).toBeDefined();
    expect(screen.getByTitle("Importer depuis l'ordinateur")).toBeDefined();
    expect(screen.getByTitle("Ajouter à partir du projet")).toBeDefined();
  });

  it("renders minimal empty state without big clumsy banner when items is empty", () => {
    const { container } = renderWithClient(
      <ElementDetailsGallery
        items={[]}
        onOpenAssets={vi.fn()}
      />
    );

    expect(screen.getByText("Aucune image de référence")).toBeDefined();
    expect(container.querySelector("[data-component='flow-character-image-preview']")).toBeNull();
  });

  it("ElementMediaGalleryGrid renders reference items cleanly without forced 1:1 aspect ratio", () => {
    const { container } = renderWithClient(
      <ElementMediaGalleryGrid
        items={mockItems}
        primaryMediaId="item-1"
        onUploadFiles={vi.fn()}
      />
    );

    const cards = container.querySelectorAll(".group");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    // Does not force 1:1 on cards
    cards.forEach((card) => {
      expect(card.style.aspectRatio).not.toBe("1/1");
    });
  });

  it("ElementMediaGalleryGrid uses RowsPhotoAlbum photo layout conforming to studio media grid", () => {
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
      <ElementMediaGalleryGrid
        items={multiAspectItems}
        onUploadFiles={vi.fn()}
      />
    );

    // Verify it renders RowsPhotoAlbum just like the studio media grid
    const photoAlbum = container.querySelector(".react-photo-album, .react-photo-album--rows");
    expect(photoAlbum).not.toBeNull();
  });

  it("renders a ButtonGroup with star and delete icon action buttons on cards", () => {
    const onSetCover = vi.fn();
    const onDeleteImage = vi.fn();

    const { container } = renderWithClient(
      <ElementMediaGalleryGrid
        items={mockItems}
        primaryMediaId="item-1"
        onSetCover={onSetCover}
        onDeleteImage={onDeleteImage}
      />
    );

    // ButtonGroup with studio glassmorphic styling
    const buttonGroup = container.querySelector(".bg-white\\/60");
    expect(buttonGroup).not.toBeNull();

    // Check Star icon and Delete icon buttons
    const starBtns = screen.getAllByTitle(/couverture/i);
    expect(starBtns.length).toBeGreaterThan(0);

    const deleteBtns = screen.getAllByTitle(/supprimer/i);
    expect(deleteBtns.length).toBeGreaterThan(0);
  });
});
