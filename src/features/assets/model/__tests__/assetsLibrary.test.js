import { describe, it, expect } from "vitest";
import {
  resolveLibraryEntryMedia,
  buildGroupedPhotos,
  filterLibraryItems,
  getEntryTimestamp,
  buildDownloadFilename,
} from "../assetsLibrary";

describe("assetsLibrary - Candidate Media Resolution (B5d)", () => {
  it("uses explicit primary_media when present on the library entry", () => {
    const entry = {
      workflow: {
        id: "wf-pinned",
        workflow_type: "CHARACTER",
        display_name: "Pinned Hero",
      },
      primary_media: {
        id: "m-pinned-detail",
        url: "https://example.com/pinned-detail.png",
        status: "completed",
        width: 800,
        height: 1200,
        create_time: "2026-10-15T10:00:00Z",
      },
      candidates: [
        {
          id: "m-sheet",
          role: "sheet",
          url: "https://example.com/sheet.png",
          status: "completed",
        },
        {
          id: "m-pinned-detail",
          role: "detail",
          url: "https://example.com/pinned-detail.png",
          status: "completed",
        },
      ],
    };

    const resolved = resolveLibraryEntryMedia(entry);
    expect(resolved.id).toBe("m-pinned-detail");
    expect(resolved.url).toBe("https://example.com/pinned-detail.png");

    const groups = buildGroupedPhotos([entry]);
    expect(groups).toHaveLength(1);
    expect(groups[0].photos[0].src).toBe("https://example.com/pinned-detail.png");
  });

  it("resolves turnaround sheet over detail portraits when primary_media is null", () => {
    const unpinnedCharacterEntry = {
      workflow: {
        id: "wf-char-unpinned",
        workflow_type: "CHARACTER",
        display_name: "Unpinned Character",
        create_time: "2026-10-16T12:00:00Z",
      },
      primary_media: null,
      candidates: [
        {
          id: "m-detail-1",
          role: "detail",
          url: "https://example.com/portrait-1.png",
          status: "completed",
          width: 1024,
          height: 1024,
        },
        {
          id: "m-turnaround-sheet",
          role: "sheet",
          workflowStepId: "CAE",
          url: "https://example.com/turnaround-sheet.png",
          status: "completed",
          width: 1536,
          height: 1024,
          create_time: "2026-10-16T12:01:00Z",
        },
      ],
    };

    const resolved = resolveLibraryEntryMedia(unpinnedCharacterEntry);
    expect(resolved.id).toBe("m-turnaround-sheet");
    expect(resolved.url).toBe("https://example.com/turnaround-sheet.png");

    const groups = buildGroupedPhotos([unpinnedCharacterEntry]);
    expect(groups).toHaveLength(1);
    expect(groups[0].photos).toHaveLength(1);
    expect(groups[0].photos[0].src).toBe("https://example.com/turnaround-sheet.png");
    expect(getEntryTimestamp(unpinnedCharacterEntry)).toBe("2026-10-16T12:01:00Z");
    expect(buildDownloadFilename(unpinnedCharacterEntry)).toBe("Unpinned Character.png");
  });

  it("selects the earliest non-detail output candidate (created_at ASC) when primary_media is null", () => {
    const unpinnedGenEntry = {
      workflow: {
        id: "wf-gen-unpinned",
        workflow_type: "GENERATION",
        display_name: "Scene Gen",
      },
      primary_media: null,
      candidates: [
        {
          id: "m-detail",
          role: "detail",
          url: "https://example.com/ref-detail.png",
          status: "completed",
          created_at: "2026-10-17T08:00:00Z",
        },
        {
          id: "m-output-late",
          role: "output",
          url: "https://example.com/output-late.png",
          status: "completed",
          created_at: "2026-10-17T10:00:00Z",
        },
        {
          id: "m-output-early",
          role: "output",
          url: "https://example.com/output-early.png",
          status: "completed",
          created_at: "2026-10-17T09:00:00Z",
        },
      ],
    };

    const resolved = resolveLibraryEntryMedia(unpinnedGenEntry);
    expect(resolved.id).toBe("m-output-early");
    expect(resolved.url).toBe("https://example.com/output-early.png");

    const filtered = filterLibraryItems([unpinnedGenEntry], { mediaFilter: "image" });
    expect(filtered).toHaveLength(1);
  });
});
