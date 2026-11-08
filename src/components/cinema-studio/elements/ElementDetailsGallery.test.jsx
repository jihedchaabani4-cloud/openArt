import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ElementDetailsGallery } from "./ElementDetailsGallery";
import { ReferenceMediaGalleryGrid, DEFAULT_REFERENCE_ROW_HEIGHT as DEFAULT_ELEMENT_ROW_HEIGHT } from "../common/ReferenceMediaGalleryGrid";

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

  it("renders sleek header with compact action buttons and without counter badge", () => {
    // 7 items (more than max 6) to verify buttons stay visible and no 7 / 6 badge is rendered
    const sevenItems = [
      ...mockItems,
      { id: "item-3", url: "https://example.com/3.png" },
      { id: "item-4", url: "https://example.com/4.png" },
      { id: "item-5", url: "https://example.com/5.png" },
      { id: "item-6", url: "https://example.com/6.png" },
      { id: "item-7", url: "https://example.com/7.png" },
    ];

    renderWithClient(
      <ElementDetailsGallery
        items={sevenItems}
        primaryMediaId="item-1"
        onOpenAssets={vi.fn()}
      />
    );

    // 'Images de référence' title is removed per user request
    expect(screen.queryByText("Images de référence")).toBeNull();
    expect(screen.queryByText(/7 \/ 6/)).toBeNull();
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
      <ElementDetailsGallery
        items={[]}
        onOpenAssets={vi.fn()}
      />
    );

    expect(screen.getByText("Aucune image de référence")).toBeDefined();
    expect(container.querySelector("[data-component='flow-character-image-preview']")).toBeNull();
  });

  it("ReferenceMediaGalleryGrid renders reference items cleanly without forced 1:1 aspect ratio", () => {
    const { container } = renderWithClient(
      <ReferenceMediaGalleryGrid
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

  it("ReferenceMediaGalleryGrid uses RowsPhotoAlbum photo layout conforming to studio media grid", () => {
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
      <ReferenceMediaGalleryGrid
        items={multiAspectItems}
        onUploadFiles={vi.fn()}
      />
    );

    // Verify it renders RowsPhotoAlbum just like the studio media grid
    const photoAlbum = container.querySelector(".react-photo-album, .react-photo-album--rows");
    expect(photoAlbum).not.toBeNull();
  });

  it("configures RowsPhotoAlbum with larger grid size (DEFAULT_ELEMENT_ROW_HEIGHT >= 300)", () => {
    expect(DEFAULT_ELEMENT_ROW_HEIGHT).toBeGreaterThanOrEqual(300);
  });

  it("renders a ButtonGroup with bookmark (save) and delete icon action buttons on cards", () => {
    const onSetCover = vi.fn();
    const onDeleteImage = vi.fn();

    const { container } = renderWithClient(
      <ReferenceMediaGalleryGrid
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
    expect(coverBtns[0].className).toContain("text-neutral-800");

    const deleteBtns = screen.getAllByTitle(/supprimer/i);
    expect(deleteBtns.length).toBeGreaterThan(0);
    expect(deleteBtns[0].textContent).toContain("delete");
  });

  it("renders cards with rounded-xxxs border radius matching media item standard", () => {
    const { container } = renderWithClient(
      <ReferenceMediaGalleryGrid
        items={mockItems}
      />
    );

    const cards = container.querySelectorAll(".rounded-xxxs");
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      expect(card.className).toContain("rounded-xxxs");
      expect(card.className).not.toContain("rounded-2xl");
    });
  });

  it("provides right-click context menu containing cover and delete actions", () => {
    const onSetCover = vi.fn();
    const onDeleteImage = vi.fn();

    const { container } = renderWithClient(
      <ReferenceMediaGalleryGrid
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

  it("does not render the 'Ajouter une image' tile in ReferenceMediaGalleryGrid even when onUploadFiles is provided", () => {
    renderWithClient(
      <ReferenceMediaGalleryGrid
        items={mockItems}
        onUploadFiles={vi.fn()}
      />
    );

    expect(screen.queryByText("Ajouter une image")).toBeNull();
    expect(screen.queryByTitle("Ajouter une image de référence")).toBeNull();
  });

  it("disables Importer and Depuis le projet buttons when 6 reference images are reached", () => {
    const sixItems = Array.from({ length: 6 }, (_, i) => ({
      id: `img-${i + 1}`,
      url: `https://example.com/img-${i + 1}.png`,
    }));

    renderWithClient(
      <ElementDetailsGallery
        items={sixItems}
        maxAllowed={6}
        onUploadFiles={vi.fn()}
        onOpenAssets={vi.fn()}
        showTopActions={true}
      />
    );

    const importBtn = screen.getByRole("button", { name: /importer/i });
    const assetsBtn = screen.getByRole("button", { name: /depuis le projet/i });
    expect(importBtn).toBeDefined();
    expect(importBtn.hasAttribute("disabled")).toBe(true);
    expect(assetsBtn).toBeDefined();
    expect(assetsBtn.hasAttribute("disabled")).toBe(true);
  });

  it("clamps file selection in handleFileChange so total cannot exceed 6", () => {
    const fiveItems = Array.from({ length: 5 }, (_, i) => ({
      id: `img-${i + 1}`,
      url: `https://example.com/img-${i + 1}.png`,
    }));
    const onUploadFiles = vi.fn();

    const { container } = renderWithClient(
      <ElementDetailsGallery
        items={fiveItems}
        maxAllowed={6}
        onUploadFiles={onUploadFiles}
      />
    );

    const fileInput = container.querySelector('input[type="file"]');
    const fakeFiles = [
      new File(["1"], "1.png", { type: "image/png" }),
      new File(["2"], "2.png", { type: "image/png" }),
      new File(["3"], "3.png", { type: "image/png" }),
    ];

    fireEvent.change(fileInput, { target: { files: fakeFiles } });

    // Only 1 slot was remaining (6 - 5 = 1)
    expect(onUploadFiles).toHaveBeenCalledTimes(1);
    expect(onUploadFiles.mock.calls[0][0].length).toBe(1);
    expect(onUploadFiles.mock.calls[0][0][0].name).toBe("1.png");
  });
});
