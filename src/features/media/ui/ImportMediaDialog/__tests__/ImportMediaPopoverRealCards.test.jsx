import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { ImportMediaPopover } from "../ImportMediaPopover";

vi.mock("next/navigation", () => ({
  useParams: () => ({ projectId: "proj-real-cards" }),
}));

// Mock only upload media and RowsPhotoAlbum (layout container), but keep real MediaViewCard and MediaView!
vi.mock("@/features/media", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useUploadMedia: () => ({ uploadMedia: vi.fn(), isUploading: false }),
  };
});

vi.mock("react-photo-album", () => ({
  RowsPhotoAlbum: ({ photos, render: renderProp }) => (
    <div data-testid="rows-photo-album">
      {photos.map((photo, idx) =>
        renderProp.photo({}, { photo, width: 160, height: 160, index: idx })
      )}
    </div>
  ),
}));

const mockProjectDataWithElementsAndImages = {
  projectContents: {
    workflows: [
      {
        id: "wf-element-sheet-1",
        name: "wf-element-sheet-1",
        display_name: "Magic Shield",
        workflow_type: "ELEMENT_SHEET",
        primary_media_id: "media-shield-1",
        metadata: { displayName: "Magic Shield", primaryMediaId: "media-shield-1" },
      },
      {
        id: "wf-image-gen-1",
        name: "wf-image-gen-1",
        display_name: "Ancient Castle",
        workflow_type: "IMAGE",
        primary_media_id: "media-castle-1",
        metadata: { displayName: "Ancient Castle", primaryMediaId: "media-castle-1" },
      },
    ],
    media: [
      {
        id: "media-shield-1",
        workflowId: null, // Decoupled workflow_id as in ADR-0007 / DB reality
        workflow_id: null,
        url: "https://example.com/shield.png",
        status: "success", // DB stores "success"
        create_time: "2026-10-31T10:00:00Z",
      },
      {
        id: "media-castle-1",
        workflowId: null,
        workflow_id: null,
        url: "https://example.com/castle.png",
        status: "success", // DB stores "success"
        create_time: "2026-10-31T10:01:00Z",
      },
    ],
  },
};

vi.mock("@/features/workflows/api/workflowsApi", () => ({
  useProjectData: () => ({ data: mockProjectDataWithElementsAndImages }),
}));

describe("ImportMediaPopover — Real MediaViewCard & MediaView rendering with DB 'success' status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders <img> elements for all cards instead of blank black tiles when media status is 'success'", () => {
    render(
      <ImportMediaPopover
        open={true}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        allowedType={["image", "element"]}
        mode="all"
        variant="panel"
      />
    );

    const images = document.querySelectorAll("img");
    expect(images.length).toBe(2);

    const sources = Array.from(images).map((img) => img.getAttribute("src"));
    expect(sources).toContain("https://example.com/shield.png");
    expect(sources).toContain("https://example.com/castle.png");
  });
});
