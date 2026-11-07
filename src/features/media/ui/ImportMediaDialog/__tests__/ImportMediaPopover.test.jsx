import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImportMediaPopover } from "../ImportMediaPopover";

vi.mock("next/navigation", () => ({
  useParams: () => ({ projectId: "proj-1" }),
}));

const mockProjectData = {
  projectContents: {
    workflows: [
      {
        id: "wf-gen-1",
        name: "wf-gen-1",
        display_name: "Generated Sunset",
        workflow_type: "IMAGE",
        primary_media_id: "media-gen-1",
        metadata: { displayName: "Generated Sunset", primaryMediaId: "media-gen-1" },
      },
      {
        id: "wf-char-1",
        name: "wf-char-1",
        display_name: "Hero Aria",
        workflow_type: "CHARACTER",
        primary_media_id: "media-char-1",
        metadata: { displayName: "Hero Aria", primaryMediaId: "media-char-1" },
      },
      {
        id: "wf-elem-1",
        name: "wf-elem-1",
        display_name: "Ancient Sword",
        workflow_type: "ELEMENT_SHEET",
        primary_media_id: "media-elem-1",
        metadata: { displayName: "Ancient Sword", primaryMediaId: "media-elem-1" },
      },
      {
        id: "wf-upload-1",
        name: "wf-upload-1",
        display_name: "Uploaded Photo",
        workflow_type: "UPLOAD",
        primary_media_id: "media-up-1",
        metadata: { displayName: "Uploaded Photo", primaryMediaId: "media-up-1" },
      },
    ],
    media: [
      {
        id: "media-gen-1",
        workflowId: "wf-gen-1",
        url: "https://cdn.example.com/gen-1.png",
        create_time: "2026-10-31T10:00:00Z",
      },
      {
        id: "media-char-1",
        workflowId: "wf-char-1",
        url: "https://cdn.example.com/char-1.png",
        is_upload: true,
        create_time: "2026-10-31T10:01:00Z",
      },
      {
        id: "media-elem-1",
        workflowId: "wf-elem-1",
        url: "https://cdn.example.com/elem-1.png",
        create_time: "2026-10-31T10:02:00Z",
      },
      {
        id: "media-up-1",
        workflowId: "wf-upload-1",
        url: "https://cdn.example.com/up-1.png",
        is_upload: true,
        create_time: "2026-10-31T10:03:00Z",
      },
    ],
  },
};

vi.mock("@/features/workflows/api/workflowsApi", () => ({
  useProjectData: () => ({ data: mockProjectData }),
}));

vi.mock("@/features/media", () => ({
  useUploadMedia: () => ({ uploadMedia: vi.fn(), isUploading: false }),
  MediaViewCard: React.forwardRef(function MockMediaViewCard({ item, onSelect }, ref) {
    return (
      <div
        ref={ref}
        data-testid={`media-card-${item.id}`}
        data-type={item.type}
        onClick={onSelect}
      >
        {item.display_name}
      </div>
    );
  }),
}));

vi.mock("react-photo-album", () => ({
  RowsPhotoAlbum: ({ photos, render: renderProp }) => (
    <div data-testid="rows-photo-album">
      {photos.map((photo, idx) =>
        renderProp.photo({}, { photo, width: 160, height: 160, index: idx })
      )}
    </div>
  ),
}));

describe("ImportMediaPopover — 'All' tab shows all allowed categories (not just media)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows generated media, uploads, characters, and elements together in the 'All' tab when allowedType is ['image', 'character', 'element']", () => {
    render(
      <ImportMediaPopover
        open={true}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        allowedType={["image", "character", "element"]}
        mode="all"
        variant="panel"
      />
    );

    const allTab = screen.getByRole("tab", { name: /All/i });
    expect(allTab.getAttribute("aria-selected")).toBe("true");

    expect(screen.getByTestId("media-card-wf-gen-1")).toBeTruthy();
    expect(screen.getByTestId("media-card-wf-upload-1")).toBeTruthy();
    expect(screen.getByTestId("media-card-wf-char-1").getAttribute("data-type")).toBe("character");
    expect(screen.getByTestId("media-card-wf-elem-1").getAttribute("data-type")).toBe("element");

    // Verify category filtering still works when clicking individual tabs
    fireEvent.click(screen.getByRole("tab", { name: /Characters/i }));
    expect(screen.getByTestId("media-card-wf-char-1")).toBeTruthy();
    expect(screen.queryByTestId("media-card-wf-gen-1")).toBeNull();
    expect(screen.queryByTestId("media-card-wf-elem-1")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: /Elements/i }));
    expect(screen.getByTestId("media-card-wf-elem-1")).toBeTruthy();
    expect(screen.queryByTestId("media-card-wf-char-1")).toBeNull();

    // Switching back to All shows all items again
    fireEvent.click(allTab);
    expect(screen.getByTestId("media-card-wf-gen-1")).toBeTruthy();
    expect(screen.getByTestId("media-card-wf-upload-1")).toBeTruthy();
    expect(screen.getByTestId("media-card-wf-char-1").getAttribute("data-type")).toBe("character");
    expect(screen.getByTestId("media-card-wf-elem-1").getAttribute("data-type")).toBe("element");
  });
});
