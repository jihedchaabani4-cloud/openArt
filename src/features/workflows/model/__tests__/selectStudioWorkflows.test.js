import { describe, it, expect } from "vitest";
import { selectStudioWorkflows } from "../selectStudioWorkflows";

describe("selectStudioWorkflows - Unified Workflow Filtering System", () => {
  const sampleProjectContents = {
    workflows: [
      {
        id: "wf-gen-1",
        name: "wf-gen-1",
        workflow_type: "GENERATION",
        metadata: { createTime: "2026-10-20T10:00:00Z", favorited: true, displayName: "Hero Asset" },
      },
      {
        id: "wf-upload-1",
        name: "wf-upload-1",
        workflow_type: "UPLOAD",
        metadata: { createTime: "2026-10-21T10:00:00Z" },
      },
      {
        id: "wf-elem-1",
        name: "wf-elem-1",
        workflow_type: "ELEMENT_SHEET",
        metadata: { createTime: "2026-10-22T10:00:00Z", guidelines: "Golden Sword" },
      },
      {
        id: "wf-char-1",
        name: "wf-char-1",
        workflow_type: "CHARACTER",
        metadata: { createTime: "2026-10-23T10:00:00Z", displayName: "Knight Arthur" },
      },
      {
        id: "wf-corrupted-1",
        name: null,
        display_name: null,
        workflow_type: "GENERATION",
        metadata: null,
      },
    ],
    media: [
      {
        id: "m-gen-1",
        workflow_id: "wf-gen-1",
        url: "https://example.com/hero.png",
        image: true,
        generationConfig: { prompt: "A cinematic hero in silver armor", model: "model-v1" },
      },
      {
        id: "m-up-1",
        workflow_id: "wf-upload-1",
        url: "https://example.com/photo.jpg",
        image: true,
        asset_type: "upload",
      },
      {
        id: "m-elem-1",
        workflow_id: "wf-elem-1",
        url: "https://example.com/sword.png",
        image: true,
      },
      {
        id: "m-char-1",
        workflow_id: "wf-char-1",
        role: "sheet",
        url: "https://example.com/warrior.png",
        status: "ready",
      },
    ],
    elements: [
      {
        id: "elem-1",
        workflow_id: "wf-elem-1",
        element_type: "prop",
        description: "Legendary weapon forged in fire",
        guidelines: "Keep it glowing",
      },
    ],
    trashedWorkflows: [
      {
        id: "wf-trashed-1",
        name: "wf-trashed-1",
        workflow_type: "GENERATION",
        display_name: "Deleted Sunrise",
        deleted_at: "2026-10-24T12:00:00Z",
      },
    ],
  };

  it("1. 'type: all' includes all supported active workflow types and excludes trash", () => {
    const result = selectStudioWorkflows(sampleProjectContents, { type: "all" });

    // 5 active workflows in total (gen, upload, element, char, corrupted)
    expect(result).toHaveLength(5);
    const ids = result.map((w) => w.id);
    expect(ids).toContain("wf-gen-1");
    expect(ids).toContain("wf-upload-1");
    expect(ids).toContain("wf-elem-1");
    expect(ids).toContain("wf-char-1");
    expect(ids).not.toContain("wf-trashed-1");
  });

  it("2. 'type: generation' returns only generations", () => {
    const result = selectStudioWorkflows(sampleProjectContents, { type: "generation" });

    expect(result.some((w) => w.id === "wf-gen-1")).toBe(true);
    expect(result.some((w) => w.id === "wf-upload-1")).toBe(false);
    expect(result.some((w) => w.id === "wf-elem-1")).toBe(false);
    expect(result.some((w) => w.id === "wf-char-1")).toBe(false);
  });

  it("3. 'type: upload' returns only uploads", () => {
    const result = selectStudioWorkflows(sampleProjectContents, { type: "upload" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("wf-upload-1");
    expect(result[0].type).toBe("upload");
  });

  it("4. 'type: element' returns only elements with merged element metadata", () => {
    const result = selectStudioWorkflows(sampleProjectContents, { type: "element" });

    expect(result).toHaveLength(1);
    const elem = result[0];
    expect(elem.id).toBe("wf-elem-1");
    expect(elem.element_type).toBe("prop");
    expect(elem.description).toBe("Legendary weapon forged in fire");
    expect(elem.guidelines).toBe("Keep it glowing");
  });

  it("5. 'type: character' returns only characters with resolved turnaround sheet", () => {
    const result = selectStudioWorkflows(sampleProjectContents, { type: "character" });

    expect(result).toHaveLength(1);
    const char = result[0];
    expect(char.id).toBe("wf-char-1");
    expect(char.primary_media_url).toBe("https://example.com/warrior.png");
    expect(char.status).toBe("completed");
  });

  it("6. 'lifecycle: trash' strictly returns trashedWorkflows and not active workflows", () => {
    const result = selectStudioWorkflows(sampleProjectContents, { lifecycle: "trash" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("wf-trashed-1");
    expect(result[0].display_name).toBe("Deleted Sunrise");
  });

  it("7. Search matches case-insensitively on name/display_name and prompt", () => {
    // Search by prompt: "silver armor"
    const promptSearch = selectStudioWorkflows(sampleProjectContents, {
      type: "all",
      search: "SILVER ARMOR",
    });
    expect(promptSearch).toHaveLength(1);
    expect(promptSearch[0].id).toBe("wf-gen-1");

    // Search by display name: "Arthur"
    const nameSearch = selectStudioWorkflows(sampleProjectContents, {
      type: "all",
      search: "arthur",
    });
    expect(nameSearch).toHaveLength(1);
    expect(nameSearch[0].id).toBe("wf-char-1");
  });

  it("8. Search handles corrupted/null fields safely without throwing", () => {
    expect(() => {
      selectStudioWorkflows(sampleProjectContents, {
        type: "all",
        search: "anything",
      });
    }).not.toThrow();
  });

  it("9. Filters liked/favorites and sorts newest vs oldest predictably", () => {
    const liked = selectStudioWorkflows(sampleProjectContents, {
      type: "all",
      liked: true,
    });
    expect(liked).toHaveLength(1);
    expect(liked[0].id).toBe("wf-gen-1");

    const oldest = selectStudioWorkflows(sampleProjectContents, {
      type: "all",
      sort: "oldest",
    });
    expect(oldest[0].id).toBe("wf-corrupted-1"); // 0 timestamp comes first
  });

  it("10. Backwards compatibility: supports domain option ('assets', 'elements', 'characters', 'trash')", () => {
    const assets = selectStudioWorkflows(sampleProjectContents, { domain: "assets" });
    expect(assets.some((w) => w.id === "wf-gen-1")).toBe(true);
    expect(assets.some((w) => w.id === "wf-upload-1")).toBe(true);
    expect(assets.some((w) => w.id === "wf-elem-1")).toBe(false);

    const trash = selectStudioWorkflows(sampleProjectContents, { domain: "trash" });
    expect(trash).toHaveLength(1);
    expect(trash[0].id).toBe("wf-trashed-1");
  });

  it("11. Unified search across all types: matches element description, guidelines, and element_type", () => {
    // Search element by description
    const descSearch = selectStudioWorkflows(sampleProjectContents, {
      type: "all",
      search: "forged in fire",
    });
    expect(descSearch.some((w) => w.id === "wf-elem-1")).toBe(true);

    // Search element by guidelines
    const guideSearch = selectStudioWorkflows(sampleProjectContents, {
      type: "all",
      search: "glowing",
    });
    expect(guideSearch.some((w) => w.id === "wf-elem-1")).toBe(true);

    // Search element by element_type
    const typeSearch = selectStudioWorkflows(sampleProjectContents, {
      type: "all",
      search: "prop",
    });
    expect(typeSearch.some((w) => w.id === "wf-elem-1")).toBe(true);
  });

  it("12. Unified search across characters: matches character metadata, title, and character entity", () => {
    const withCharacterEntity = {
      ...sampleProjectContents,
      characters: [
        {
          id: "char-entity-1",
          workflow_id: "wf-char-1",
          name: "Sir Lancelot",
          description: "Brave paladin of the round table",
        },
      ],
    };

    const charSearch = selectStudioWorkflows(withCharacterEntity, {
      type: "character",
      search: "paladin",
    });
    expect(charSearch).toHaveLength(1);
    expect(charSearch[0].id).toBe("wf-char-1");

    const nameSearch = selectStudioWorkflows(withCharacterEntity, {
      type: "character",
      search: "Lancelot",
    });
    expect(nameSearch).toHaveLength(1);
    expect(nameSearch[0].id).toBe("wf-char-1");
  });

  it("13. Unified search in Trash: matches trashed display_name, prompt, and type", () => {
    const trashContents = {
      ...sampleProjectContents,
      trashedWorkflows: [
        {
          id: "wf-trash-gen",
          name: "wf-trash-gen",
          display_name: "Morning Dew",
          workflow_type: "GENERATION",
          prompt: "Dewdrops on emerald leaves at dawn",
          deleted_at: "2026-10-24T12:00:00Z",
        },
        {
          id: "wf-trash-char",
          name: "wf-trash-char",
          display_name: "Cyber Rogue",
          workflow_type: "CHARACTER",
          deleted_at: "2026-10-25T12:00:00Z",
        },
      ],
    };

    // Match prompt in trash
    const promptSearch = selectStudioWorkflows(trashContents, {
      lifecycle: "trash",
      search: "dewdrops",
    });
    expect(promptSearch).toHaveLength(1);
    expect(promptSearch[0].id).toBe("wf-trash-gen");

    // Match type in trash
    const typeSearch = selectStudioWorkflows(trashContents, {
      lifecycle: "trash",
      search: "character",
    });
    expect(typeSearch).toHaveLength(1);
    expect(typeSearch[0].id).toBe("wf-trash-char");
  });
});
