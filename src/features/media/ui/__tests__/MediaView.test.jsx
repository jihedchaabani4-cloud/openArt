import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MediaView } from "../MediaView";
import { useResolvedMedia } from "@/features/workflows/model/useResolvedMedia";

vi.mock("@/features/workflows/model/useResolvedMedia", () => ({
  useResolvedMedia: vi.fn(),
}));

describe("MediaView - Unified Container", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders loading state when state is 'loading'", () => {
    useResolvedMedia.mockReturnValue({
      item: null,
      state: "loading",
    });

    render(<MediaView workflowId="wf-1" projectId="proj-1" />);

    expect(screen.getByRole("status")).toBeDefined();
  });

  it("renders empty state when state is 'empty'", () => {
    useResolvedMedia.mockReturnValue({
      item: null,
      state: "empty",
    });

    render(<MediaView workflowId="wf-empty" projectId="proj-1" />);

    expect(screen.getByText("No media items")).toBeDefined();
  });

  it("renders not found state when state is 'notFound'", () => {
    useResolvedMedia.mockReturnValue({
      item: null,
      state: "notFound",
    });

    render(<MediaView mediaId="m-missing" projectId="proj-1" />);

    expect(screen.getByText("Media not found")).toBeDefined();
  });

  it("renders card variant with slots when state is 'ready'", () => {
    useResolvedMedia.mockReturnValue({
      item: {
        id: "m-1",
        kind: "image",
        url: "https://example.com/art.png",
        name: "Concept Art",
        status: "ready",
      },
      state: "ready",
    });

    render(
      <MediaView
        workflowId="wf-1"
        projectId="proj-1"
        variant="card"
        headerSlot={<span data-testid="card-badge">Pinned</span>}
        actionSlot={<button data-testid="card-action">Delete</button>}
        footerSlot={<span data-testid="card-title">Concept Art</span>}
      />
    );

    expect(screen.getByTestId("card-badge").textContent).toBe("Pinned");
    expect(screen.getByTestId("card-action").textContent).toBe("Delete");
    expect(screen.getByTestId("card-title").textContent).toBe("Concept Art");
    expect(screen.getByRole("img", { name: "Concept Art" })).toBeDefined();
  });

  it("renders tile variant when variant='tile'", () => {
    useResolvedMedia.mockReturnValue({
      item: {
        id: "m-tile",
        kind: "image",
        url: "https://example.com/tile.png",
        name: "Tile Media",
        status: "ready",
      },
      state: "ready",
    });

    render(
      <MediaView
        mediaId="m-tile"
        projectId="proj-1"
        variant="tile"
        isSelected={true}
      />
    );

    const tile = screen.getByTestId("media-tile");
    expect(tile).toBeDefined();
    expect(tile.getAttribute("data-selected")).toBe("true");
  });

  it("renders chip variant when variant='chip'", () => {
    useResolvedMedia.mockReturnValue({
      item: {
        id: "m-chip",
        kind: "image",
        url: "https://example.com/avatar.png",
        name: "Hero Avatar",
        status: "ready",
      },
      state: "ready",
    });

    render(
      <MediaView
        mediaId="m-chip"
        projectId="proj-1"
        variant="chip"
        label="Cyberpunk Hero"
      />
    );

    expect(screen.getByText("Cyberpunk Hero")).toBeDefined();
  });

  it("calls render prop children({ item, state }) when passed", () => {
    useResolvedMedia.mockReturnValue({
      item: {
        id: "m-custom",
        url: "https://example.com/custom.png",
        status: "ready",
      },
      state: "ready",
    });

    render(
      <MediaView mediaId="m-custom" projectId="proj-1">
        {({ item, state }) => (
          <div data-testid="custom-render">
            Custom: {item.id} - {state}
          </div>
        )}
      </MediaView>
    );

    expect(screen.getByTestId("custom-render").textContent).toBe(
      "Custom: m-custom - ready"
    );
  });
});
