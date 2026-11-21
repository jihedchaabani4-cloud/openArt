import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup, waitFor } from "@testing-library/react";
import { PromptBarPlatform } from "@/components/cinema-studio/prompt-bar/PromptBarPlatform.jsx";
import { generatedMediaTemplate, selectCharacters } from "@/features/prompt-bar";

vi.mock("@/features/media", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ImportMediaPopover: ({ open, onOpenChange, onSelect }) =>
      open ? (
        <div data-testid="mock-media-popover">
          <button type="button" onClick={() => onOpenChange?.(false)}>
            Close Media
          </button>
          <button
            type="button"
            onClick={() =>
              onSelect?.([
                {
                  id: "img-1",
                  url: "https://example.com/1.png",
                  type: "image",
                  displayName: "Img 1",
                },
              ])
            }
          >
            Pick Image
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

const VIDEO_MODEL = {
  id: "vid-model-1",
  name: "Video Model",
  domain: "video",
  parameters: {
    duration: { type: "enum", values: ["5s", "10s"], default: "5s" },
    input_image: { type: "image", group: "media" },
    last_frame: { type: "image", group: "media" },
  },
};

describe("PromptBarPlatform — Sealed Public Service Migration", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("enforces mutually exclusive activeOverlay between Settings drawer and Media popover", async () => {
    const { container } = render(
      <PromptBarPlatform
        type={generatedMediaTemplate}
        featureConfig={generatedMediaTemplate}
        templateId="generated-media"
        instanceId="overlay-test"
        projectId="proj-overlay"
        models={[IMAGE_MODEL, VIDEO_MODEL]}
        onGenerate={vi.fn()}
        persist={false}
      />
    );

    const settingsBtn = container.querySelector(".settings-trigger-button");
    expect(settingsBtn).toBeTruthy();

    // 1. Open Settings overlay
    act(() => {
      fireEvent.click(settingsBtn);
    });
    expect(settingsBtn.className).toContain("is-active");
    expect(container.querySelector('[data-slot="prompt-box-settings"]')).toBeTruthy();
    expect(screen.queryByTestId("mock-media-popover")).toBeNull();

    // 2. Opening Media popover via Ref button closes Settings overlay
    const refBtn = screen.getByTitle("Add Reference / Element / Character");
    act(() => {
      fireEvent.click(refBtn);
    });
    expect(settingsBtn.className).not.toContain("is-active");
    expect(screen.getByTestId("mock-media-popover")).toBeTruthy();
    await waitFor(() => {
      expect(container.querySelector('[data-slot="prompt-box-settings"]')).toBeNull();
    });

    // 3. Clicking Settings button closes Media popover and opens Settings overlay
    act(() => {
      fireEvent.click(settingsBtn);
    });
    expect(settingsBtn.className).toContain("is-active");
    expect(container.querySelector('[data-slot="prompt-box-settings"]')).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByTestId("mock-media-popover")).toBeNull();
    });
  });

  it("switches mode, updates validated setting via FlowPromptBoxSettings, and clears draft atomically", () => {
    const onGenerate = vi.fn();
    const { container } = render(
      <PromptBarPlatform
        type={generatedMediaTemplate}
        featureConfig={generatedMediaTemplate}
        templateId="generated-media"
        instanceId="service-flow-test"
        projectId="proj-flow"
        models={[IMAGE_MODEL, VIDEO_MODEL]}
        onGenerate={onGenerate}
        persist={false}
      />
    );

    // Pick a reference via Media popover
    act(() => {
      fireEvent.click(screen.getByTitle("Add Reference / Element / Character"));
    });
    act(() => {
      fireEvent.click(screen.getByText("Pick Image"));
    });
    expect(screen.getByTestId("view-reference-img-1")).toBeTruthy();

    // Clear all uses atomic service.clearDraft()
    const clearAllBtn = screen.getByLabelText("Effacer tout");
    act(() => {
      fireEvent.click(clearAllBtn);
    });
    expect(screen.queryByTestId("view-reference-img-1")).toBeNull();

    // Open Settings, change aspect ratio via service.setSetting, and switch to Video mode via service.switchMode
    act(() => {
      fireEvent.click(container.querySelector(".settings-trigger-button"));
    });

    const ratio1x1 = screen.getByRole("radio", { name: "1:1" });
    act(() => {
      fireEvent.click(ratio1x1);
    });
    expect(ratio1x1.getAttribute("aria-checked")).toBe("true");

    const videoModeBtn = screen.getByRole("radio", { name: /Vidéo/i });
    act(() => {
      fireEvent.click(videoModeBtn);
    });
    expect(videoModeBtn.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("Start")).toBeTruthy();
    expect(screen.getByText("End")).toBeTruthy();
    expect(selectCharacters({ parameterValues: {} })).toEqual([]);
  });
});
