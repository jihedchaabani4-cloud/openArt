import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSyntheticPngFile,
  computeLatencyStats,
  runLoadTest,
  runMultiAccountLoadTest,
  deleteLoadTestProject,
} from "../loadTestRunner";
import {
  buildAccountCookieHeader,
  clearDevAccounts,
  extractAuthCookiesFromSetCookie,
  getDevAccount,
  listPublicDevAccounts,
  removeDevAccount,
  updateDevAccountTokens,
  upsertDevAccount,
} from "../devAccountStore";
import { POST as captureAccountRoute } from "@/app/api/dev-load-test/accounts/route";
import { api } from "@/shared/api/client";

vi.mock("@/shared/api/client", () => ({
  api: {
    post: vi.fn(),
    postForm: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
}));

describe("loadTestRunner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSyntheticPngFile", () => {
    it("produces a valid PNG file with standard 8-byte PNG signature and image/png MIME type", async () => {
      const file = createSyntheticPngFile(7);
      expect(file.type).toBe("image/png");
      expect(file.name).toBe("loadtest-media-7.png");

      const bytes = new Uint8Array(await file.arrayBuffer());
      expect(bytes.length).toBeGreaterThan(32);
      expect(Array.from(bytes.slice(0, 8))).toEqual([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
    });
  });

  describe("computeLatencyStats", () => {
    it("returns zeroed stats for an empty array", () => {
      expect(computeLatencyStats([])).toEqual({
        total: 0,
        ok: 0,
        failed: 0,
        status409: 0,
        status429: 0,
        status5xx: 0,
        minMs: 0,
        avgMs: 0,
        p50Ms: 0,
        p95Ms: 0,
        maxMs: 0,
      });
    });

    it("computes exact min, avg, p50, p95, max and 409/429/5xx counts", () => {
      const entries = [
        { ok: true, status: 200, latencyMs: 10 },
        { ok: true, status: 200, latencyMs: 20 },
        { ok: true, status: 200, latencyMs: 30 },
        { ok: false, status: 409, latencyMs: 40 },
        { ok: false, status: 429, latencyMs: 50 },
        { ok: true, status: 200, latencyMs: 60 },
        { ok: true, status: 200, latencyMs: 70 },
        { ok: false, status: 500, latencyMs: 80 },
        { ok: false, status: 503, latencyMs: 90 },
        { ok: true, status: 200, latencyMs: 100 },
      ];

      expect(computeLatencyStats(entries)).toEqual({
        total: 10,
        ok: 6,
        failed: 4,
        status409: 1,
        status429: 1,
        status5xx: 2,
        minMs: 10,
        avgMs: 55,
        p50Ms: 50,
        p95Ms: 100,
        maxMs: 100,
      });
    });
  });

  describe("runLoadTest", () => {
    it("executes createProject -> createFolders -> upload -> generate -> moveMedia -> moveFolder -> delete -> cleanup and enforces concurrency cap", async () => {
      let inFlight = 0;
      let peakInFlight = 0;
      let folderSeq = 0;

      api.post.mockImplementation(async (endpoint, payload) => {
        if (endpoint === "/projects") {
          return { ok: true, data: { id: "proj-123" } };
        }
        if (endpoint === "/projects/proj-123/folders") {
          expect(payload).toEqual(expect.objectContaining({ parentId: null }));
          folderSeq += 1;
          return { ok: true, data: { id: `folder-${folderSeq}` } };
        }
        if (endpoint === "/images/generated") {
          inFlight += 1;
          peakInFlight = Math.max(peakInFlight, inFlight);
          await new Promise((r) => setTimeout(r, 15));
          inFlight -= 1;
          return { ok: true, workflow_id: `gen-wf-${Math.random().toString(36).slice(2, 6)}` };
        }
        throw new Error(`Unexpected POST ${endpoint}`);
      });

      let uploadSeq = 0;
      api.postForm.mockImplementation(async (endpoint, formData) => {
        expect(endpoint).toBe("/assets/upload");
        expect(formData.get("project_id")).toBe("proj-123");
        expect(formData.get("workflow_type")).toBe("UPLOAD");
        inFlight += 1;
        peakInFlight = Math.max(peakInFlight, inFlight);
        await new Promise((r) => setTimeout(r, 15));
        inFlight -= 1;
        uploadSeq += 1;
        return { ok: true, data: { workflow_id: `workflows/up-wf-${uploadSeq}` } };
      });

      api.patch.mockImplementation(async () => ({ ok: true }));
      api.delete.mockImplementation(async () => ({ ok: true }));

      const snapshots = [];
      const result = await runLoadTest(
        {
          uploadCount: 4,
          generateCount: 2,
          folderCount: 4,
          moveMediaCount: 6,
          moveFolderCount: 2,
          durationSeconds: 0,
          concurrency: 2,
          generateModel: "nano-banana-pro",
          generateRatio: "1:1",
          accountLabel: "tester-a",
          stages: {
            createProject: true,
            createFolders: true,
            upload: true,
            generate: true,
            moveMedia: true,
            moveFolder: true,
            deleteMedia: true,
            cleanupProject: true,
          },
        },
        { onUpdate: (s) => snapshots.push(s) }
      );

      expect(result.status).toBe("completed");
      expect(result.projectId).toBe("proj-123");
      expect(result.createdFolderIds).toEqual(["folder-1", "folder-2", "folder-3", "folder-4"]);
      expect(result.createdWorkflowIds).toHaveLength(6);
      expect(peakInFlight).toBeLessThanOrEqual(2);
      expect(result.stages.createProject.ok).toBe(1);
      expect(result.stages.createFolders.ok).toBe(4);
      expect(result.stages.upload.ok).toBe(4);
      expect(result.stages.generate.ok).toBe(2);
      expect(result.stages.moveMedia.ok).toBe(6);
      expect(result.stages.moveFolder.ok).toBe(2);
      expect(result.stages.delete.ok).toBe(6);
      expect(result.stages.cleanup.ok).toBe(1);
      expect(result.overall.total).toBe(26);
      expect(result.overall.ok).toBe(26);
      expect(result.plannedOps).toBe(26);
      expect(snapshots.length).toBeGreaterThan(1);

      expect(api.patch).toHaveBeenCalledWith(
        "/assets/up-wf-1/folder",
        expect.objectContaining({ folderId: expect.stringMatching(/^folder-[1-4]$/) }),
        expect.objectContaining({ timeout: 30000 })
      );
      expect(api.patch).toHaveBeenCalledWith(
        "/folders/folder-3",
        { parentId: "folder-1" },
        expect.objectContaining({ timeout: 30000 })
      );
      expect(api.patch).toHaveBeenCalledWith(
        "/folders/folder-4",
        { parentId: "folder-2" },
        expect.objectContaining({ timeout: 30000 })
      );
      expect(api.delete).toHaveBeenCalledWith(
        "/workflows/workflows/up-wf-1",
        expect.objectContaining({ timeout: 30000 })
      );
      expect(api.delete).toHaveBeenCalledWith(
        "/projects/proj-123",
        expect.objectContaining({ timeout: 30000 })
      );
    });

    it("supports large move batches with zero self-moves and zero parent/child folder cycles", async () => {
      let folderSeq = 0;
      let uploadSeq = 0;

      api.post.mockImplementation(async (endpoint) => {
        if (endpoint === "/projects") return { ok: true, data: { id: "proj-heavy" } };
        if (endpoint === "/projects/proj-heavy/folders") {
          folderSeq += 1;
          return { ok: true, data: { folder_id: `f-${folderSeq}` } };
        }
        throw new Error(`Unexpected POST ${endpoint}`);
      });

      api.postForm.mockImplementation(async () => {
        uploadSeq += 1;
        return { ok: true, workflow_id: `wf-${uploadSeq}` };
      });

      const movedChildren = new Set();
      const targetParents = new Set();
      const mediaMoves = [];

      api.patch.mockImplementation(async (endpoint, payload) => {
        if (endpoint.startsWith("/folders/")) {
          const childId = endpoint.replace("/folders/", "");
          const parentId = payload.parentId;
          expect(childId).not.toBe(parentId);
          movedChildren.add(childId);
          targetParents.add(parentId);
        } else if (endpoint.startsWith("/assets/")) {
          mediaMoves.push({ endpoint, folderId: payload.folderId });
        }
        return { ok: true };
      });

      const result = await runLoadTest({
        uploadCount: 5,
        generateCount: 0,
        folderCount: 6,
        moveMediaCount: 15,
        moveFolderCount: 12,
        durationSeconds: 0,
        concurrency: 4,
        stages: {
          createProject: true,
          createFolders: true,
          upload: true,
          generate: false,
          moveMedia: true,
          moveFolder: true,
          deleteMedia: false,
          cleanupProject: false,
        },
      });

      expect(result.status).toBe("completed");
      expect(result.stages.createFolders.ok).toBe(6);
      expect(result.stages.upload.ok).toBe(5);
      expect(result.stages.moveMedia.ok).toBe(15);
      expect(result.stages.moveFolder.ok).toBe(12);
      expect(mediaMoves).toHaveLength(15);

      // Disjoint root vs child sets guarantee cycles are structurally impossible
      for (const childId of movedChildren) {
        expect(targetParents.has(childId)).toBe(false);
      }
      expect(movedChildren.size).toBe(3);
      expect(targetParents.size).toBe(3);
    });

    it("records 429 and 409 MEDIA_PROCESSING errors cleanly without aborting the run", async () => {
      api.post.mockImplementation(async (endpoint) => {
        if (endpoint === "/projects") return { ok: true, data: { project_id: "proj-err" } };
        if (endpoint === "/images/generated") {
          const err = new Error("Rate limited");
          err.status = 429;
          err.errorCode = "RATE_LIMITED";
          throw err;
        }
        return { ok: true };
      });

      let upIdx = 0;
      api.postForm.mockImplementation(async () => {
        upIdx += 1;
        return { ok: true, workflow_id: `wf-${upIdx}` };
      });

      let delIdx = 0;
      api.delete.mockImplementation(async () => {
        delIdx += 1;
        if (delIdx === 1) {
          const err = new Error("Media is still processing");
          err.status = 409;
          err.errorCode = "MEDIA_PROCESSING";
          throw err;
        }
        return { ok: true };
      });

      const result = await runLoadTest({
        uploadCount: 2,
        generateCount: 1,
        durationSeconds: 0,
        concurrency: 1,
        generateModel: "seedream-v5",
        stages: {
          createProject: true,
          createFolders: false,
          upload: true,
          generate: true,
          moveMedia: false,
          moveFolder: false,
          deleteMedia: true,
          cleanupProject: false,
        },
      });

      expect(result.status).toBe("completed");
      expect(result.overall.status429).toBe(1);
      expect(result.overall.status409).toBe(1);
      expect(result.stages.generate.failed).toBe(1);
      expect(result.stages.upload.ok).toBe(2);
      expect(result.stages.delete.ok).toBe(1);
      expect(result.stages.delete.status409).toBe(1);
    });

    it("prefers data.workflow_id over nested data.asset.id when deleting uploaded media", async () => {
      api.post.mockResolvedValue({ ok: true, data: { id: "proj-nested" } });
      api.postForm.mockResolvedValue({
        ok: true,
        data: { workflow_id: "workflows/wf-real-42", asset: { id: "asset-wrong-99" } },
      });
      api.delete.mockResolvedValue({ ok: true });

      const result = await runLoadTest({
        uploadCount: 1,
        generateCount: 0,
        durationSeconds: 0,
        concurrency: 1,
        stages: {
          createProject: true,
          createFolders: false,
          upload: true,
          generate: false,
          moveMedia: false,
          moveFolder: false,
          deleteMedia: true,
          cleanupProject: false,
        },
      });

      expect(result.createdWorkflowIds).toEqual(["wf-real-42"]);
      expect(api.delete).toHaveBeenCalledWith(
        "/workflows/workflows/wf-real-42",
        expect.objectContaining({ timeout: 30000 })
      );
    });

    it("stops cleanly during paced sleep when AbortController.abort() is called", async () => {
      const controller = new AbortController();

      api.post.mockResolvedValue({ ok: true, data: { id: "proj-abort" } });
      api.postForm.mockImplementation(async () => {
        // Trigger abort right after first upload completes while pacing waits for remaining tasks
        setTimeout(() => controller.abort(), 10);
        return { ok: true, workflow_id: "wf-abort-1" };
      });

      const result = await runLoadTest(
        {
          uploadCount: 10,
          generateCount: 0,
          durationSeconds: 60,
          concurrency: 1,
          stages: {
            createProject: true,
            createFolders: false,
            upload: true,
            generate: false,
            moveMedia: false,
            moveFolder: false,
            deleteMedia: true,
            cleanupProject: true,
          },
        },
        { signal: controller.signal }
      );

      expect(result.status).toBe("aborted");
      expect(result.stages.upload.total).toBeLessThan(10);
      expect(result.stages.delete.total).toBe(0);
      expect(result.stages.cleanup.total).toBe(0);
    });
  });

  describe("runMultiAccountLoadTest", () => {
    it("runs 3 Google accounts concurrently with isolated projects and aggregates exact combined + per-account stats", async () => {
      const accounts = [
        { id: "acc-1", email: "user1@gmail.com", name: "User One" },
        { id: "acc-2", email: "user2@gmail.com", name: "User Two" },
        { id: "acc-3", email: "user3@gmail.com", name: "User Three" },
      ];

      const perAccountCalls = new Map();

      const createApiClient = (acc) => {
        let fSeq = 0;
        let uSeq = 0;
        const calls = [];
        perAccountCalls.set(acc.id, calls);

        return {
          post: vi.fn(async (endpoint) => {
            calls.push(`POST ${endpoint}`);
            if (endpoint === "/projects") return { ok: true, data: { id: `proj-${acc.id}` } };
            if (endpoint === `/projects/proj-${acc.id}/folders`) {
              fSeq += 1;
              return { ok: true, data: { id: `${acc.id}-f-${fSeq}` } };
            }
            throw new Error(`Unexpected POST ${endpoint}`);
          }),
          postForm: vi.fn(async (endpoint) => {
            calls.push(`POSTFORM ${endpoint}`);
            uSeq += 1;
            return { ok: true, data: { workflow_id: `${acc.id}-wf-${uSeq}` } };
          }),
          patch: vi.fn(async (endpoint) => {
            calls.push(`PATCH ${endpoint}`);
            return { ok: true };
          }),
          delete: vi.fn(async (endpoint) => {
            calls.push(`DELETE ${endpoint}`);
            return { ok: true };
          }),
        };
      };

      const result = await runMultiAccountLoadTest(
        accounts,
        {
          uploadCount: 2,
          generateCount: 0,
          folderCount: 2,
          moveMediaCount: 2,
          moveFolderCount: 1,
          durationSeconds: 0,
          concurrency: 2,
          stages: {
            createProject: true,
            createFolders: true,
            upload: true,
            generate: false,
            moveMedia: true,
            moveFolder: true,
            deleteMedia: true,
            cleanupProject: false,
          },
        },
        { createApiClient }
      );

      expect(result.status).toBe("completed");
      expect(result.accountCount).toBe(3);
      expect(result.accounts).toHaveLength(3);
      expect(result.createdProjects.map((p) => p.projectId).sort()).toEqual([
        "proj-acc-1",
        "proj-acc-2",
        "proj-acc-3",
      ]);

      // Per account: 1 createProject + 2 createFolders + 2 upload + 2 moveMedia + 1 moveFolder + 2 delete = 10 ops
      // Across 3 accounts simultaneously = 30 exact ops
      expect(result.overall.total).toBe(30);
      expect(result.overall.ok).toBe(30);
      expect(result.stages.createProject.ok).toBe(3);
      expect(result.stages.createFolders.ok).toBe(6);
      expect(result.stages.upload.ok).toBe(6);
      expect(result.stages.moveMedia.ok).toBe(6);
      expect(result.stages.moveFolder.ok).toBe(3);
      expect(result.stages.delete.ok).toBe(6);
      expect(result.createdWorkflowIds).toHaveLength(6);
      expect(result.createdFolderIds).toHaveLength(6);

      // Every log entry is tagged with its Google account label
      const loggedEmails = new Set(result.recentLog.map((e) => e.accountLabel));
      expect(loggedEmails).toEqual(new Set(["user1@gmail.com", "user2@gmail.com", "user3@gmail.com"]));
      expect(perAccountCalls.get("acc-1")).toHaveLength(10);
      expect(perAccountCalls.get("acc-2")).toHaveLength(10);
      expect(perAccountCalls.get("acc-3")).toHaveLength(10);
    });
  });

  describe("devAccountStore", () => {
    beforeEach(() => {
      clearDevAccounts();
    });

    it("stores multiple Google accounts without exposing tokens in public list and updates rotated cookies", () => {
      upsertDevAccount({
        id: "u1",
        email: "one@gmail.com",
        name: "One",
        accessToken: "secret-access-1",
        refreshToken: "secret-refresh-1",
      });
      upsertDevAccount({
        id: "u2",
        email: "two@gmail.com",
        name: "Two",
        accessToken: "secret-access-2",
      });

      const pub = listPublicDevAccounts();
      expect(pub).toHaveLength(2);
      expect(pub[0]).not.toHaveProperty("accessToken");
      expect(pub[0]).not.toHaveProperty("refreshToken");

      expect(buildAccountCookieHeader(getDevAccount("u1"))).toBe(
        "access_token=secret-access-1; refresh_token=secret-refresh-1"
      );

      updateDevAccountTokens("u1", [
        "access_token=rotated-access-1; Path=/; HttpOnly",
        "refresh_token=rotated-refresh-1; Path=/; HttpOnly",
      ]);
      expect(getDevAccount("u1").accessToken).toBe("rotated-access-1");
      expect(getDevAccount("u1").refreshToken).toBe("rotated-refresh-1");

      expect(extractAuthCookiesFromSetCookie("access_token=abc; SameSite=Lax")).toEqual({
        accessToken: "abc",
      });

      removeDevAccount("u1");
      expect(listPublicDevAccounts().map((a) => a.id)).toEqual(["u2"]);
    });

    it("captures Google session when /auth/me returns { name, email, image } without user.id", async () => {
      const prevApiUrl = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000/api";
      const jwtPayload = Buffer.from(JSON.stringify({ sub: "uuid-google-1" })).toString("base64url");
      const fakeJwt = `hdr.${jwtPayload}.sig`;

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { getSetCookie: () => [] },
        json: async () => ({
          user: {
            name: "Jihad",
            email: "jihadchaabani75@gmail.com",
            image: "https://example.com/avatar.png",
          },
        }),
      });

      try {
        const res = await captureAccountRoute({
          cookies: {
            get: (k) =>
              k === "access_token"
                ? { value: fakeJwt }
                : k === "refresh_token"
                  ? { value: "ref-1" }
                  : undefined,
          },
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.account).toEqual(
          expect.objectContaining({
            id: "uuid-google-1",
            email: "jihadchaabani75@gmail.com",
            name: "Jihad",
            avatar: "https://example.com/avatar.png",
          })
        );
        expect(body.accounts).toHaveLength(1);
      } finally {
        fetchSpy.mockRestore();
        process.env.NEXT_PUBLIC_API_URL = prevApiUrl;
      }
    });
  });

  describe("cleanup helper", () => {
    it("calls DELETE /projects/:id via default client or account-scoped client", async () => {
      api.delete.mockResolvedValue({ ok: true });
      await deleteLoadTestProject("proj-99");
      expect(api.delete).toHaveBeenCalledWith("/projects/proj-99", { signal: undefined, timeout: 30000 });

      const scopedClient = { delete: vi.fn().mockResolvedValue({ ok: true }) };
      await deleteLoadTestProject("proj-acc-2", { apiClient: scopedClient });
      expect(scopedClient.delete).toHaveBeenCalledWith("/projects/proj-acc-2", {
        signal: undefined,
        timeout: 30000,
      });
    });
  });
});
