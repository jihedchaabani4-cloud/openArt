import { describe, it, expect } from "vitest";
import { getItemMetadata } from "./displayUtils";

describe("displayUtils - getItemMetadata aspect ratio resolution", () => {
  it("resolves aspect ratio from item.generationConfig.ratio when present", () => {
    const item = {
      id: "media-1",
      file_url: "https://example.com/item.png",
      status: "completed",
      generationConfig: {
        ratio: "16:9",
        prompt: "A beautiful scenery",
      },
      image: {
        dimensions: { width: 1024, height: 1024 }, // placeholder square dimensions
      },
    };
    const workflow = {
      id: "wf-1",
      workflow_type: "GENERATION",
    };

    const meta = getItemMetadata(item, workflow);
    expect(meta.aspect).toBe("16/9");
  });

  it("resolves aspect ratio from workflow.metadata.generationConfig.ratio for element sheets", () => {
    const item = {
      id: "elem-item-1",
      file_url: "https://example.com/sheet.png",
      status: "completed",
      workflowStepId: "CAE",
    };
    const workflow = {
      id: "wf-elem-1",
      workflow_type: "ELEMENT_SHEET",
      metadata: {
        generationConfig: {
          ratio: "16:9",
        },
      },
    };

    const meta = getItemMetadata(item, workflow);
    expect(meta.aspect).toBe("16/9");
  });

  it("resolves aspect ratio from group.generationConfig.ratio", () => {
    const item = {
      id: "item-2",
      file_url: "https://example.com/char.png",
      status: "completed",
    };
    const workflow = {
      id: "wf-char-1",
      workflow_type: "CHARACTER",
      generationConfig: {
        ratio: "9:16",
      },
    };

    const meta = getItemMetadata(item, workflow);
    expect(meta.aspect).toBe("9/16");
  });
});
