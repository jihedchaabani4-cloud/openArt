import { describe, it, expect, beforeEach } from "vitest";
import { registry, createRegistry, identityKey } from "../store/registry.js";

describe("store/registry", () => {
  let reg;

  beforeEach(() => {
    reg = createRegistry();
  });

  it("exports a default singleton registry", () => {
    expect(registry).toBeDefined();
    expect(typeof registry.getOrCreate).toBe("function");
  });

  describe("identityKey", () => {
    it("generates canonical key: pb2:<templateId>:<instanceId>:<projectId>", () => {
      const key = identityKey({
        templateId: "generated-media",
        projectId: "proj-123",
        instanceId: "main-bar",
      });
      expect(key).toBe("pb2:generated-media:main-bar:proj-123");
    });

    it("defaults instanceId to 'default' and projectId to 'global'", () => {
      const key = identityKey({ templateId: "character" });
      expect(key).toBe("pb2:character:default:global");
    });

    it("throws if templateId is missing or empty", () => {
      expect(() => identityKey({})).toThrow(/templateId/i);
      expect(() => identityKey({ templateId: "" })).toThrow(/templateId/i);
      expect(() => identityKey({ templateId: "   " })).toThrow(/templateId/i);
    });
  });

  describe("getOrCreate and store caching", () => {
    it("returns same object for identical identity and calls factory only once", () => {
      let callCount = 0;
      const factory = () => {
        callCount++;
        return { id: "store-1" };
      };

      const identity = { templateId: "tpl-1", projectId: "p-1", instanceId: "bar-1" };
      const s1 = reg.getOrCreate(identity, factory);
      const s2 = reg.getOrCreate(identity, factory);

      expect(callCount).toBe(1);
      expect(s1).toBe(s2);
    });

    it("returns different stores for different project, template, or instanceId", () => {
      const s1 = reg.getOrCreate({ templateId: "t1", projectId: "p1" }, () => ({ id: 1 }));
      const s2 = reg.getOrCreate({ templateId: "t2", projectId: "p1" }, () => ({ id: 2 }));
      const s3 = reg.getOrCreate({ templateId: "t1", projectId: "p2" }, () => ({ id: 3 }));
      const s4 = reg.getOrCreate({ templateId: "t1", projectId: "p1", instanceId: "other" }, () => ({ id: 4 }));

      expect(s1).not.toBe(s2);
      expect(s1).not.toBe(s3);
      expect(s1).not.toBe(s4);
    });

    it("supports get, has, and dispose", () => {
      const id = { templateId: "t1", projectId: "p1" };
      expect(reg.has(id)).toBe(false);
      expect(reg.get(id)).toBeUndefined();

      const store = { name: "myStore" };
      reg.getOrCreate(id, () => store);

      expect(reg.has(id)).toBe(true);
      expect(reg.get(id)).toBe(store);

      reg.dispose(id);
      expect(reg.has(id)).toBe(false);
      expect(reg.get(id)).toBeUndefined();
    });

    it("reset calls store.reset if defined and preserves the store object", () => {
      let resetCalled = false;
      const storeObj = {
        reset: () => {
          resetCalled = true;
        },
      };

      const id = { templateId: "t1" };
      reg.getOrCreate(id, () => storeObj);
      const returned = reg.reset(id);

      expect(resetCalled).toBe(true);
      expect(returned).toBe(storeObj);
      expect(reg.get(id)).toBe(storeObj);
    });
  });

  describe("mount tracking", () => {
    it("double markMounted requires double markUnmounted to unmount", () => {
      const id = { templateId: "tpl-mount" };
      reg.getOrCreate(id, () => ({}));

      expect(reg.isMounted(id)).toBe(false);

      reg.markMounted(id);
      expect(reg.isMounted(id)).toBe(true);

      reg.markMounted(id);
      expect(reg.isMounted(id)).toBe(true);

      reg.markUnmounted(id);
      expect(reg.isMounted(id)).toBe(true);

      reg.markUnmounted(id);
      expect(reg.isMounted(id)).toBe(false);
    });
  });

  describe("pruneOtherProjects", () => {
    it("disposes unmounted instances of other projects while keeping mounted ones and current project's ones", () => {
      const projA_unmounted = { templateId: "t1", projectId: "projA", instanceId: "1" };
      const projA_mounted = { templateId: "t1", projectId: "projA", instanceId: "2" };
      const projB_unmounted = { templateId: "t1", projectId: "projB", instanceId: "1" };
      const projB_mounted = { templateId: "t1", projectId: "projB", instanceId: "2" };

      reg.getOrCreate(projA_unmounted, () => ({ id: "a1" }));
      reg.getOrCreate(projA_mounted, () => ({ id: "a2" }));
      reg.getOrCreate(projB_unmounted, () => ({ id: "b1" }));
      reg.getOrCreate(projB_mounted, () => ({ id: "b2" }));

      reg.markMounted(projA_mounted);
      reg.markMounted(projB_mounted);

      // Now active project is projB; prune others
      const disposed = reg.pruneOtherProjects("projB");

      // projA_unmounted must be disposed
      expect(reg.has(projA_unmounted)).toBe(false);
      // projA_mounted is mounted so it must NOT be disposed
      expect(reg.has(projA_mounted)).toBe(true);
      // projB instances must NOT be disposed
      expect(reg.has(projB_unmounted)).toBe(true);
      expect(reg.has(projB_mounted)).toBe(true);

      expect(disposed).toContain(identityKey(projA_unmounted));
    });
  });

  describe("in-flight submit tracking", () => {
    it("follows beginSubmit / endSubmit and ignores stale token", () => {
      const id = { templateId: "submit-test" };
      expect(reg.isSubmitting(id)).toBe(false);

      const token1 = reg.beginSubmit(id);
      expect(typeof token1).toBe("string");
      expect(reg.isSubmitting(id)).toBe(true);

      // Stale token end does not clear submitting
      const endedStale = reg.endSubmit(id, "old-fake-token");
      expect(endedStale).toBe(false);
      expect(reg.isSubmitting(id)).toBe(true);

      // Correct token clears submitting
      const endedValid = reg.endSubmit(id, token1);
      expect(endedValid).toBe(true);
      expect(reg.isSubmitting(id)).toBe(false);
    });
  });
});
