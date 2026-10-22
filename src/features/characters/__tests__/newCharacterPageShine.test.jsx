import { describe, expect, it } from "vitest";

describe("NewCharacterPage generated-prompt shine", () => {
  const fs = require("fs");
  const path = require("path");
  const pageFile = fs.readFileSync(
    path.resolve(__dirname, "../../../app/cinema-studio/[projectId]/characters/new/page.js"),
    "utf8"
  );

  it("shows the generated-prompt label through ShineText while the request is in flight", () => {
    expect(pageFile).toContain('<ShineText className="text-[0.6875rem] font-medium pt-0.5">');
    expect(pageFile).toContain("Génération du prompt...");
  });

  it("drops the old animate-pulse treatment from the generating label", () => {
    expect(pageFile).not.toContain("animate-pulse");
  });

  it("keeps the CharacterPromptBar embedding contract unchanged", () => {
    expect(pageFile).toContain("<CharacterPromptBar");
    expect(pageFile).toContain("projectId={effectiveProjectId}");
    expect(pageFile).toContain("onGenerate={handleGenerate}");
    expect(pageFile).toContain("isGenerating={createCharacterMutation.isPending}");
  });
});
