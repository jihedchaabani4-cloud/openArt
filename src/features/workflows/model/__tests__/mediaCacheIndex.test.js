import { describe, it, expect } from "vitest";
import * as mediaCacheIndexModule from "../mediaCacheIndex";
import { buildProjectMediaIndex } from "../mediaCacheIndex";

describe("mediaCacheIndex - Composite Placement & Dual-Order Determinism (B5a)", () => {
  it("abolishes home workflow bias and ignores unbacked legacy home workflow pointers", () => {
    const legacyHelperKey = ["isHome", "WorkflowMedia"].join("");
    const legacySnakeKey = ["home", "workflow", "id"].join("_");
    const legacyCamelKey = ["home", "Workflow", "Id"].join("");

    expect(mediaCacheIndexModule[legacyHelperKey]).toBeUndefined();

    const wf1Placement = {
      id: "m-shared",
      workflow_id: "wf-1",
      role: "detail",
      url: "https://example.com/shared.png",
    };
    const wf2PlacementWithLegacyPointers = {
      id: "m-shared",
      workflow_id: "wf-2",
      [legacySnakeKey]: "wf-2",
      [legacyCamelKey]: "wf-2",
      role: "output",
      url: "https://example.com/shared.png",
    };

    const index = buildProjectMediaIndex({
      projectContents: {
        workflows: [{ id: "wf-1" }, { id: "wf-2" }],
        media: [wf1Placement, wf2PlacementWithLegacyPointers],
      },
    });

    // byMediaId simply retains the normalized item without home preference
    const byId = index.byMediaId.get("m-shared");
    expect(byId).toBeDefined();
    expect(byId.id).toBe("m-shared");
    expect(byId.workflowId).toBe("wf-1");
    expect(byId.role).toBe("detail");
  });

  it("produces identical, deterministic composite and workflow lookups regardless of arrival order ([wf1, wf2] vs [wf2, wf1])", () => {
    const wf1Placement = {
      id: "m-shared",
      workflow_id: "wf-1",
      role: "output",
      url: "https://example.com/shared.png",
      status: "success",
    };
    const wf2Placement = {
      id: "m-shared",
      workflow_id: "wf-2",
      role: "detail",
      url: "https://example.com/shared.png",
      status: "success",
    };

    const indexOrderA = buildProjectMediaIndex({
      projectContents: {
        workflows: [{ id: "wf-1" }, { id: "wf-2" }],
        media: [wf1Placement, wf2Placement],
      },
    });

    const indexOrderB = buildProjectMediaIndex({
      projectContents: {
        workflows: [{ id: "wf-1" }, { id: "wf-2" }],
        media: [{ ...wf2Placement }, { ...wf1Placement }],
      },
    });

    // Composite lookups are identical across both arrival orders
    expect(indexOrderA.byCompositeKey.get("wf-1:m-shared")).toEqual(
      indexOrderB.byCompositeKey.get("wf-1:m-shared")
    );
    expect(indexOrderA.byCompositeKey.get("wf-2:m-shared")).toEqual(
      indexOrderB.byCompositeKey.get("wf-2:m-shared")
    );

    expect(indexOrderA.byCompositeKey.get("wf-1:m-shared")).toMatchObject({
      id: "m-shared",
      workflowId: "wf-1",
      role: "output",
      status: "ready",
    });
    expect(indexOrderA.byCompositeKey.get("wf-2:m-shared")).toMatchObject({
      id: "m-shared",
      workflowId: "wf-2",
      role: "detail",
      status: "ready",
    });

    // Per-workflow media lists are identical across both arrival orders
    expect(indexOrderA.byWorkflowId.get("wf-1")).toEqual(
      indexOrderB.byWorkflowId.get("wf-1")
    );
    expect(indexOrderA.byWorkflowId.get("wf-2")).toEqual(
      indexOrderB.byWorkflowId.get("wf-2")
    );

    // byMediaId returns a normalized MediaItem in both orders
    expect(indexOrderA.byMediaId.get("m-shared")).toMatchObject({
      id: "m-shared",
      url: "https://example.com/shared.png",
      status: "ready",
    });
    expect(indexOrderB.byMediaId.get("m-shared")).toMatchObject({
      id: "m-shared",
      url: "https://example.com/shared.png",
      status: "ready",
    });
  });

  it("treats role as a property of (workflowId, mediaId) placement in byCompositeKey", () => {
    const projectData = {
      projectContents: {
        workflows: [{ id: "wf-1" }, { id: "wf-2" }],
        media: [
          {
            id: "asset-1",
            workflow_id: "wf-1",
            role: "output",
            url: "https://example.com/1.png",
          },
          {
            id: "asset-1",
            workflow_id: "wf-2",
            role: "detail",
            url: "https://example.com/1.png",
          },
        ],
      },
    };

    const index = buildProjectMediaIndex(projectData);
    const wf1Placement = index.byCompositeKey.get("wf-1:asset-1");
    const wf2Placement = index.byCompositeKey.get("wf-2:asset-1");

    expect(wf1Placement.role).toBe("output");
    expect(wf1Placement.workflowId).toBe("wf-1");

    expect(wf2Placement.role).toBe("detail");
    expect(wf2Placement.workflowId).toBe("wf-2");
  });

  it("preserves MediaItem reference stability across index rebuilds for unchanged media objects", () => {
    const m1 = {
      id: "media-1",
      workflow_id: "wf-1",
      role: "output",
      url: "https://example.com/1.png",
    };
    const m2 = {
      id: "media-2",
      workflow_id: "wf-2",
      role: "output",
      url: "https://example.com/2.png",
    };

    const projectData1 = {
      projectContents: {
        workflows: [{ id: "wf-1" }, { id: "wf-2" }],
        media: [m1, m2],
      },
    };

    const index1 = buildProjectMediaIndex(projectData1);
    const item1_first = index1.byMediaId.get("media-1");
    const item2_first = index1.byMediaId.get("media-2");

    // Rebuild with a new container object, but unchanged m1 and an updated m2_new
    const m2_new = {
      id: "media-2",
      workflow_id: "wf-2",
      role: "output",
      url: "https://example.com/2-updated.png",
    };
    const projectData2 = {
      projectContents: {
        workflows: [{ id: "wf-1" }, { id: "wf-2" }],
        media: [m1, m2_new],
      },
    };

    const index2 = buildProjectMediaIndex(projectData2);
    const item1_second = index2.byMediaId.get("media-1");
    const item2_second = index2.byMediaId.get("media-2");

    // m1 was unchanged in memory -> exact same MediaItem reference returned
    expect(item1_second).toBe(item1_first);
    // m2 was updated -> new MediaItem reference
    expect(item2_second).not.toBe(item2_first);
    expect(item2_second.url).toBe("https://example.com/2-updated.png");
  });
});

