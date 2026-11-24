import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { RemoveBackgroundPanel } from "../RemoveBackgroundPanel";
import {
  buildImageRemoveBackgroundPayload,
  filterRemoveBackgroundModels,
} from "@/features/workflows/api/mutations/useImageRemoveBackgroundEdit";

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const CATALOG_FIXTURE = [
  {
    key: "nanobana_2",
    displayName: "NanoBana 2",
    category: "image",
    pricing: { currency: "credits", table: { default: 13 }, defaultCost: 13 },
    parameters: { prompt: { type: "string", required: true } },
  },
  {
    key: "bria_remove_background_3_0",
    displayName: "Bria Remove Background 3.0",
    description: "High-precision AI background removal (RMBG 3.0) by Bria.",
    category: "remove_background",
    pricing: { currency: "credits", table: { default: 3 }, defaultCost: 3 },
    parameters: {
      input_image: {
        type: "string",
        required: true,
        max: 1,
        description: "Source image URL",
      },
      preserve_alpha: {
        type: "boolean",
        required: false,
        default: true,
        description: "Preserve the alpha channel in the returned asset.",
      },
    },
  },
  {
    key: "bria_remove_background_guided",
    displayName: "Bria Remove Background Guided",
    description: "Text-guided AI background removal by Bria.",
    category: "remove_background",
    pricing: { currency: "credits", table: { default: 4 }, defaultCost: 4 },
    parameters: {
      input_image: {
        type: "string",
        required: true,
        max: 1,
        description: "Source image URL",
      },
      prompt: {
        type: "string",
        required: false,
        description: "Keep or drop specific subjects.",
      },
      preserve_alpha: {
        type: "boolean",
        required: false,
        default: true,
        description: "Preserve existing transparency/alpha channel.",
      },
    },
  },
];

describe("buildImageRemoveBackgroundPayload", () => {
  it("builds direct removal payload, strips forbidden/URL fields, and omits prompt when unsupported", () => {
    const modelSchema = CATALOG_FIXTURE[1];
    const payload = buildImageRemoveBackgroundPayload({
      workflowId: "wf-123",
      model: modelSchema.key,
      modelSchema,
      prompt: "should be omitted for 3.0",
      preserve_alpha: true,
      parameters: {
        input_image: "https://cdn.example.com/a.png",
        media_id: "m-1",
        image_url: "https://cdn.example.com/b.png",
      },
    });

    expect(payload).toEqual({
      workflow_id: "wf-123",
      model: "bria_remove_background_3_0",
      preserve_alpha: true,
    });
    expect(payload).not.toHaveProperty("prompt");
    expect(payload).not.toHaveProperty("parameters");
  });

  it("includes trimmed prompt for guided model and forwards extra safe schema parameters", () => {
    const customModel = {
      key: "future_rmbg_v4",
      category: "remove_background",
      parameters: {
        input_image: { type: "string", required: true },
        prompt: { type: "string", required: false },
        preserve_alpha: { type: "boolean", default: false },
        matte_mode: { type: "string", values: ["fast", "refined"], default: "refined" },
        unsafe_url_param: { type: "string" },
      },
    };

    const payload = buildImageRemoveBackgroundPayload({
      workflowId: "wf-456",
      model: customModel.key,
      modelSchema: customModel,
      prompt: "  keep only the person on the left  ",
      preserve_alpha: false,
      parameters: {
        matte_mode: "refined",
        unsafe_url_param: "https://evil.example.com/img.png",
        undeclared_param: "ignored",
      },
    });

    expect(payload).toEqual({
      workflow_id: "wf-456",
      model: "future_rmbg_v4",
      prompt: "keep only the person on the left",
      preserve_alpha: false,
      parameters: { matte_mode: "refined" },
    });
  });

  it("throws when workflowId is blank or prompt exceeds 2000 chars", () => {
    expect(() =>
      buildImageRemoveBackgroundPayload({ workflowId: "   ", model: "bria_remove_background_3_0" })
    ).toThrow(/workflow_id/i);

    expect(() =>
      buildImageRemoveBackgroundPayload({
        workflowId: "wf-1",
        model: "bria_remove_background_guided",
        modelSchema: CATALOG_FIXTURE[2],
        prompt: "a".repeat(2001),
      })
    ).toThrow(/2000/);
  });

  it("filters only remove_background models from catalog", () => {
    const filtered = filterRemoveBackgroundModels(CATALOG_FIXTURE);
    expect(filtered.map((m) => m.key)).toEqual([
      "bria_remove_background_3_0",
      "bria_remove_background_guided",
    ]);
  });
});

describe("RemoveBackgroundPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders FlowSelect model dropdown with only remove_background models, defaults to 3.0, hides input_image & prompt, and submits", () => {
    const onGenerate = vi.fn();
    render(<RemoveBackgroundPanel models={CATALOG_FIXTURE} onGenerate={onGenerate} />);

    // Model dropdown trigger shows default Bria 3.0
    const modelTrigger = screen.getByRole("button", { name: /select remove background model/i });
    expect(modelTrigger.textContent).toContain("Bria Remove Background 3.0");

    // Open dropdown to verify only remove_background models appear (image model excluded, no credit badge)
    fireEvent.click(modelTrigger);
    expect(screen.queryByRole("option", { name: /nanobana 2/i })).toBeNull();
    const opt30 = screen.getByRole("option", { name: /bria remove background 3\.0/i });
    const optGuided = screen.getByRole("option", { name: /bria remove background guided/i });
    expect(opt30.textContent).not.toMatch(/\bcr\b/i);
    expect(optGuided.textContent).not.toMatch(/\bcr\b/i);

    // Never renders input_image field
    expect(screen.queryByLabelText(/input image/i)).toBeNull();

    // Prompt hidden for 3.0
    expect(screen.queryByLabelText(/prompt/i)).toBeNull();

    // Preserve Alpha switch defaults to checked (true)
    const alphaSwitch = screen.getByRole("switch", { name: /preserve alpha/i });
    expect(alphaSwitch.getAttribute("data-state")).toBe("checked");

    // Submit CTA shows 3 credits
    const submitBtn = screen.getByRole("button", { name: /remove background\s*3/i });
    fireEvent.click(submitBtn);

    expect(onGenerate).toHaveBeenCalledTimes(1);
    const call = onGenerate.mock.calls[0][0];
    expect(call.model).toBe("bria_remove_background_3_0");
    expect(call.preserve_alpha).toBe(true);
    expect(call.prompt).toBeUndefined();
  });

  it("shows animated outline prompt below model selector for guided model and clears prompt when switching back", async () => {
    const onGenerate = vi.fn();
    render(<RemoveBackgroundPanel models={CATALOG_FIXTURE} onGenerate={onGenerate} />);

    // Open FlowSelect dropdown and select Guided model
    fireEvent.click(screen.getByRole("button", { name: /select remove background model/i }));
    fireEvent.click(screen.getByRole("option", { name: /bria remove background guided/i }));

    const promptInput = screen.getByLabelText(/prompt/i);
    fireEvent.change(promptInput, { target: { value: "keep only the person on the left" } });

    // Toggle Preserve Alpha off
    fireEvent.click(screen.getByRole("switch", { name: /preserve alpha/i }));

    // Submit CTA shows 4 credits
    fireEvent.click(screen.getByRole("button", { name: /remove background\s*4/i }));
    expect(onGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "bria_remove_background_guided",
        prompt: "keep only the person on the left",
        preserve_alpha: false,
      })
    );

    // Switch back to 3.0 -> prompt exits via AnimatePresence and clears
    fireEvent.click(screen.getByRole("button", { name: /select remove background model/i }));
    fireEvent.click(screen.getByRole("option", { name: /bria remove background 3\.0/i }));
    await waitFor(() => {
      expect(screen.queryByLabelText(/prompt/i)).toBeNull();
    });

    // Switch back to Guided -> prompt is empty
    fireEvent.click(screen.getByRole("button", { name: /select remove background model/i }));
    fireEvent.click(screen.getByRole("option", { name: /bria remove background guided/i }));
    expect(screen.getByLabelText(/prompt/i).value).toBe("");
  });

  it("dynamically renders future schema parameters (segmented enum, slider, input) and disables CTA when processing", () => {
    const futureModels = [
      {
        key: "future_rmbg_pro",
        displayName: "Future RMBG Pro",
        category: "remove_background",
        pricing: { currency: "credits", table: { default: 5 }, defaultCost: 5 },
        parameters: {
          input_image: { type: "string", required: true },
          edge_mode: { type: "string", values: ["soft", "crisp"], default: "soft" },
          feather_px: { type: "number", min: 0, max: 10, step: 1, default: 2 },
          tag_note: { type: "string", default: "" },
        },
      },
    ];

    const onGenerate = vi.fn();
    const { rerender } = render(
      <RemoveBackgroundPanel models={futureModels} onGenerate={onGenerate} />
    );

    // Enum segmented radio buttons (exact Prompt Bar pattern)
    fireEvent.click(screen.getByRole("radio", { name: "crisp" }));
    // String input
    fireEvent.change(screen.getByLabelText(/tag note/i), { target: { value: "hair-pass" } });

    fireEvent.click(screen.getByRole("button", { name: /remove background\s*5/i }));
    expect(onGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "future_rmbg_pro",
        parameters: {
          edge_mode: "crisp",
          feather_px: 2,
          tag_note: "hair-pass",
        },
      })
    );

    // Processing disables submit
    rerender(
      <RemoveBackgroundPanel
        models={futureModels}
        isPrimaryProcessing={true}
        onGenerate={onGenerate}
      />
    );
    expect(screen.getByRole("button", { name: /processing/i }).disabled).toBe(true);
  });
});
