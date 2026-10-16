import { describe, it, expect } from "vitest";
import {
  resolveMediaRef,
  resolveMainMedia,
  normalizeWorkflowType,
  getWorkflowPrimaryMediaId,
  PICKERS,
} from "../resolveMediaRef";
import { toMediaItem } from "../toMediaItem";

describe("Workflow Type Normalization", () => {
  it("normalizes uppercase and lowercase workflow types", () => {
    expect(normalizeWorkflowType({ workflow_type: "CHARACTER" })).toBe("CHARACTER");
    expect(normalizeWorkflowType({ workflow_type: "character" })).toBe("CHARACTER");
    expect(normalizeWorkflowType({ workflow_type: "CHARACTER_SHEET" })).toBe("CHARACTER");
    expect(normalizeWorkflowType({ is_character: true })).toBe("CHARACTER");

    expect(normalizeWorkflowType({ workflow_type: "ELEMENT" })).toBe("ELEMENT");
    expect(normalizeWorkflowType({ workflow_type: "element_sheet" })).toBe("ELEMENT");
    expect(normalizeWorkflowType({ is_element: true })).toBe("ELEMENT");

    expect(normalizeWorkflowType({ workflow_type: "UPLOAD" })).toBe("UPLOAD");
    expect(normalizeWorkflowType({ workflow_type: "upload" })).toBe("UPLOAD");

    expect(normalizeWorkflowType({ workflow_type: "GENERATION" })).toBe("GENERATION");
    expect(normalizeWorkflowType(null)).toBe("GENERATION");
  });
});

describe("Primary Media ID Extraction", () => {
  it("extracts primary media id from workflow and sidecars", () => {
    expect(getWorkflowPrimaryMediaId({ primary_media_id: "m-1" })).toBe("m-1");
    expect(getWorkflowPrimaryMediaId({ primaryMediaId: "m-2" })).toBe("m-2");
    expect(getWorkflowPrimaryMediaId({ metadata: { primaryMediaId: "m-3" } })).toBe("m-3");
    expect(getWorkflowPrimaryMediaId({ element: { primary_media_id: "m-elem" } })).toBe("m-elem");
    expect(getWorkflowPrimaryMediaId({ character: { primary_media_id: "m-char" } })).toBe("m-char");
    expect(getWorkflowPrimaryMediaId({})).toBeNull();
    expect(getWorkflowPrimaryMediaId(null)).toBeNull();
  });
});

describe("UPLOAD Picker", () => {
  const uploadPicker = PICKERS.UPLOAD;

  it("selects primary_media_id if matched", () => {
    const wf = { id: "wf-up", workflow_type: "UPLOAD", primary_media_id: "up-2" };
    const items = [
      toMediaItem({ id: "up-1", url: "https://example.com/1.png" }),
      toMediaItem({ id: "up-2", url: "https://example.com/2.png" }),
    ];
    const picked = uploadPicker(wf, items);
    expect(picked.id).toBe("up-2");
  });

  it("falls back to first item with valid URL when primary_media_id is not set", () => {
    const wf = { id: "wf-up", workflow_type: "UPLOAD" };
    const items = [
      toMediaItem({ id: "up-no-url", url: null }),
      toMediaItem({ id: "up-has-url", url: "https://example.com/has.png" }),
    ];
    const picked = uploadPicker(wf, items);
    expect(picked.id).toBe("up-has-url");
  });

  it("falls back to items[0] if no item has a URL", () => {
    const wf = { id: "wf-up", workflow_type: "UPLOAD" };
    const items = [
      toMediaItem({ id: "up-1", url: null }),
      toMediaItem({ id: "up-2", url: null }),
    ];
    const picked = uploadPicker(wf, items);
    expect(picked.id).toBe("up-1");
  });

  it("returns null for empty items", () => {
    const wf = { id: "wf-up", workflow_type: "UPLOAD" };
    expect(uploadPicker(wf, [])).toBeNull();
  });
});

describe("GENERATION Picker", () => {
  const genPicker = PICKERS.GENERATION;

  it("selects primary_media_id if matched", () => {
    const wf = { id: "wf-gen", workflow_type: "GENERATION", primary_media_id: "gen-2" };
    const items = [
      toMediaItem({ id: "gen-1", url: "https://example.com/1.png", status: "completed" }),
      toMediaItem({ id: "gen-2", url: "https://example.com/2.png", status: "completed" }),
    ];
    const picked = genPicker(wf, items);
    expect(picked.id).toBe("gen-2");
  });

  it("falls back to first completed/ready item with valid URL", () => {
    const wf = { id: "wf-gen", workflow_type: "GENERATION" };
    const items = [
      toMediaItem({ id: "gen-processing", url: "https://example.com/p.png", status: "processing" }),
      toMediaItem({ id: "gen-ready", url: "https://example.com/ready.png", status: "completed" }),
    ];
    const picked = genPicker(wf, items);
    expect(picked.id).toBe("gen-ready");
  });

  it("falls back to first item with valid URL if none are completed", () => {
    const wf = { id: "wf-gen", workflow_type: "GENERATION" };
    const items = [
      toMediaItem({ id: "gen-failed", url: null, status: "failed" }),
      toMediaItem({ id: "gen-proc-url", url: "https://example.com/proc.png", status: "processing" }),
    ];
    const picked = genPicker(wf, items);
    expect(picked.id).toBe("gen-proc-url");
  });

  it("falls back to items[0] if no item has a URL", () => {
    const wf = { id: "wf-gen", workflow_type: "GENERATION" };
    const items = [
      toMediaItem({ id: "gen-1", url: null, status: "processing" }),
      toMediaItem({ id: "gen-2", url: null, status: "processing" }),
    ];
    const picked = genPicker(wf, items);
    expect(picked.id).toBe("gen-1");
  });

  it("returns null for empty items", () => {
    expect(genPicker({ id: "wf-gen" }, [])).toBeNull();
  });
});

describe("ELEMENT Picker (Abolished Hash Modulo)", () => {
  const elemPicker = PICKERS.ELEMENT;

  it("respects workflow.primary_media_id (user selected cover)", () => {
    const wf = { id: "elem-wf", workflow_type: "ELEMENT", primary_media_id: "elem-cover" };
    const items = [
      toMediaItem({ id: "elem-1", url: "https://example.com/e1.png" }),
      toMediaItem({ id: "elem-cover", url: "https://example.com/cover.png" }),
      toMediaItem({ id: "elem-3", url: "https://example.com/e3.png" }),
    ];
    const picked = elemPicker(wf, items);
    expect(picked.id).toBe("elem-cover");
  });

  it("respects element sidecar primary_media_id", () => {
    const wf = {
      id: "elem-wf",
      workflow_type: "ELEMENT",
      element: { primary_media_id: "sidecar-cover" },
    };
    const items = [
      toMediaItem({ id: "elem-1", url: "https://example.com/e1.png" }),
      toMediaItem({ id: "sidecar-cover", url: "https://example.com/cover.png" }),
    ];
    const picked = elemPicker(wf, items);
    expect(picked.id).toBe("sidecar-cover");
  });

  it("never computes character-code hash modulo when no primary is set", () => {
    // With id "12345", character code hash modulo would pick a non-first element.
    // Canonical rule must pick the first item with valid URL.
    const wf = { id: "12345", workflow_type: "ELEMENT" };
    const items = [
      toMediaItem({ id: "first-item", url: "https://example.com/first.png" }),
      toMediaItem({ id: "second-item", url: "https://example.com/second.png" }),
      toMediaItem({ id: "third-item", url: "https://example.com/third.png" }),
    ];
    const picked = elemPicker(wf, items);
    expect(picked.id).toBe("first-item");
  });

  it("returns items[0] if no items have URLs", () => {
    const wf = { id: "elem-wf", workflow_type: "ELEMENT" };
    const items = [
      toMediaItem({ id: "elem-no-url", url: null }),
      toMediaItem({ id: "elem-no-url-2", url: null }),
    ];
    const picked = elemPicker(wf, items);
    expect(picked.id).toBe("elem-no-url");
  });
});

describe("CHARACTER Picker (Pin Wins, Sheet Priority, Non-Detail Fallback)", () => {
  const charPicker = PICKERS.CHARACTER;

  it("explicit primary_media_id ALWAYS wins, even if it is a detail image", () => {
    const wf = { id: "char-wf", workflow_type: "CHARACTER", primary_media_id: "char-detail-pinned" };
    const items = [
      toMediaItem({ id: "char-sheet", role: "sheet", url: "https://example.com/sheet.png" }),
      toMediaItem({ id: "char-detail-pinned", role: "detail", url: "https://example.com/detail.png" }),
    ];
    const picked = charPicker(wf, items);
    expect(picked.id).toBe("char-detail-pinned");
  });

  it("prioritizes turnaround sheet over detail images when no pin exists", () => {
    const wf = { id: "char-wf", workflow_type: "CHARACTER" };
    const items = [
      toMediaItem({ id: "char-detail-1", role: "detail", url: "https://example.com/d1.png" }),
      toMediaItem({ id: "char-detail-2", role: "detail", url: "https://example.com/d2.png" }),
      toMediaItem({ id: "char-sheet", role: "sheet", url: "https://example.com/sheet.png" }),
    ];
    const picked = charPicker(wf, items);
    expect(picked.id).toBe("char-sheet");
  });

  it("recognizes role 'turnaround' and step_id 'character_sheet' as turnaround sheet", () => {
    const wf = { id: "char-wf", workflow_type: "CHARACTER" };
    const items = [
      toMediaItem({ id: "char-detail", role: "detail", url: "https://example.com/d.png" }),
      toMediaItem({ id: "char-turnaround", role: "turnaround", url: "https://example.com/t.png" }),
    ];
    const picked = charPicker(wf, items);
    expect(picked.id).toBe("char-turnaround");
  });

  it("falls back to first non-detail image if no sheet exists", () => {
    const wf = { id: "char-wf", workflow_type: "CHARACTER" };
    const items = [
      toMediaItem({ id: "char-detail", role: "detail", url: "https://example.com/d.png" }),
      toMediaItem({ id: "char-output", role: "output", url: "https://example.com/out.png" }),
    ];
    const picked = charPicker(wf, items);
    expect(picked.id).toBe("char-output");
  });

  it("falls back to items[0] if only detail images exist", () => {
    const wf = { id: "char-wf", workflow_type: "CHARACTER" };
    const items = [
      toMediaItem({ id: "char-detail-1", role: "detail", url: "https://example.com/d1.png" }),
      toMediaItem({ id: "char-detail-2", role: "detail", url: "https://example.com/d2.png" }),
    ];
    const picked = charPicker(wf, items);
    expect(picked.id).toBe("char-detail-1");
  });
});

describe("resolveMediaRef & Precedence", () => {
  const sampleItems = [
    toMediaItem({ id: "m-1", workflow_id: "wf-1", url: "https://example.com/m1.png", role: "output" }),
    toMediaItem({ id: "m-2", workflow_id: "wf-1", url: "https://example.com/m2.png", role: "sheet" }),
  ];

  it("when both mediaId and workflowId are given, mediaId wins", () => {
    const index = {
      byCompositeKey: new Map([["wf-1:m-1", sampleItems[0]], ["wf-1:m-2", sampleItems[1]]]),
      byMediaId: new Map([["m-1", sampleItems[0]], ["m-2", sampleItems[1]]]),
      byWorkflowId: new Map([["wf-1", sampleItems]]),
      workflows: [{ id: "wf-1", workflow_type: "CHARACTER", primary_media_id: "m-2" }],
    };

    // Workflow main media would be m-2 (pinned and sheet). But mediaId is m-1 -> mediaId wins!
    const resolved = resolveMediaRef({ mediaId: "m-1", workflowId: "wf-1" }, index);
    expect(resolved.id).toBe("m-1");
  });

  it("resolves workflow main media when only workflowId is given", () => {
    const index = {
      byCompositeKey: new Map([["wf-1:m-1", sampleItems[0]], ["wf-1:m-2", sampleItems[1]]]),
      byMediaId: new Map([["m-1", sampleItems[0]], ["m-2", sampleItems[1]]]),
      byWorkflowId: new Map([["wf-1", sampleItems]]),
      workflows: [{ id: "wf-1", workflow_type: "CHARACTER" }],
    };

    // No explicit pin -> Character sheet m-2 wins over output m-1
    const resolved = resolveMediaRef({ workflowId: "wf-1" }, index);
    expect(resolved.id).toBe("m-2");
  });

  it("resolves media by mediaId directly from context.items array", () => {
    const resolved = resolveMediaRef({ mediaId: "m-2" }, { items: sampleItems });
    expect(resolved.id).toBe("m-2");
  });

  it("returns null if mediaId is not found", () => {
    const index = {
      byCompositeKey: new Map(),
      byMediaId: new Map(),
      byWorkflowId: new Map(),
      workflows: [],
    };
    const resolved = resolveMediaRef({ mediaId: "non-existent" }, index);
    expect(resolved).toBeNull();
  });

  it("returns null if neither mediaId nor workflowId is provided", () => {
    expect(resolveMediaRef(null, {})).toBeNull();
    expect(resolveMediaRef({}, {})).toBeNull();
  });
});

describe("resolveMainMedia", () => {
  it("resolves primary media from embedded workflow items", () => {
    const wf = {
      id: "wf-embedded",
      workflow_type: "CHARACTER",
      items: [
        { id: "d-1", role: "detail", url: "https://example.com/d.png" },
        { id: "s-1", role: "sheet", url: "https://example.com/s.png" },
      ],
    };
    const main = resolveMainMedia(wf);
    expect(main.id).toBe("s-1");
  });

  it("resolves primary media from separately supplied items array", () => {
    const wf = { id: "wf-sep", workflow_type: "ELEMENT" };
    const items = [
      { id: "e-1", url: "https://example.com/e.png" },
    ];
    const main = resolveMainMedia(wf, items);
    expect(main.id).toBe("e-1");
  });

  it("returns null when workflow and items are empty", () => {
    expect(resolveMainMedia(null)).toBeNull();
    expect(resolveMainMedia({ id: "wf-empty", items: [] })).toBeNull();
  });
});
