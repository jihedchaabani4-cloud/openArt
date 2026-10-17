import { describe, it, expect } from "vitest";
import realPayload from "./fixtures/realProjectDataPayload.json";
import { resolveCachedWorkflowMediaItem } from "@/features/media/ui/SharedGalleryGrid";
import { getItemMetadata } from "@/shared/lib/displayUtils";

describe("Component Resolution for All 4 Upload Workflows", () => {
  it("resolves resolveCachedWorkflowMediaItem for all 4 upload workflows without processing placeholder", () => {
    const map = {};
    for (const m of realPayload.media) {
      const wfId = m.workflowId || m.workflow_id || m.workflowName;
      if (!wfId) continue;
      (map[wfId] ??= []).push(m);
    }

    const uploadWorkflows = realPayload.workflows
      .filter((w) => w.workflow_type === "UPLOAD")
      .map((wf) => {
        const cleanWfId = String(wf.name || wf.id || "").replace(/^workflows\//, "");
        const primaryId = wf.primary_media_id || wf.primaryMediaId || wf.metadata?.primaryMediaId;

        let wfItems = (wf.items?.length > 0 ? wf.items : (wf.media?.length > 0 ? wf.media : null))
          ?? map[wf.name]
          ?? map[wf.id]
          ?? map[cleanWfId]
          ?? [];

        if (wfItems.length === 0 && primaryId) {
          const matched = realPayload.media.find((m) => (m.id || m.name) === primaryId);
          if (matched) {
            wfItems = [matched];
          }
        }

        return {
          ...wf,
          items: wfItems.map((item) => ({
            ...item,
            asset_id: item.name || item.id,
            workflowStepId: item.workflowStepId || "upload",
          })),
        };
      });

    expect(uploadWorkflows.length).toBe(4);

    for (const wf of uploadWorkflows) {
      expect(wf.items.length).toBeGreaterThan(0);

      // This is what SharedGalleryGrid calls:
      const cachedMediaItem = resolveCachedWorkflowMediaItem(wf);
      expect(cachedMediaItem).not.toBeNull();
      expect(cachedMediaItem.status).toBe("ready");
      expect(cachedMediaItem.url).toBeTruthy();

      // What getItemMetadata returns on the resolved item:
      const meta = getItemMetadata(cachedMediaItem?.raw || cachedMediaItem, wf);
      expect(meta.status).toBe("completed");
      expect(meta.url).toBeTruthy();
    }
  });
});
