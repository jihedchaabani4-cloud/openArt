import { describe, it, expect } from "vitest";
import { resolveEditNavbarBackDestination } from "../EditNavbar";

describe("resolveEditNavbarBackDestination", () => {
  const projectId = "proj-123";
  const folders = [
    { id: "col-1", name: "Landscapes" },
    { id: "col-2", name: "Characters" },
  ];

  it("returns collection route and folder name when workflow has folder_id", () => {
    const workflow = {
      id: "wf-1",
      folder_id: "col-1",
    };

    const result = resolveEditNavbarBackDestination({
      workflow,
      projectId,
      folders,
    });

    expect(result.collectionId).toBe("col-1");
    expect(result.destination).toBe("/cinema-studio/proj-123/collection/col-1");
    expect(result.label).toBe("Back to Landscapes");
  });

  it("returns collection route when workflow has folderId in metadata", () => {
    const workflow = {
      id: "wf-2",
      metadata: { folder_id: "col-2" },
    };

    const result = resolveEditNavbarBackDestination({
      workflow,
      projectId,
      folders,
    });

    expect(result.collectionId).toBe("col-2");
    expect(result.destination).toBe("/cinema-studio/proj-123/collection/col-2");
    expect(result.label).toBe("Back to Characters");
  });

  it("falls back to 'Back to collection' if folder name is not in folders list", () => {
    const workflow = {
      id: "wf-3",
      folder_id: "col-unknown",
    };

    const result = resolveEditNavbarBackDestination({
      workflow,
      projectId,
      folders,
    });

    expect(result.collectionId).toBe("col-unknown");
    expect(result.destination).toBe("/cinema-studio/proj-123/collection/col-unknown");
    expect(result.label).toBe("Back to collection");
  });

  it("returns root assets route when workflow does not belong to any collection", () => {
    const workflow = {
      id: "wf-4",
      folder_id: null,
    };

    const result = resolveEditNavbarBackDestination({
      workflow,
      projectId,
      folders,
    });

    expect(result.collectionId).toBeNull();
    expect(result.destination).toBe("/cinema-studio/proj-123/assets");
    expect(result.label).toBe("Back to assets");
  });

  it("uses queryCollectionId if workflow is not loaded yet", () => {
    const result = resolveEditNavbarBackDestination({
      workflow: null,
      queryCollectionId: "col-1",
      projectId,
      folders,
    });

    expect(result.collectionId).toBe("col-1");
    expect(result.destination).toBe("/cinema-studio/proj-123/collection/col-1");
    expect(result.label).toBe("Back to Landscapes");
  });

  it("respects custom fallbackBackUrl and fallbackBackLabel when not in collection", () => {
    const workflow = {
      id: "wf-element",
      folder_id: null,
    };

    const result = resolveEditNavbarBackDestination({
      workflow,
      projectId,
      folders,
      fallbackBackUrl: "/cinema-studio/proj-123/elements",
      fallbackBackLabel: "Back to elements",
    });

    expect(result.collectionId).toBeNull();
    expect(result.destination).toBe("/cinema-studio/proj-123/elements");
    expect(result.label).toBe("Back to elements");
  });
});
