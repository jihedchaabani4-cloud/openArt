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

vi.mock("../useUpdateCharacter", () => ({
  useUpdateCharacter: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("../useSetCharacterSheetMedia", () => ({
  useSetCharacterSheetMedia: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock("../useAddMediaToCharacter", () => ({
  useAddMediaToCharacter: () => ({ mutateAsync: vi.fn() }),
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
});
