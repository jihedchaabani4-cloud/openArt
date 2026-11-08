import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { CharacterDetailsGallery } from "./CharacterDetailsGallery";
import { ReferenceMediaGalleryGrid, DEFAULT_REFERENCE_ROW_HEIGHT as DEFAULT_CHARACTER_ROW_HEIGHT } from "@/features/media";

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

  it("does not render top action buttons by default, keeping actions cleanly in navbar", () => {
    renderWithClient(
      <CharacterDetailsGallery
        items={mockItems}
        primaryMediaId="item-1"
        onOpenAssets={vi.fn()}
      />
    );

    expect(screen.queryByTitle("Importer depuis l'ordinateur")).toBeNull();
    expect(screen.queryByTitle("Ajouter à partir du projet")).toBeNull();
  });

  it("renders sleek header with compact action buttons when showTopActions is explicitly true", () => {
    renderWithClient(
      <CharacterDetailsGallery
        items={mockItems}
        primaryMediaId="item-1"
        showTopActions={true}
        onOpenAssets={vi.fn()}
      />
    );

    // 2 action buttons (Upload and Select Assets) with blur variant must be present
    const uploadBtn = screen.getByTitle("Importer depuis l'ordinateur");
    const assetsBtn = screen.getByTitle("Ajouter à partir du projet");
    expect(uploadBtn).toBeDefined();
    expect(assetsBtn).toBeDefined();
    expect(uploadBtn.className).toContain("rounded-full");
  });

  it("strictly filters out any character sheet media from the details gallery", () => {
    const mixedItems = [
      {
        id: "sheet-item-1",
        url: "https://example.com/sheet.png",
        role: "sheet",
        status: "completed",
      },
      {
        id: "sheet-item-2",
        url: "https://example.com/turnaround.png",
        step_id: "character_sheet",
        status: "completed",
      },
      {
        id: "detail-item-1",
        url: "https://example.com/detail.png",
        role: "detail",
        status: "completed",
      },
      {
        // Explicit detail role must win over the legacy image_generation fallback
        id: "detail-item-2",
        url: "https://example.com/detail-generated.png",
        role: "detail",
        step_id: "image_generation",
        status: "completed",
      },
    ];

    const { container } = renderWithClient(
      <CharacterDetailsGallery
        items={mixedItems}
        onUploadFiles={vi.fn()}
      />
    );

    // Only the two detail items should be rendered in the details gallery
    expect(container.querySelectorAll(".group").length).toBe(2);
  });

  it("keeps AI-generated detail image visible when role is 'detail' and step_id is 'image_generation'", () => {
    const items = [
      {
        id: "ai-detail-1",
        url: "https://example.com/ai-detail.png",
        role: "detail",
        step_id: "image_generation",
        status: "completed",
      },
      {
        id: "ai-detail-2",
        url: "https://example.com/ai-detail-ref.png",
        role: "reference",
        step_id: "image_generation",
        status: "completed",
      },
    ];

    const { container } = renderWithClient(
      <CharacterDetailsGallery
        items={items}
      />
    );

    // Both AI-generated detail items must remain visible
    expect(container.querySelectorAll(".group").length).toBe(2);
  });

  it("excludes character sheet and turnaround media from the details gallery", () => {
    const items = [
      {
        id: "sheet-1",
        url: "https://example.com/sheet-1.png",
        role: "sheet",
        status: "completed",
      },
      {
        id: "turnaround-1",
        url: "https://example.com/turnaround-1.png",
        role: "turnaround",
        status: "completed",
      },
      {
        id: "media-role-sheet",
        url: "https://example.com/media-role-sheet.png",
        mediaRole: "sheet",
        status: "completed",
      },
      {
        id: "valid-detail",
        url: "https://example.com/valid-detail.png",
        role: "detail",
        status: "completed",
      },
    ];

    const { container } = renderWithClient(
      <CharacterDetailsGallery
        items={items}
      />
    );

    // Only valid-detail should pass
    expect(container.querySelectorAll(".group").length).toBe(1);
  });

  it("excludes character sheet with conflicting metadata (e.g. raw.role vs step_id)", () => {
    const items = [
      {
        id: "conflict-raw-sheet",
        url: "https://example.com/raw-sheet.png",
        raw: { role: "sheet" },
        step_id: "upload", // uploaded turnaround sheet
        status: "completed",
      },
      {
        id: "conflict-media-role",
        url: "https://example.com/media-turnaround.png",
        mediaRole: "turnaround",
        step_id: "character_detail",
        status: "completed",
      },
      {
        id: "pure-detail",
        url: "https://example.com/pure-detail.png",
        raw: { role: "detail" },
        status: "completed",
      },
    ];

    const { container } = renderWithClient(
      <CharacterDetailsGallery
        items={items}
      />
    );

    // The two conflicting sheet items must be excluded; only pure-detail survives
    expect(container.querySelectorAll(".group").length).toBe(1);
  });

  it("handles legacy media without explicit role using step_id provenance fallback", () => {
    const legacyItems = [
      {
        id: "legacy-sheet",
        url: "https://example.com/legacy-sheet.png",
        // no role
        step_id: "character_sheet",
        status: "completed",
      },
      {
        id: "legacy-image-gen",
        url: "https://example.com/legacy-gen.png",
        // no role: legacy character generation was sheet
        step_id: "image_generation",
        status: "completed",
      },
      {
        id: "legacy-cae",
        url: "https://example.com/legacy-cae.png",
        // no role: CAE sheet
        step_id: "CAE",
        status: "completed",
      },
      {
        id: "legacy-detail",
        url: "https://example.com/legacy-detail.png",
        // no role: detail step
        step_id: "character_detail",
        status: "completed",
      },
      {
        id: "legacy-upload",
        url: "https://example.com/legacy-upload.png",
        // no role: direct upload
        step_id: "upload",
        status: "completed",
      },
    ];

    const { container } = renderWithClient(
      <CharacterDetailsGallery
        items={legacyItems}
      />
    );

    // Only legacy-detail and legacy-upload should be shown (2 out of 5)
    expect(container.querySelectorAll(".group").length).toBe(2);
  });

  it("renders FlowCharacterImagePreview for selecting details when items is empty", () => {
    const { container } = renderWithClient(
      <CharacterDetailsGallery
        items={[]}
        onOpenAssets={vi.fn()}
      />
    );

    expect(container.querySelector("[data-component='flow-character-image-preview']")).not.toBeNull();
  });

  it("ReferenceMediaGalleryGrid renders reference items cleanly without forced 1:1 or 4:3 aspect ratio", () => {
    const { container } = renderWithClient(
      <ReferenceMediaGalleryGrid
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

    const photoAlbum = container.querySelector(".react-photo-album, .react-photo-album--rows");
    expect(photoAlbum).not.toBeNull();
  });

  it("uses the 16px reference gallery spacing by default", () => {
    const { container } = renderWithClient(
      <ReferenceMediaGalleryGrid items={mockItems} />
    );

    const photoAlbum = container.querySelector(".react-photo-album");
    expect(photoAlbum).not.toBeNull();
    expect(
      photoAlbum.style.getPropertyValue("--react-photo-album--spacing")
    ).toBe("16");
  });

  it("honors an explicit spacing prop for reference grids", () => {
    const { container } = renderWithClient(
      <ReferenceMediaGalleryGrid items={mockItems} spacing={4} />
    );

    const photoAlbum = container.querySelector(".react-photo-album");
    expect(photoAlbum).not.toBeNull();
    expect(
      photoAlbum.style.getPropertyValue("--react-photo-album--spacing")
    ).toBe("4");
  });

  it("configures RowsPhotoAlbum with larger grid size (DEFAULT_CHARACTER_ROW_HEIGHT >= 300)", () => {
    expect(DEFAULT_CHARACTER_ROW_HEIGHT).toBeGreaterThanOrEqual(300);
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

  it("supports all existing supported detail image formats (items, displayDetailImages, detailPhotos)", () => {
    // 1. items prop
    const { container: container1 } = renderWithClient(
      <CharacterDetailsGallery
        items={mockItems}
      />
    );
    expect(container1.querySelectorAll(".group").length).toBe(2);

    // 2. displayDetailImages prop
    const { container: container2 } = renderWithClient(
      <CharacterDetailsGallery
        displayDetailImages={mockItems}
      />
    );
    expect(container2.querySelectorAll(".group").length).toBe(2);

    // 3. detailPhotos prop with { key, src }
    const { container: container3 } = renderWithClient(
      <CharacterDetailsGallery
        detailPhotos={[
          { key: "p-1", src: "https://example.com/p1.png" },
          { key: "p-2", src: "https://example.com/p2.png" },
        ]}
      />
    );
    expect(container3.querySelectorAll(".group").length).toBe(2);

    // 4. detailPhotos prop with { ref }
    const { container: container4 } = renderWithClient(
      <CharacterDetailsGallery
        detailPhotos={[
          { ref: { id: "p-ref-1", url: "https://example.com/p1.png", role: "detail" } },
          { ref: { id: "p-ref-2", url: "https://example.com/p2.png", role: "detail" } },
        ]}
      />
    );
    expect(container4.querySelectorAll(".group").length).toBe(2);
  });
});
