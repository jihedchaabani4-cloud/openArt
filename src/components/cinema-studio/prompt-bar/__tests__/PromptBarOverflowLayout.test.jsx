import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { PromptBarPlatform } from "@/components/cinema-studio/prompt-bar/PromptBarPlatform.jsx";
import { generatedMediaTemplate } from "@/features/prompt-bar";

vi.mock("@/features/media", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ImportMediaPopover: ({ open, onSelect }) =>
      open ? (
        <div data-testid="mock-media-popover">
          <button
            type="button"
            onClick={() =>
              onSelect?.([
                {
                  id: "ref-melt-1",
                  url: "https://example.com/melt.png",
                  type: "image",
                  displayName: "Melt Ref",
                },
              ])
            }
          >
            Pick Melt Ref
          </button>
        </div>
      ) : null,
  };
});

const IMAGE_MODEL = {
  id: "img-model-1",
  name: "Image Model",
  domain: "image",
  parameters: {
    aspect_ratio: { type: "enum", values: ["16:9", "1:1"], default: "16:9" },
    images: { type: "image[]", group: "media", maxItems: 4 },
  },
};

const LONG_4_LINE_PROMPT =
  "Drone shot of floating drifting icecaps with chaotic shards forming the word 'MELT', each letter intricately connected. The ice shards, reflecting the golden arctic twilight across deep turquoise water, slowly fracture as mist rises from the freezing sea.";

describe("PromptBar overflow, clipping, and button visibility regressions", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("bounds the fieldset grid tracks and flex min-h-0 chain so long prompts scroll inside one container instead of clipping line 4", () => {
    const { container } = render(
      <PromptBarPlatform
        type={generatedMediaTemplate}
        featureConfig={generatedMediaTemplate}
        templateId="generated-media"
        instanceId="overflow-test"
        projectId="proj-overflow"
        models={[IMAGE_MODEL]}
        onGenerate={vi.fn()}
        persist={false}
      />
    );

    const fieldset = container.querySelector('fieldset[data-source="reference"]');
    expect(fieldset).toBeTruthy();

    // Explicit 1fr tracks prevent implicit auto grid tracks from expanding past h-17 / h-44
    expect(fieldset.className).toContain("grid-cols-1");
    expect(fieldset.className).toContain("grid-rows-1");

    // Inner grid item & motion flex row must propagate min-h-0 so overflow-y-auto activates
    const innerRow = fieldset.querySelector(":scope > div");
    expect(innerRow).toBeTruthy();
    expect(innerRow.className).toContain("min-h-0");

    const editable = container.querySelector('[contenteditable="true"]');
    expect(editable).toBeTruthy();

    // ContentEditable must NOT carry single-line ds-input-ghost (height: 28px) or nested overflow-y-auto
    expect(editable.className).not.toContain("ds-input-ghost");
    expect(editable.className).not.toContain("overflow-y-auto");
    expect(editable.className).toContain("break-words");

    // Scroll container is the single overflow-y-auto ancestor, and its wrapper must not use justify-center
    const scrollContainer = editable.closest(".overflow-y-auto");
    expect(scrollContainer).toBeTruthy();
    expect(scrollContainer.className).toContain("min-h-0");
    expect(scrollContainer.parentElement.className).not.toContain("justify-center");
    expect(scrollContainer.parentElement.className).toContain("min-h-0");
  });

  it("does not clip the reference remove badge at the top edge and anchors it to the thumbnail stack", () => {
    const { container } = render(
      <PromptBarPlatform
        type={generatedMediaTemplate}
        featureConfig={generatedMediaTemplate}
        templateId="generated-media"
        instanceId="badge-clip-test"
        projectId="proj-badge"
        models={[IMAGE_MODEL]}
        onGenerate={vi.fn()}
        persist={false}
      />
    );

    // Attach a reference thumbnail
    act(() => {
      fireEvent.click(screen.getByTitle("Add Reference / Element / Character"));
    });
    act(() => {
      fireEvent.click(screen.getByText("Pick Melt Ref"));
    });

    const fieldset = container.querySelector('fieldset[data-source="reference"]');
    // Fieldset must not hard-clip corner badges or hover previews with overflow-hidden
    expect(fieldset.className).not.toContain("overflow-hidden");

    const removeAllBtn = screen.getByTestId("reference-remove-all-btn");
    const stackBtn = screen.getByTestId("reference-stack-btn");
    // Remove badge must share the tight relative anchor wrapper with the stack button (not an h-full container)
    expect(removeAllBtn.parentElement).toBe(stackBtn.parentElement);
    expect(removeAllBtn.parentElement.className).not.toContain("h-full");
  });

  it("keeps reference, clear, expand, settings, and generate buttons visible with an attached reference and a 4-line prompt", () => {
    const storeRef = { current: null };
    const { container } = render(
      <PromptBarPlatform
        type={generatedMediaTemplate}
        featureConfig={generatedMediaTemplate}
        templateId="generated-media"
        instanceId="buttons-visible-test"
        projectId="proj-buttons"
        models={[IMAGE_MODEL]}
        onGenerate={vi.fn()}
        persist={false}
      />
    );

    // Attach reference
    act(() => {
      fireEvent.click(screen.getByTitle("Add Reference / Element / Character"));
    });
    act(() => {
      fireEvent.click(screen.getByText("Pick Melt Ref"));
    });

    // Type a 4-line prompt into Lexical
    const editable = container.querySelector('[contenteditable="true"]');
    expect(editable).toBeTruthy();
    act(() => {
      fireEvent.input(editable, { target: { textContent: LONG_4_LINE_PROMPT } });
    });

    // All action buttons must remain mounted and shrink-0 protected
    expect(screen.getByTestId("reference-stack-btn")).toBeTruthy();
    expect(screen.getByTestId("reference-remove-all-btn")).toBeTruthy();
    expect(screen.getByLabelText("Effacer tout")).toBeTruthy();
    expect(container.querySelector(".settings-trigger-button")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Generate" })).toBeTruthy();

    // Motion row wrapping editor + right buttons must have min-h-0 so buttons never clip
    const clearBtn = screen.getByLabelText("Effacer tout");
    const buttonsGroup = clearBtn.closest(".shrink-0.self-start");
    expect(buttonsGroup).toBeTruthy();
    expect(buttonsGroup.parentElement.className).toContain("min-h-0");
    expect(storeRef.current).toBeNull();
  });
});
