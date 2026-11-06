import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCharacter } from "../useCharacter";

// Mocks
vi.mock("@/features/workflows/api/queries/useProjectData", () => ({
  useProjectData: vi.fn(),
}));

vi.mock("@/features/workflows/model/useWorkflowDelete", () => ({
  useWorkflowDelete: () => ({
    promptDelete: vi.fn(),
    confirmDelete: vi.fn(),
    isDeleting: false,
    isDeleteDialogOpen: false,
    setIsDeleteDialogOpen: vi.fn(),
  }),
}));

const { mockAddMediaMutate, stableAddMediaMutation } = vi.hoisted(() => {
  const mutate = vi.fn();
  return { mockAddMediaMutate: mutate, stableAddMediaMutation: { mutateAsync: mutate } };
});
const mockSetSheetMediaMutate = vi.fn();

vi.mock("../useUpdateCharacter", () => ({
  useUpdateCharacter: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("../useSetCharacterSheetMedia", () => ({
  useSetCharacterSheetMedia: () => ({ mutateAsync: mockSetSheetMediaMutate }),
}));
vi.mock("../useAddMediaToCharacter", () => ({
  useAddMediaToCharacter: () => stableAddMediaMutation,
}));
vi.mock("../useRemoveMediaFromCharacter", () => ({
  useRemoveMediaFromCharacter: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("../useGenerateCharacterSheetMutation", () => ({
  useGenerateCharacterSheetMutation: () => ({ mutateAsync: vi.fn() }),
}));

import { useProjectData } from "@/features/workflows/api/queries/useProjectData";

describe("useCharacter Hook - isProcessing & isFailed status resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not flag isProcessing as true when character has no media items (clean empty state)", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [
            {
              id: "char-1",
              name: "Empty Hero",
              workflow_type: "CHARACTER",
              status: "completed",
              items: [],
            },
          ],
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCharacter({ projectId: "proj-1", characterId: "char-1" })
    );

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isFailed).toBe(false);
    expect(result.current.activeSheetSrc).toBe(null);
  });

  it("flags isProcessing as true when mainMedia or workflow has status 'processing'", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [
            {
              id: "char-2",
              name: "Generating Hero",
              workflow_type: "CHARACTER",
              status: "processing",
            },
          ],
          media: [
            {
              id: "m-proc",
              workflow_id: "char-2",
              step_id: "character_sheet",
              status: "processing",
              url: null,
            },
          ],
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCharacter({ projectId: "proj-1", characterId: "char-2" })
    );

    expect(result.current.isProcessing).toBe(true);
    expect(result.current.isFailed).toBe(false);
  });

  it("flags isProcessing as false when sheet photo is available", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [
            {
              id: "char-3",
              name: "Completed Hero",
              workflow_type: "CHARACTER",
              status: "completed",
            },
          ],
          media: [
            {
              id: "m-done",
              workflow_id: "char-3",
              step_id: "character_sheet",
              status: "completed",
              url: "https://example.com/hero.png",
            },
          ],
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCharacter({ projectId: "proj-1", characterId: "char-3" })
    );

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.activeSheetSrc).toBe("https://example.com/hero.png");
  });

  it("flags isFailed as true when mainMedia has status 'failed' and no active sheet src", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [
            {
              id: "char-4",
              name: "Failed Hero",
              workflow_type: "CHARACTER",
              status: "failed",
            },
          ],
          media: [
            {
              id: "m-fail",
              workflow_id: "char-4",
              step_id: "character_sheet",
              status: "failed",
              url: null,
            },
          ],
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCharacter({ projectId: "proj-1", characterId: "char-4" })
    );

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.isFailed).toBe(true);
  });

  it("explicit primary_media_id pin wins as mainMedia even when the asset is a detail image (ADR 0005)", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [
            {
              id: "char-pin",
              name: "Pinned Detail Hero",
              workflow_type: "CHARACTER",
              primary_media_id: "m-detail-pin",
            },
          ],
          media: [
            {
              id: "m-sheet",
              workflow_id: "char-pin",
              step_id: "character_sheet",
              role: "sheet",
              status: "completed",
              url: "https://example.com/sheet.png",
            },
            {
              id: "m-detail-pin",
              workflow_id: "char-pin",
              step_id: "character_detail",
              role: "detail",
              status: "completed",
              url: "https://example.com/pinned-detail.png",
            },
          ],
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCharacter({ projectId: "proj-1", characterId: "char-pin" })
    );

    expect(result.current.mainMedia).toBeDefined();
    expect(result.current.mainMedia.id).toBe("m-detail-pin");
  });

  it("selectSheetAsset passes both mediaId and imageUrl in mutation payload", async () => {
    mockSetSheetMediaMutate.mockResolvedValueOnce({ media: { url: "https://example.com/asset.png" } });

    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [
            {
              id: "char-select",
              name: "Selectable Hero",
              workflow_type: "CHARACTER",
              status: "completed",
            },
          ],
        },
      },
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useCharacter({ projectId: "proj-1", characterId: "char-select" })
    );

    await result.current.selectSheetAsset([
      {
        id: "wf-gen-123",
        media_id: "media-uuid-456",
        mediaId: "media-uuid-456",
        url: "https://example.com/asset.png",
      },
    ]);

    expect(mockSetSheetMediaMutate).toHaveBeenCalledWith({
      characterId: "char-select",
      mediaId: "media-uuid-456",
      imageUrl: "https://example.com/asset.png",
      projectId: "proj-1",
    });
  });

  it("addDetailFromAssets excludes turnaround sheet media and responds reactively to loaded data", async () => {
    mockAddMediaMutate.mockResolvedValue({ media: { id: "new-detail-id", url: "https://example.com/valid-detail.png" } });

    // 1. Initial render: project data has not loaded yet
    useProjectData.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { result, rerender } = renderHook(() =>
      useCharacter({ projectId: "proj-1", characterId: "char-import" })
    );

    // 2. Data arrives with the character sheet after the initial render
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [
            {
              id: "char-import",
              name: "Importable Hero",
              workflow_type: "CHARACTER",
              status: "completed",
              primary_media_id: "sheet-media-1",
            },
          ],
          media: [
            {
              id: "sheet-media-1",
              workflow_id: "char-import",
              step_id: "character_sheet",
              role: "sheet",
              status: "completed",
              url: "https://example.com/sheet-turnaround.png",
            },
          ],
        },
      },
      isLoading: false,
    });
    rerender();

    expect(result.current.activeSheetSrc).toBe("https://example.com/sheet-turnaround.png");

    // 2. User tries to import a list of assets containing both the sheet and a new detail
    const selectedAssets = [
      {
        id: "sheet-media-1",
        mediaId: "sheet-media-1",
        url: "https://example.com/sheet-turnaround.png",
      },
      {
        id: "char-import", // workflow ID matching cleanId
        url: "https://example.com/another-sheet.png",
      },
      {
        id: "valid-detail-asset",
        mediaId: "valid-detail-asset",
        url: "https://example.com/valid-detail.png",
      },
    ];

    await result.current.addDetailFromAssets(selectedAssets);

    // Only the valid detail asset should be sent to mutation, sheet items strictly filtered
    expect(mockAddMediaMutate).toHaveBeenCalledTimes(1);
    expect(mockAddMediaMutate).toHaveBeenCalledWith({
      characterId: "char-import",
      mediaId: "valid-detail-asset",
      imageUrl: "https://example.com/valid-detail.png",
      projectId: "proj-1",
    });
  });
});
