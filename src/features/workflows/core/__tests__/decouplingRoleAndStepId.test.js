import { describe, it, expect } from "vitest";
import { toMediaItem } from "../toMediaItem";
import { resolveMainMedia } from "../resolveMediaRef";

describe("ADR-0008 Decoupling media.step_id from workflow_media.role in frontend consumers", () => {
  it("toMediaItem resolves canonical role from role/mediaRole without using technical step_id as role", () => {
    // Case 1: Uploaded detail image (provenance: upload, relationship role: detail)
    const detailItem = toMediaItem({
      id: "m-detail-1",
      url: "https://example.com/detail.png",
      step_id: "upload",
      workflowStepId: "upload",
      role: "detail",
      mediaRole: "detail",
    });
    expect(detailItem.role).toBe("detail");

    // Case 2: Generated sheet (provenance: image_generation, relationship role: sheet)
    const sheetItem = toMediaItem({
      id: "m-sheet-1",
      url: "https://example.com/sheet.png",
      step_id: "image_generation",
      workflowStepId: "GEN",
      role: "sheet",
      mediaRole: "sheet",
    });
    expect(sheetItem.role).toBe("sheet");

    // Case 3: Uploaded media item without role must NOT treat 'upload' as a role
    const genericUpload = toMediaItem({
      id: "m-upload-1",
      url: "https://example.com/upload.png",
      step_id: "upload",
      workflowStepId: "upload",
    });
    expect(genericUpload.role).toBeNull();
  });

  it("resolveMainMedia / PICKERS.CHARACTER: distinguishes sheet and detail based on canonical role even when step_id is 'upload'", () => {
    const characterWorkflow = {
      id: "char-wf-1",
      workflow_type: "CHARACTER",
    };
    const items = [
      toMediaItem({
        id: "m-detail",
        url: "https://example.com/detail.png",
        role: "detail",
        mediaRole: "detail",
        step_id: "upload",
        workflowStepId: "upload",
      }),
      toMediaItem({
        id: "m-sheet",
        url: "https://example.com/sheet.png",
        role: "sheet",
        mediaRole: "sheet",
        step_id: "upload",
        workflowStepId: "upload",
      }),
    ];

    // Main media picker for CHARACTER must pick m-sheet because role='sheet', ignoring that both items have step_id='upload'
    const mainMedia = resolveMainMedia(characterWorkflow, items);
    expect(mainMedia).toBeDefined();
    expect(mainMedia.id).toBe("m-sheet");
    expect(mainMedia.url).toBe("https://example.com/sheet.png");
  });
});
