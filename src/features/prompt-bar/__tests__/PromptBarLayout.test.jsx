import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { getPromptBarVariant, PROMPT_BAR_VARIANTS } from "../model/core/promptBarLayout.js";

describe("PromptBar Padding & Row Spacing Layout Contract", () => {
  it("enforces unified single 'p' padding (p-2.5) and reduced gap (gap-1) in promptBarLayout variants", () => {
    const generationVariant = getPromptBarVariant("generation");
    expect(generationVariant.innerClassName).toContain("p-2.5");
    expect(generationVariant.innerClassName).toContain("gap-1");
    expect(generationVariant.innerClassName).not.toMatch(/px-\d+/);
    expect(generationVariant.innerClassName).not.toMatch(/py-\d+/);

    expect(PROMPT_BAR_VARIANTS.generation.innerClassName).toContain("p-2.5");
    expect(PROMPT_BAR_VARIANTS.generation.innerClassName).toContain("gap-1");
  });

  it("PromptBarPlatform uses unified p-2.5 and gap-1 and eliminates split row paddings (px-4 pt-3, px-3 pb-3)", () => {
    const platformFilePath = path.resolve(__dirname, "../platform/PromptBarPlatform.jsx");
    const platformContent = fs.readFileSync(platformFilePath, "utf8");

    // The old fragmented row paddings must be removed
    expect(platformContent).not.toContain("px-4 pt-3 pb-1");
    expect(platformContent).not.toContain("px-4 pt-3 pb-2");
    expect(platformContent).not.toContain("px-3 pb-3");

    // Inner prompt bar container must specify reduced gap and unified p-2.5 padding
    expect(platformContent).toMatch(/innerClassName=["'][^"']*p-2\.5[^"']*["']/);
    expect(platformContent).toMatch(/innerClassName=["'][^"']*gap-1[^"']*["']/);
  });
});
