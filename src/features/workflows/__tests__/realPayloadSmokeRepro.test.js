import { describe, it, expect } from "vitest";
import realPayload from "./fixtures/realProjectDataPayload.json";
import { resolveMainMedia } from "../core/resolveMediaRef";
import { getItemMetadata } from "@/shared/lib/displayUtils";

// Replicates the resilient grouping in useFilteredWorkflows.js
function resolveWorkflowMediaItems(wf, rawMedia, mediaByWorkflow) {
  const cleanWfId = String(wf.name || wf.id || "").replace(/^workflows\//, "");
  const primaryId = wf.primary_media_id || wf.primaryMediaId || wf.metadata?.primaryMediaId;

  let wfItems = (wf.items?.length > 0 ? wf.items : (wf.media?.length > 0 ? wf.media : null))
    ?? mediaByWorkflow[wf.name]
    ?? mediaByWorkflow[wf.id]
    ?? mediaByWorkflow[cleanWfId]
    ?? [];

  if (wfItems.length === 0 && primaryId) {
    const matched = rawMedia.find((m) => (m.id || m.name) === primaryId);
    if (matched) {
      wfItems = [matched];
    }
  }

  return wfItems;
}

function groupMediaByWorkflow(media) {
  const map = {};
  for (const m of media) {
    const wfId = m.workflowId || m.workflow_id || m.workflowName;
    if (!wfId) continue;
    (map[wfId] ??= []).push(m);
    const cleanId = String(wfId).replace(/^workflows\//, "");
    if (cleanId !== wfId) (map[cleanId] ??= []).push(m);
  }
  return map;
}

describe("Smoke Test Repro with Real getProjectData Payload", () => {
  it("resolves all 4 uploaded workflows to completed media with non-null URLs", () => {
    const rawWorkflows = realPayload.workflows;
    const rawMedia = realPayload.media;

    const mediaByWorkflow = groupMediaByWorkflow(rawMedia);

    const uploadWorkflows = rawWorkflows.filter(
      (w) => w.workflow_type === "UPLOAD" || w.workflowType === "UPLOAD"
    );

    expect(uploadWorkflows.length).toBe(4);

    const resolutions = uploadWorkflows.map((wf) => {
      const wfItems = resolveWorkflowMediaItems(wf, rawMedia, mediaByWorkflow);

      const wfWithItems = {
        ...wf,
        items: wfItems.map((item) => ({
          ...item,
          asset_id: item.name || item.id,
          workflowStepId: item.workflowStepId || "upload",
        })),
      };

      // 1. Resolve main media
      const mainMedia = resolveMainMedia(wfWithItems);

      // 2. Resolve primary raw media (as useWorkflowActions does)
      const targetItem = mainMedia
        ? (mainMedia.raw || mainMedia)
        : {
            id: wf.id || wf.name,
            status: wf.status || "processing",
            url: null,
          };

      // 3. Resolve metadata via displayUtils.getItemMetadata
      const metadata = getItemMetadata(targetItem, wfWithItems);

      const isCompleted = metadata.status === "completed" && Boolean(metadata.url);
      const isProcessing = ["processing", "pending", "uploading", "queued"].includes(metadata.status);

      return {
        workflowId: wf.id,
        displayName: wf.display_name,
        primaryMediaId: wf.primary_media_id,
        linkedItemsCount: wfItems.length,
        mainMediaStatus: mainMedia?.status ?? null,
        mainMediaUrl: mainMedia?.url ?? null,
        metadataStatus: metadata.status,
        metadataUrl: metadata.url,
        isCompleted,
        isProcessing,
      };
    });

    for (const res of resolutions) {
      expect(res.linkedItemsCount).toBeGreaterThan(0);
      expect(res.isCompleted).toBe(true);
      expect(res.isProcessing).toBe(false);
      expect(res.metadataStatus).toBe("completed");
      expect(res.metadataUrl).toBeTruthy();
    }
  });

  it("backend payload to frontend contract test: status, url, and media identity fields", () => {
    // Assert the exact contract fields expected between ProjectReadService and the frontend
    const { workflows, media } = realPayload;

    expect(Array.isArray(workflows)).toBe(true);
    expect(Array.isArray(media)).toBe(true);

    const mediaById = new Map(media.map((m) => [m.id, m]));

    for (const wf of workflows) {
      // 1. Workflow contract keys
      expect(wf).toHaveProperty("id");
      expect(wf).toHaveProperty("workflow_type");

      const primaryId = wf.primary_media_id || wf.primaryMediaId;
      if (primaryId) {
        // 2. Referenced primary media exists in the media array
        const primaryMedia = mediaById.get(primaryId);
        expect(primaryMedia).toBeDefined();

        // 3. Media contract fields: status must be normalized/valid and url must be non-empty string
        expect(primaryMedia).toHaveProperty("status");
        expect(["success", "completed", "ready"]).toContain(primaryMedia.status.toLowerCase());
        expect(primaryMedia).toHaveProperty("url");
        expect(typeof primaryMedia.url).toBe("string");
        expect(primaryMedia.url.length).toBeGreaterThan(0);

        // 4. Contract test: resolveMainMedia with this primary media must return a ready MediaItem
        const resolved = resolveMainMedia({
          ...wf,
          items: [primaryMedia],
        });
        expect(resolved).not.toBeNull();
        expect(resolved.status).toBe("ready");
        expect(resolved.url).toBe(primaryMedia.url);

        // 5. getItemMetadata contract: must resolve to completed with valid url and not processing
        const meta = getItemMetadata(resolved.raw || resolved, wf);
        expect(meta.status).toBe("completed");
        expect(meta.url).toBe(primaryMedia.url);
      }
    }
  });
});
