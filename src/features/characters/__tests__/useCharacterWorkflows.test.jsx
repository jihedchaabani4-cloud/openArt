import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCharacterWorkflows } from "../useCharacterWorkflows";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";

vi.mock("@/features/workflows/api/queries/useProjectData", () => ({
  useProjectData: vi.fn(),
}));

describe("useCharacterWorkflows", () => {
  it("resolves character mainMedia using canonical resolver and respects primary_media_id pin", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [
            {
              id: "char-1",
              workflow_type: "CHARACTER",
              primary_media_id: "m-pin-detail",
            },
            {
              id: "gen-1",
              workflow_type: "GENERATION",
            },
          ],
          media: [
            {
              id: "m-sheet",
              workflow_id: "char-1",
              step_id: "character_sheet",
              role: "sheet",
              url: "https://example.com/sheet.png",
              status: "completed",
            },
            {
              id: "m-pin-detail",
              workflow_id: "char-1",
              step_id: "character_detail",
              role: "detail",
              url: "https://example.com/detail.png",
              status: "completed",
            },
          ],
        },
      },
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() => useCharacterWorkflows("proj-1"));

    expect(result.current.workflows).toHaveLength(1);
    const charWf = result.current.workflows[0];
    expect(charWf.id).toBe("char-1");
    expect(charWf.mainMedia).toBeDefined();
    expect(charWf.mainMedia.id).toBe("m-pin-detail");
    expect(charWf.status).toBe("completed");
    expect(charWf.primary_media_url).toBe("https://example.com/detail.png");
  });

  it("prioritizes processing status over url presence for in-flight character sheets", () => {
    useProjectData.mockReturnValue({
      data: {
        projectContents: {
          workflows: [
            {
              id: "char-in-flight",
              workflow_type: "CHARACTER",
            },
          ],
          media: [
            {
              id: "m-preview",
              workflow_id: "char-in-flight",
              role: "sheet",
              url: "https://example.com/preview-frame.png",
              status: "processing",
            },
          ],
        },
      },
      isLoading: false,
      isError: false,
    });

    const { result } = renderHook(() => useCharacterWorkflows("proj-1"));
    expect(result.current.workflows).toHaveLength(1);
    expect(result.current.workflows[0].status).toBe("processing");
  });
});
