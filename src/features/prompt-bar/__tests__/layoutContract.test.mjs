import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPromptBarVariant, PROMPT_BAR_VARIANTS } from "../model/core/promptBarLayout.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Layout Contract: promptBarLayout variants use unified p-2.5 padding and gap-1 row spacing", () => {
  const generation = getPromptBarVariant("generation");
  assert.ok(generation.innerClassName.includes("p-2.5"), "innerClassName must have p-2.5");
  assert.ok(generation.innerClassName.includes("gap-1"), "innerClassName must have gap-1");
  assert.equal(/px-\d+/.test(generation.innerClassName), false, "innerClassName must not have px");
  assert.equal(/py-\d+/.test(generation.innerClassName), false, "innerClassName must not have py");

  assert.ok(PROMPT_BAR_VARIANTS.generation.innerClassName.includes("p-2.5"));
  assert.ok(PROMPT_BAR_VARIANTS.generation.innerClassName.includes("gap-1"));
});

test("Layout Contract: PromptBarPlatform uses unified p-2.5 and gap-1 and removes split row paddings", () => {
  const platformPath = path.resolve(__dirname, "../platform/PromptBarPlatform.jsx");
  const content = fs.readFileSync(platformPath, "utf8");

  assert.equal(content.includes("px-4 pt-3 pb-1"), false, "must not include px-4 pt-3 pb-1");
  assert.equal(content.includes("px-4 pt-3 pb-2"), false, "must not include px-4 pt-3 pb-2");
  assert.equal(content.includes("px-3 pb-3"), false, "must not include px-3 pb-3");

  assert.ok(/innerClassName=["'][^"']*p-2\.5[^"']*["']/.test(content), "must have innerClassName with p-2.5");
  assert.ok(/innerClassName=["'][^"']*gap-1[^"']*["']/.test(content), "must have innerClassName with gap-1");
});
