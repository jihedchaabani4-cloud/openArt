import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { LibraryMediaGridItem } from "../LibraryMediaGridItem";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/workflows/api/workflowsApi", () => ({
  useRemoveWorkflow: () => ({ mutate: vi.fn() }),
  useToggleWorkflowLike: () => ({ mutate: vi.fn() }),
}));

describe("LibraryMediaGridItem - Candidate Media Resolution (B5d)", () => {
  it("renders turnaround sheet from candidates instead of a broken placeholder when primary_media is null", () => {
    const unpinnedEntry = {
      workflow: {
        id: "wf-char-1",
        workflow_type: "CHARACTER",
        display_name: "Cyber Hero",
        favorited: false,
      },
      primary_media: null,
      candidates: [
        {
          id: "m-detail-1",
          role: "detail",
          url: "https://example.com/detail-1.png",
          status: "completed",
        },
        {
          id: "m-sheet-1",
          role: "sheet",
          workflowStepId: "CAE",
          url: "https://example.com/turnaround-sheet.png",
          status: "completed",
        },
      ],
    };

    const { container } = render(<LibraryMediaGridItem entry={unpinnedEntry} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("https://example.com/turnaround-sheet.png");
  });

  it("renders explicit primary_media when pinned by the user", () => {
    const pinnedEntry = {
      workflow: {
        id: "wf-char-2",
        workflow_type: "CHARACTER",
        display_name: "Pinned Hero",
        favorited: true,
      },
      primary_media: {
        id: "m-detail-pinned",
        url: "https://example.com/pinned-portrait.png",
        status: "completed",
      },
      candidates: [
        {
          id: "m-sheet-2",
          role: "sheet",
          url: "https://example.com/sheet-2.png",
          status: "completed",
        },
      ],
    };

    const { container } = render(<LibraryMediaGridItem entry={pinnedEntry} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toBe("https://example.com/pinned-portrait.png");
  });
});
