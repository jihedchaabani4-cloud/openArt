import { describe, it, expect } from "vitest";
import { buildProjectMediaIndex, isHomeWorkflowMedia } from "../mediaCacheIndex";

describe("mediaCacheIndex - Primary Workflow Ownership", () => {
  it("correctly identifies home workflow media via explicit home/origin pointer", () => {
    const homeRow = {
      id: "m-1",
      workflow_id: "wf-home",
      home_workflow_id: "wf-home",
      role: "output",
    };
    const linkedRow = {
      id: "m-1",
      workflow_id: "wf-char",
      home_workflow_id: "wf-home",
      role: "detail",
    };

    expect(isHomeWorkflowMedia(homeRow, "wf-home")).toBe(true);
    expect(isHomeWorkflowMedia(linkedRow, "wf-char")).toBe(false);
  });


  it("home workflow entry wins in byMediaId when home row comes FIRST in array", () => {
    const projectData = {
      projectContents: {
        workflows: [{ id: "wf-home" }, { id: "wf-char" }],
        media: [
          {
            id: "shared-asset",
            workflow_id: "wf-home",
            home_workflow_id: "wf-home",
            role: "output",
            url: "https://example.com/shared.png",
          },
          {
            id: "shared-asset",
            workflow_id: "wf-char",
            home_workflow_id: "wf-home",
            role: "detail",
            url: "https://example.com/shared.png",
          },
        ],
      },
    };

    const index = buildProjectMediaIndex(projectData);
    const resolved = index.byMediaId.get("shared-asset");

    expect(resolved).toBeDefined();
    expect(resolved.workflowId).toBe("wf-home");
    expect(resolved.role).toBe("output");
  });

  it("home workflow entry wins in byMediaId when home row comes LAST in array (FIFO heuristic abolished)", () => {
    const projectData = {
      projectContents: {
        workflows: [{ id: "wf-home" }, { id: "wf-char" }],
        media: [
          // Linked row comes FIRST in the array
          {
            id: "shared-asset",
            workflow_id: "wf-char",
            home_workflow_id: "wf-home",
            role: "detail",
            url: "https://example.com/shared.png",
          },
          // Home row comes LAST in the array
          {
            id: "shared-asset",
            workflow_id: "wf-home",
            home_workflow_id: "wf-home",
            role: "output",
            url: "https://example.com/shared.png",
          },
        ],
      },
    };

    const index = buildProjectMediaIndex(projectData);
    const resolved = index.byMediaId.get("shared-asset");

    expect(resolved).toBeDefined();
    expect(resolved.workflowId).toBe("wf-home");
    expect(resolved.role).toBe("output");
  });

  it("treats role as a property of (workflowId, mediaId) placement in byCompositeKey", () => {
    const projectData = {
      projectContents: {
        workflows: [{ id: "wf-home" }, { id: "wf-char" }],
        media: [
          {
            id: "asset-1",
            workflow_id: "wf-home",
            role: "output",
            url: "https://example.com/1.png",
          },
          {
            id: "asset-1",
            workflow_id: "wf-char",
            role: "detail",
            url: "https://example.com/1.png",
          },
        ],
      },
    };

    const index = buildProjectMediaIndex(projectData);
    const homePlacement = index.byCompositeKey.get("wf-home:asset-1");
    const charPlacement = index.byCompositeKey.get("wf-char:asset-1");

    expect(homePlacement.role).toBe("output");
    expect(homePlacement.workflowId).toBe("wf-home");

    expect(charPlacement.role).toBe("detail");
    expect(charPlacement.workflowId).toBe("wf-char");
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

