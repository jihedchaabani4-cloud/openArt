import { describe, it, expect } from "vitest";
import {
  matchWorkflowId,
  matchFolderId,
  removeById,
  patchWorkflowFolder,
  patchFolderParent,
  patchFolderName,
  updateMediaById,
} from "./cacheOps";

describe("matchWorkflowId", () => {
  it("matches on id, on name, and with the workflows/ prefix stripped on either side", () => {
    expect(matchWorkflowId({ id: "a1" }, "a1")).toBe(true);
    expect(matchWorkflowId({ id: "x", name: "a1" }, "a1")).toBe(true);
    expect(matchWorkflowId({ id: "workflows/a1" }, "a1")).toBe(true);
    expect(matchWorkflowId({ id: "a1" }, "workflows/a1")).toBe(true);
    expect(matchWorkflowId({ id: "x", name: "workflows/a1" }, "a1")).toBe(true);
  });

  it("does not match a different id", () => {
    expect(matchWorkflowId({ id: "a1", name: "a1" }, "a2")).toBe(false);
  });

  it("never matches on null / undefined / empty input", () => {
    expect(matchWorkflowId(null, "a1")).toBe(false);
    expect(matchWorkflowId({ id: "a1" }, null)).toBe(false);
    expect(matchWorkflowId({ id: "a1" }, "")).toBe(false);
    expect(matchWorkflowId({}, "")).toBe(false);
    expect(matchWorkflowId({}, undefined)).toBe(false);
    expect(matchWorkflowId({ id: "workflows/" }, "workflows/")).toBe(false);
  });
});

describe("matchFolderId", () => {
  it("matches id, folderId or _id but never the folder name", () => {
    expect(matchFolderId({ id: "f1" }, "f1")).toBe(true);
    expect(matchFolderId({ folderId: "f1" }, "f1")).toBe(true);
    expect(matchFolderId({ _id: "f1" }, "f1")).toBe(true);
    expect(matchFolderId({ id: "f2", name: "f1" }, "f1")).toBe(false);
  });

  it("never matches on empty input", () => {
    expect(matchFolderId(null, "f1")).toBe(false);
    expect(matchFolderId({}, undefined)).toBe(false);
    expect(matchFolderId({ id: "f1" }, "")).toBe(false);
  });
});

describe("removeById", () => {
  const list = [{ id: "a1" }, { id: "workflows/a2" }, { id: "a3" }];

  it("removes the matching item (prefix-insensitive)", () => {
    expect(removeById(list, "a2")).toEqual([{ id: "a1" }, { id: "a3" }]);
  });

  it("returns the same reference when nothing matches (idempotent)", () => {
    const once = removeById(list, "a2");
    expect(removeById(once, "a2")).toBe(once);
    expect(removeById(list, "zzz")).toBe(list);
  });

  it("returns the input untouched for a non-array or an empty id", () => {
    expect(removeById(undefined, "a1")).toBeUndefined();
    expect(removeById(null, "a1")).toBeNull();
    expect(removeById(list, "")).toBe(list);
  });

  it("accepts a custom matcher (folders)", () => {
    const folders = [{ id: "f1", name: "f2" }, { id: "f2" }];
    expect(removeById(folders, "f2", matchFolderId)).toEqual([{ id: "f1", name: "f2" }]);
  });

  it("does not mutate the input array", () => {
    const copy = [...list];
    removeById(list, "a1");
    expect(list).toEqual(copy);
  });
});

describe("patchWorkflowFolder", () => {
  it("writes the 4 folder variants and keeps other fields", () => {
    const wf = { id: "a1", folder_id: "old", metadata: { displayName: "X", folderId: "old" } };
    expect(patchWorkflowFolder(wf, "f9")).toEqual({
      id: "a1",
      folder_id: "f9",
      folderId: "f9",
      metadata: { displayName: "X", folder_id: "f9", folderId: "f9" },
    });
  });

  it("normalizes falsy folderId to null (move to root)", () => {
    for (const root of [null, undefined, ""]) {
      const out = patchWorkflowFolder({ id: "a1", metadata: {} }, root);
      expect(out.folder_id).toBeNull();
      expect(out.folderId).toBeNull();
      expect(out.metadata.folder_id).toBeNull();
      expect(out.metadata.folderId).toBeNull();
    }
  });

  it("creates metadata when missing and does not mutate the input", () => {
    const wf = { id: "a1" };
    const out = patchWorkflowFolder(wf, "f1");
    expect(out.metadata).toEqual({ folder_id: "f1", folderId: "f1" });
    expect(wf).toEqual({ id: "a1" });
  });

  it("is idempotent", () => {
    const once = patchWorkflowFolder({ id: "a1" }, "f1");
    expect(patchWorkflowFolder(once, "f1")).toEqual(once);
  });

  it("returns null/undefined input as is", () => {
    expect(patchWorkflowFolder(null, "f1")).toBeNull();
    expect(patchWorkflowFolder(undefined, "f1")).toBeUndefined();
  });
});

describe("patchFolderParent", () => {
  it("writes parentId AND parent_id", () => {
    expect(patchFolderParent({ id: "f1", parent_id: "old", parentId: "old" }, "p2")).toEqual({
      id: "f1",
      parent_id: "p2",
      parentId: "p2",
    });
  });

  it("normalizes falsy parent to null (move to root) and is idempotent", () => {
    const once = patchFolderParent({ id: "f1", parent_id: "p" }, "");
    expect(once).toEqual({ id: "f1", parent_id: null, parentId: null });
    expect(patchFolderParent(once, null)).toEqual(once);
  });

  it("returns null input as is", () => {
    expect(patchFolderParent(null, "p")).toBeNull();
  });
});

describe("patchFolderName", () => {
  it("sets the name without touching other fields or the input", () => {
    const f = { id: "f1", name: "Old", parent_id: null };
    expect(patchFolderName(f, "New")).toEqual({ id: "f1", name: "New", parent_id: null });
    expect(f.name).toBe("Old");
  });

  it("is idempotent and returns null input as is", () => {
    const once = patchFolderName({ id: "f1" }, "N");
    expect(patchFolderName(once, "N")).toEqual(once);
    expect(patchFolderName(null, "N")).toBeNull();
  });
});

describe("updateMediaById", () => {
  it("updates ALL duplicate rows of the same mediaId in the array", () => {
    const list = [
      { id: "m-1", workflow_id: "wf-home", status: "processing", role: "output" },
      { id: "m-2", workflow_id: "wf-2", status: "processing", role: "output" },
      { id: "m-1", workflow_id: "wf-character", status: "processing", role: "detail" },
    ];

    const updated = updateMediaById(list, "m-1", { status: "ready" });

    expect(updated).toHaveLength(3);
    // Both occurrences of m-1 must be updated to status: 'ready'
    expect(updated[0]).toEqual({ id: "m-1", workflow_id: "wf-home", status: "ready", role: "output" });
    expect(updated[2]).toEqual({ id: "m-1", workflow_id: "wf-character", status: "ready", role: "detail" });
    // Other items untouched
    expect(updated[1].status).toBe("processing");
  });

  it("returns the same reference if no item matches", () => {
    const list = [{ id: "m-1" }, { id: "m-2" }];
    const res = updateMediaById(list, "m-999", { status: "ready" });
    expect(res).toBe(list);
  });
});
