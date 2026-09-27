/**
 * Library Exclusion Contract Tests
 *
 * Validates that already-selected items, elements, characters, and images
 * are cleanly identified and excluded from the media library selection list/grid.
 */

import test from "node:test";
import assert from "node:assert/strict";

import { extractIdentifyingKeys } from "../model/useLibraryFilter.js";

// Minimal simulated filter matching useLibraryFilter / ImportMediaPopover logic
function filterExcludedItems(items, selectedItems) {
  const rawList = Array.isArray(selectedItems) ? selectedItems : [selectedItems];
  const set = new Set();
  rawList.forEach((it) => {
    extractIdentifyingKeys(it).forEach((k) => set.add(k));
  });

  if (set.size === 0) return items;

  return items.filter((item) => {
    const itemKeys = extractIdentifyingKeys(item);
    return !itemKeys.some((k) => set.has(k));
  });
}

test("extractIdentifyingKeys: handles string, number, and object structures", () => {
  assert.deepStrictEqual(extractIdentifyingKeys("wf_123"), ["wf_123"]);
  assert.deepStrictEqual(extractIdentifyingKeys(456), ["456"]);
  assert.deepStrictEqual(extractIdentifyingKeys(null), []);
  assert.deepStrictEqual(extractIdentifyingKeys(undefined), []);

  const complexObj = {
    id: "id_1",
    workflow_id: "wf_1",
    url: "https://example.com/image.png",
    rawValue: {
      workflow_id: "wf_1",
      file_url: "https://example.com/image_raw.png",
    },
  };

  const keys = extractIdentifyingKeys(complexObj);
  assert.ok(keys.includes("id_1"));
  assert.ok(keys.includes("wf_1"));
  assert.ok(keys.includes("https://example.com/image.png"));
  assert.ok(keys.includes("https://example.com/image_raw.png"));
});

test("Library Exclusion: Excludes items matching selected item by workflow_id", () => {
  const library = [
    { id: "wf_1", workflow_id: "wf_1", type: "character", display_name: "Hero" },
    { id: "wf_2", workflow_id: "wf_2", type: "element", display_name: "Magic Sword" },
    { id: "wf_3", workflow_id: "wf_3", type: "image", display_name: "Background" },
  ];

  const selected = [{ workflow_id: "wf_1", type: "character" }];
  const remaining = filterExcludedItems(library, selected);

  assert.strictEqual(remaining.length, 2);
  assert.strictEqual(remaining.find((i) => i.workflow_id === "wf_1"), undefined);
  assert.ok(remaining.find((i) => i.workflow_id === "wf_2"));
  assert.ok(remaining.find((i) => i.workflow_id === "wf_3"));
});

test("Library Exclusion: Excludes items matching selected item by URL", () => {
  const library = [
    { id: "img_1", url: "https://cdn.example.com/cat.jpg", type: "image" },
    { id: "img_2", url: "https://cdn.example.com/dog.jpg", type: "image" },
  ];

  const selected = [{ url: "https://cdn.example.com/cat.jpg" }];
  const remaining = filterExcludedItems(library, selected);

  assert.strictEqual(remaining.length, 1);
  assert.strictEqual(remaining[0].id, "img_2");
});

test("Library Exclusion: Excludes items when passed as plain string ID or URL", () => {
  const library = [
    { id: "asset_alpha", workflow_id: "wf_alpha", url: "https://cdn.example.com/alpha.png" },
    { id: "asset_beta", workflow_id: "wf_beta", url: "https://cdn.example.com/beta.png" },
  ];

  const remaining = filterExcludedItems(library, ["wf_alpha"]);
  assert.strictEqual(remaining.length, 1);
  assert.strictEqual(remaining[0].id, "asset_beta");
});

test("Library Exclusion: Excludes activeReferences objects from PromptBar tagsService", () => {
  const library = [
    { id: "elem_sheet_1", workflow_id: "wf_elem_1", type: "element", url: "https://cdn.example.com/elem1.png" },
    { id: "char_sheet_1", workflow_id: "wf_char_1", type: "character", url: "https://cdn.example.com/char1.png" },
    { id: "gen_img_1", workflow_id: "wf_gen_1", type: "image", url: "https://cdn.example.com/gen1.png" },
  ];

  // Simulated activeReferences structure from tagsService.getActiveReferences
  const activeReferences = [
    {
      role: "reference",
      assetId: "wf_elem_1",
      workflow_id: "wf_elem_1",
      id: "wf_elem_1",
      displayName: "Flame Blade",
      url: "https://cdn.example.com/elem1.png",
      type: "element",
      rawValue: {
        id: "elem_sheet_1",
        workflow_id: "wf_elem_1",
      },
    },
  ];

  const remaining = filterExcludedItems(library, activeReferences);
  assert.strictEqual(remaining.length, 2);
  assert.strictEqual(remaining.find((i) => i.workflow_id === "wf_elem_1"), undefined);
  assert.ok(remaining.find((i) => i.workflow_id === "wf_char_1"));
  assert.ok(remaining.find((i) => i.workflow_id === "wf_gen_1"));
});

test("Library Exclusion: Returns full library when selectedItems is empty or undefined", () => {
  const library = [
    { id: "1", name: "One" },
    { id: "2", name: "Two" },
  ];

  assert.strictEqual(filterExcludedItems(library, []).length, 2);
  assert.strictEqual(filterExcludedItems(library, null).length, 2);
  assert.strictEqual(filterExcludedItems(library, undefined).length, 2);
});
