import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ReferenceMediaGalleryGrid,
  ReferenceMediaCard,
  DEFAULT_REFERENCE_ROW_HEIGHT,
  DEFAULT_CHARACTER_ROW_HEIGHT,
} from "../ReferenceMediaGalleryGrid";

vi.mock("@/features/workflows", () => ({
  useWorkflowDetailsQuery: () => ({ data: null, isLoading: false }),
  useWorkflowHistoryQuery: () => ({ data: [], isLoading: false }),
  useWorkflowLikesQuery: () => ({
    likes: new Set(),
    isLiked: () => false,
    likeCount: () => 0,
    toggleLike: vi.fn(),
  }),
  useToggleWorkflowLike: () => ({ mutate: vi.fn() }),
  useRemoveWorkflow: () => ({ mutate: vi.fn() }),
  useRemoveAsset: () => ({ mutate: vi.fn() }),
  useUpdateWorkflow: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("@/features/studio", () => ({
  usePromptStore: Object.assign(
    (selector) => (selector ? selector({ isDraggingGalleryItem: false }) : { isDraggingGalleryItem: false }),
    {
      getState: () => ({
        setIsDraggingGalleryItem: vi.fn(),
        setDraggedItem: vi.fn(),
        isDraggingGalleryItem: false,
      }),
    }
  ),
  useStudioItemDrag: () => ({
    isDraggingThis: false,
    dragTarget: null,
    justDraggedRef: { current: false },
    handlePointerDown: vi.fn(),
  }),
}));

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

describe("ReferenceMediaGalleryGrid & ReferenceMediaCard Consolidation", () => {
  let clientWidthSpy;

  beforeEach(() => {
    clientWidthSpy = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => 900);
  });

  afterEach(() => {
    cleanup();
    clientWidthSpy?.mockRestore();
  });

  const mockItems = [
    {
      id: "media-1",
      url: "https://example.com/photo1.jpg",
      is_primary: true,
    },
    {
      id: "media-2",
      url: "https://example.com/photo2.jpg",
      is_primary: false,
    },
  ];

  it("exports matching row height constants", () => {
    expect(DEFAULT_REFERENCE_ROW_HEIGHT).toBe(300);
    expect(DEFAULT_CHARACTER_ROW_HEIGHT).toBe(300);
  });

  it("renders gallery cards via SharedGalleryGrid without border-white/10 and with rounded-xxxs", () => {
    const { container } = renderWithClient(
      <ReferenceMediaGalleryGrid
        items={mockItems}
        primaryMediaId="media-1"
      />
    );

    const cards = container.querySelectorAll(".group");
    expect(cards.length).toBe(2);
    cards.forEach((card) => {
      expect(card.className).toContain("rounded-xxxs");
      expect(card.className).not.toContain("border-white/10");
    });
  });

  it("triggers onSetCover with mediaId on bookmark action click", () => {
    const onSetCover = vi.fn();
    renderWithClient(
      <ReferenceMediaGalleryGrid
        items={mockItems}
        primaryMediaId="media-1"
        onSetCover={onSetCover}
      />
    );

    const coverBtns = screen.getAllByTitle(/couverture/i);
    expect(coverBtns.length).toBe(2);

    // Click cover on the second item (media-2)
    fireEvent.click(coverBtns[1]);
    expect(onSetCover).toHaveBeenCalledWith("media-2");
  });

  it("triggers onDeleteImage with item object on delete action click", () => {
    const onDeleteImage = vi.fn();
    renderWithClient(
      <ReferenceMediaGalleryGrid
        items={mockItems}
        onDeleteImage={onDeleteImage}
      />
    );

    const deleteBtns = screen.getAllByTitle(/supprimer/i);
    expect(deleteBtns.length).toBe(2);

    fireEvent.click(deleteBtns[0]);
    expect(onDeleteImage).toHaveBeenCalled();
    expect(onDeleteImage.mock.calls[0][0].id).toBe("media-1");
  });

  it("displays loading spinner overlay when item is deleting or pending", () => {
    const { container: c1 } = renderWithClient(
      <ReferenceMediaGalleryGrid
        items={mockItems}
        deletingMediaId="media-1"
      />
    );

    const spinIcons1 = c1.querySelectorAll(".animate-spin");
    expect(spinIcons1.length).toBe(1);

    const { container: c2 } = renderWithClient(
      <ReferenceMediaGalleryGrid
        items={mockItems}
        pendingUrls={["https://example.com/photo2.jpg"]}
      />
    );

    const spinIcons2 = c2.querySelectorAll(".animate-spin");
    expect(spinIcons2.length).toBe(1);
  });

  it("renders ReferenceMediaCard standalone with correct props", () => {
    const onSetCover = vi.fn();
    const onDeleteImage = vi.fn();

    renderWithClient(
      <ReferenceMediaCard
        item={mockItems[1]}
        width={300}
        height={400}
        onSetCover={onSetCover}
        onDeleteImage={onDeleteImage}
      />
    );

    const coverBtn = screen.getByTitle("Définir comme couverture");
    expect(coverBtn).toBeDefined();
    fireEvent.click(coverBtn);
    expect(onSetCover).toHaveBeenCalledWith("media-2");
  });
});
