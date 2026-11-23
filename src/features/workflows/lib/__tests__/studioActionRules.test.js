import { describe, it, expect } from "vitest";
import {
  STATUS_ACTION_RULES,
  ENTITY_ACTION_RULES,
  getWorkflowEntityType,
  resolveMediaLifecycle,
  resolveStudioActions,
  resolveBulkActionRules,
} from "../studioActionRules";

const ALL_ACTION_KEYS = Object.keys(STATUS_ACTION_RULES.completed).filter(
  (k) => k !== "deleteMode"
);

const ALL_ENTITY_TYPES = [
  "generation",
  "upload",
  "character",
  "element",
  "collection",
  "trash",
];

const ALL_LIFECYCLES = ["uploading", "processing", "failed", "completed"];

describe("getWorkflowEntityType", () => {
  it.each([
    [null, "generation"],
    [undefined, "generation"],
    [{}, "generation"],
    [{ workflow_type: "IMAGE_GENERATION" }, "generation"],
    [{ workflow_type: "UPLOAD" }, "upload"],
    [{ feed_type: "upload" }, "upload"],
    [{ workflow_type: "CHARACTER" }, "character"],
    [{ workflow_type: "CHARACTER_SHEET" }, "character"],
    [{ is_character: true }, "character"],
    [{ entity_type: "character" }, "character"],
    [{ characterId: "c1" }, "character"],
    [{ character: { id: "c1" } }, "character"],
    [{ workflow_type: "ELEMENT" }, "element"],
    [{ workflow_type: "ELEMENT_SHEET" }, "element"],
    [{ is_element: true }, "element"],
    [{ entity_type: "element" }, "element"],
    [{ elementId: "e1" }, "element"],
    [{ element: { id: "e1" } }, "element"],
    [{ type: "collection" }, "collection"],
    [{ itemType: "collection" }, "collection"],
    [{ entity_type: "collection" }, "collection"],
    [{ entity_type: "folder" }, "collection"],
    [{ is_collection: true }, "collection"],
    [{ is_folder: true }, "collection"],
  ])("maps %j -> %s", (input, expected) => {
    expect(getWorkflowEntityType(input)).toBe(expected);
  });
});

describe("resolveMediaLifecycle", () => {
  it("resolves uploading even when normalized status is processing but raw.status is uploading", () => {
    expect(resolveMediaLifecycle({ status: "uploading" })).toBe("uploading");
    expect(
      resolveMediaLifecycle({
        status: "processing",
        item: { status: "processing", raw: { status: "uploading" } },
      })
    ).toBe("uploading");
    expect(
      resolveMediaLifecycle({
        workflow: {
          status: "completed",
          items: [{ id: "m1", status: "completed" }, { id: "m2", status: "uploading" }],
        },
      })
    ).toBe("uploading");
  });

  it.each(["processing", "pending", "queued", "in_progress", "starting"])(
    "resolves in-flight status '%s' -> processing",
    (status) => {
      expect(resolveMediaLifecycle({ status })).toBe("processing");
      expect(
        resolveMediaLifecycle({
          workflow: { items: [{ id: "m1", status: "completed" }, { id: "m2", status }] },
        })
      ).toBe("processing");
    }
  );

  it.each(["failed", "error", "rejected"])(
    "resolves terminal failed status '%s' -> failed",
    (status) => {
      expect(resolveMediaLifecycle({ status })).toBe("failed");
      expect(
        resolveMediaLifecycle({ workflow: { items: [{ id: "m1", status }] } })
      ).toBe("failed");
    }
  );

  it("treats mixed failed + completed workflow as completed, and error without URL as failed", () => {
    expect(
      resolveMediaLifecycle({
        workflow: {
          items: [
            { id: "m1", status: "failed" },
            { id: "m2", status: "completed", url: "https://cdn.example.com/ok.png" },
          ],
        },
      })
    ).toBe("completed");
    expect(
      resolveMediaLifecycle({ item: { error: "Policy violation", url: null } })
    ).toBe("failed");
  });
});

describe("resolveStudioActions — Exhaustive (entityType × lifecycle × isVideo × isFrameMode × isTrash) matrix", () => {
  const cases = [];
  for (const entityType of ALL_ENTITY_TYPES) {
    for (const lifecycle of ALL_LIFECYCLES) {
      for (const isVideo of [false, true]) {
        for (const isFrameMode of [false, true]) {
          for (const isTrash of [false, true]) {
            cases.push({ entityType, lifecycle, isVideo, isFrameMode, isTrash });
          }
        }
      }
    }
  }

  it.each(cases)(
    "entity=$entityType lifecycle=$lifecycle video=$isVideo frame=$isFrameMode trash=$isTrash",
    ({ entityType, lifecycle, isVideo, isFrameMode, isTrash }) => {
      const result = resolveStudioActions({
        entityType,
        status: lifecycle,
        isVideo,
        isFrameMode,
        isTrash,
      });

      const expectedEntity = isTrash ? "trash" : entityType;
      const statusRule = STATUS_ACTION_RULES[lifecycle];
      const entityRule = ENTITY_ACTION_RULES[expectedEntity];

      expect(result.entityType).toBe(expectedEntity);
      expect(result.lifecycle).toBe(lifecycle);
      expect(result.isInFlight).toBe(lifecycle === "uploading" || lifecycle === "processing");
      expect(result.isFailed).toBe(lifecycle === "failed");
      expect(result.isCompleted).toBe(lifecycle === "completed");

      const expectedDeleteMode =
        statusRule.deleteMode === "none"
          ? "none"
          : entityRule.deleteMode || statusRule.deleteMode;
      expect(result.deleteMode).toBe(expectedDeleteMode);

      for (const key of ALL_ACTION_KEYS) {
        let expected = Boolean(statusRule[key] && entityRule[key]);
        if (key === "animate") expected = expected && !isVideo && !isFrameMode;
        if (key === "addToPrompt") expected = expected && !isVideo && !isFrameMode;
        if (key === "addFrame") expected = expected && !isVideo && isFrameMode;
        if (key === "publishYoutube") expected = expected && isVideo;
        expect(result.can[key]).toBe(expected);
      }
    }
  );

  it("enforces zero actions for uploading/processing and ONLY select/openMenu/reusePrompt/delete for failed", () => {
    for (const status of ["uploading", "processing", "pending", "queued", "in_progress", "starting"]) {
      const res = resolveStudioActions({ entityType: "generation", status });
      expect(res.deleteMode).toBe("none");
      expect(Object.values(res.can).every((v) => v === false)).toBe(true);
    }

    const failedGen = resolveStudioActions({
      entityType: "generation",
      status: "failed",
      showReuse: false,
      hasReusablePrompt: true,
    });
    expect(failedGen.deleteMode).toBe("permanent");
    const allowedFailedGen = Object.entries(failedGen.can)
      .filter(([, allowed]) => allowed)
      .map(([key]) => key);
    expect(allowedFailedGen).toEqual(["select", "openMenu", "reusePrompt", "delete"]);

    const failedUpload = resolveStudioActions({
      entityType: "upload",
      status: "failed",
      hasReusablePrompt: true,
    });
    expect(failedUpload.can.reusePrompt).toBe(false);
    expect(failedUpload.can.delete).toBe(true);
    expect(failedUpload.deleteMode).toBe("permanent");
  });

  it("enforces contextual constraints (hasUrl, hasReusablePrompt, showReuse, canModelAcceptEntity, isSelectionMode/isSelected)", () => {
    // Missing URL disables media-URL-dependent actions on completed generation, keeps delete/select
    const noUrl = resolveStudioActions({
      entityType: "generation",
      status: "completed",
      hasUrl: false,
    });
    expect(noUrl.can.drag).toBe(false);
    expect(noUrl.can.animate).toBe(false);
    expect(noUrl.can.addToPrompt).toBe(false);
    expect(noUrl.can.download).toBe(false);
    expect(noUrl.can.setCover).toBe(false);
    expect(noUrl.can.select).toBe(true);
    expect(noUrl.can.delete).toBe(true);

    // Collection ignores hasUrl=false (folders do not require a media URL)
    const folderNoUrl = resolveStudioActions({
      entityType: "folder",
      hasUrl: false,
    });
    expect(folderNoUrl.entityType).toBe("collection");
    expect(folderNoUrl.deleteMode).toBe("folder");
    expect(folderNoUrl.can.drag).toBe(true);
    expect(folderNoUrl.can.download).toBe(true);
    expect(folderNoUrl.can.setColor).toBe(true);

    // Completed reusePrompt requires both hasReusablePrompt and showReuse
    expect(
      resolveStudioActions({
        entityType: "generation",
        status: "completed",
        hasReusablePrompt: true,
        showReuse: false,
      }).can.reusePrompt
    ).toBe(false);
    expect(
      resolveStudioActions({
        entityType: "generation",
        status: "completed",
        hasReusablePrompt: false,
        showReuse: true,
      }).can.reusePrompt
    ).toBe(false);

    // canModelAcceptEntity gates addToPrompt & addFrame
    expect(
      resolveStudioActions({
        entityType: "character",
        status: "completed",
        canModelAcceptEntity: false,
      }).can.addToPrompt
    ).toBe(false);
    expect(
      resolveStudioActions({
        entityType: "generation",
        status: "completed",
        isFrameMode: true,
        canModelAcceptEntity: false,
      }).can.addFrame
    ).toBe(false);

    // Selection mode: selected card allows select + drag + openMenu (bulk); suppresses single-item actions
    const selSelected = resolveStudioActions({
      entityType: "generation",
      status: "completed",
      isSelectionMode: true,
      isSelected: true,
    });
    expect(selSelected.can.select).toBe(true);
    expect(selSelected.can.drag).toBe(true);
    expect(selSelected.can.openMenu).toBe(true);
    expect(selSelected.can.navigate).toBe(false);
    expect(selSelected.can.like).toBe(false);
    expect(selSelected.can.delete).toBe(false);
    expect(selSelected.can.rename).toBe(false);

    // Selection mode: unselected card allows ONLY select (no drag, no context menu)
    const selUnselected = resolveStudioActions({
      entityType: "generation",
      status: "completed",
      isSelectionMode: true,
      isSelected: false,
    });
    expect(selUnselected.can.select).toBe(true);
    expect(selUnselected.can.drag).toBe(false);
    expect(selUnselected.can.openMenu).toBe(false);
    expect(selUnselected.can.navigate).toBe(false);
  });
});

describe("resolveBulkActionRules", () => {
  const completedWf = { id: "w1", workflow: { id: "w1", items: [{ id: "m1", status: "completed" }] } };
  const failedWf = { id: "w2", workflow: { id: "w2", items: [{ id: "m2", status: "failed" }] } };
  const inFlightWf = { id: "w3", workflow: { id: "w3", items: [{ id: "m3", status: "processing" }] } };
  const col = { id: "c1", collection: { id: "c1", name: "Folder" } };

  it("enables download/move/like/addToPrompt for completed workflows in assets scope", () => {
    const res = resolveBulkActionRules({ scope: "assets", workflowEntries: [completedWf] });
    expect(res).toMatchObject({
      hasActionableWorkflows: true,
      canDownload: true,
      canMove: true,
      canLike: true,
      canAddToPrompt: true,
      canRestore: false,
      canDelete: true,
    });
  });

  it("disables like/addToPrompt on mixed workflow + collection selection, keeps download/move", () => {
    const res = resolveBulkActionRules({
      scope: "assets",
      workflowEntries: [completedWf],
      collectionEntries: [col],
    });
    expect(res).toMatchObject({
      canDownload: true,
      canMove: true,
      canLike: false,
      canAddToPrompt: false,
    });
  });

  it("disables download/move/like/addToPrompt when only failed or in-flight workflows are selected (including top-level entry.status)", () => {
    const topLevelFailed = { id: "w4", status: "failed" };
    const topLevelProcessing = { id: "w5", status: "processing" };
    const res = resolveBulkActionRules({
      scope: "assets",
      workflowEntries: [failedWf, inFlightWf, topLevelFailed, topLevelProcessing],
    });
    expect(res).toMatchObject({
      hasActionableWorkflows: false,
      canDownload: false,
      canMove: false,
      canLike: false,
      canAddToPrompt: false,
      canDelete: true,
    });
  });

  it("disables move in elements/characters scopes while keeping download/like/addToPrompt", () => {
    for (const scope of ["elements", "characters"]) {
      const res = resolveBulkActionRules({ scope, workflowEntries: [completedWf] });
      expect(res.canMove).toBe(false);
      expect(res.canDownload).toBe(true);
      expect(res.canLike).toBe(true);
      expect(res.canAddToPrompt).toBe(true);
    }
  });

  it("enables ONLY restore & delete in trash scope", () => {
    const res = resolveBulkActionRules({ scope: "trash", workflowEntries: [completedWf] });
    expect(res).toMatchObject({
      canDownload: false,
      canMove: false,
      canLike: false,
      canAddToPrompt: false,
      canRestore: true,
      canDelete: true,
    });
  });
});
