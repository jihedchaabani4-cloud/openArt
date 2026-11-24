import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RelightPanel } from "../RelightPanel";
import {
  buildImageRelightPayload,
  normalizeRelightHexColor,
  useImageRelightEdit,
} from "@/features/workflows/api/mutations/useImageRelightEdit";
import { queryKeys } from "@/shared/api/queryKeys";
import { api } from "@/shared/api/client";

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

vi.mock("@/shared/api/client", () => ({
  api: {
    post: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("RelightPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders light sphere, soft/hard toggle, color hex readout, stepped sliders, and Relight 12 CTA", () => {
    render(<RelightPanel previewUrl="https://example.com/scene.png" />);

    expect(document.querySelector('[data-slot="relight-direction-label"]').textContent).toBe("Front · Eye-Level · Softbox");
    expect(screen.getByRole("button", { name: /Soft Light/i }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /Hard Light/i }).getAttribute("aria-pressed")).toBe("false");
    expect(document.querySelector('[data-slot="relight-color-hex"]').textContent).toBe("#FFFFFF");
    expect(screen.getByText("Brightness")).toBeTruthy();
    expect(screen.getByText("Size")).toBeTruthy();
    expect(screen.getByText("Rotation")).toBeTruthy();
    expect(screen.getByText("Tilt")).toBeTruthy();
    expect(screen.getByText("Distance")).toBeTruthy();

    const submitBtn = screen.getByRole("button", { name: /^Relight\s*12$/i });
    expect(submitBtn.disabled).toBe(false);
    expect(submitBtn.textContent).toContain("12");
  });

  it("keeps subject fixed while orbiting light node with colored aiming cone/line across front and back", () => {
    render(<RelightPanel previewUrl="https://example.com/scene.png" />);

    const subject = document.querySelector('[data-slot="relight-subject-preview"]');
    const lightNode = document.querySelector('[data-slot="relight-orbit-node"]');

    expect(subject.style.transform).toBe("");
    expect(lightNode.dataset.hemisphere).toBe("front");
    expect(document.querySelector('[data-slot="relight-aim-line"]')).not.toBeNull();

    const rightBtn = screen.getByRole("button", { name: "Move light right" });

    // Front hemisphere (+15°): fixture stays IN FRONT (z-20) of fixed subject (z-10)
    fireEvent.click(rightBtn);
    const frontFixtureSvg = document.querySelector('[data-slot="relight-orbit-node"]').closest("svg");
    expect(document.querySelector('[data-slot="relight-orbit-node"]').dataset.hemisphere).toBe("front");
    expect(frontFixtureSvg.getAttribute("class")).toContain("z-20");

    // Rotate to 120° right => back hemisphere: fixture moves behind subject (z-[5])
    for (let i = 0; i < 7; i += 1) {
      fireEvent.click(rightBtn);
    }

    const backNode = document.querySelector('[data-slot="relight-orbit-node"]');
    expect(subject.style.transform).toBe("");
    expect(backNode.dataset.hemisphere).toBe("back");
    expect(backNode.closest("svg").getAttribute("class")).toContain("z-[5]");
    expect(document.querySelector('[data-slot="relight-aim-line"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="relight-aim-cone"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="relight-aim-arrow"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="relight-direction-label"]').textContent).toContain("Back-Right Rim");

    // Soft vs Hard light distinctly updates beam & fixture type
    expect(document.querySelector('[data-slot="relight-aim-cone"]').dataset.lightType).toBe("soft");
    fireEvent.click(screen.getByRole("button", { name: /Hard Light/i }));
    expect(document.querySelector('[data-slot="relight-aim-cone"]').dataset.lightType).toBe("hard");
    expect(document.querySelector('[data-slot="relight-direction-label"]').textContent).toContain("Hard Spot");
  });

  it("updates light type, color swatch, and position via sphere, supports Reset, and submits exact payload", () => {
    const onGenerate = vi.fn();
    render(<RelightPanel previewUrl="https://example.com/scene.png" onGenerate={onGenerate} />);

    expect(document.querySelector('[data-slot="relight-presets"]')).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Hard Light/i }));
    fireEvent.click(screen.getByRole("button", { name: /Tungsten \(#FFD4A3\)/i }));
    fireEvent.click(screen.getByRole("button", { name: "Move light right" }));
    fireEvent.click(screen.getByRole("button", { name: "Move light up" }));

    expect(document.querySelector('[data-slot="relight-color-hex"]').textContent).toBe("#FFD4A3");

    fireEvent.click(screen.getByRole("button", { name: /^Relight\s*12$/i }));

    expect(onGenerate).toHaveBeenCalledTimes(1);
    expect(onGenerate).toHaveBeenCalledWith({
      light_type: "hard",
      brightness: 50,
      color: "#FFD4A3",
      size: 50,
      rotation: 15,
      tilt: 15,
      distance: 50,
      parameters: { resolution: "1k" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Reset/i }));
    expect(document.querySelector('[data-slot="relight-color-hex"]').textContent).toBe("#FFFFFF");
    expect(screen.getByRole("button", { name: /Soft Light/i }).getAttribute("aria-pressed")).toBe("true");
  });

  it("normalizes custom color input to uppercase 6-digit hex and respects busy/close states", () => {
    const onClose = vi.fn();
    const onBack = vi.fn();
    const { rerender } = render(
      <RelightPanel onBack={onBack} onClose={onClose} />
    );

    const colorInput = screen.getByLabelText("Custom light hex color");
    fireEvent.change(colorInput, { target: { value: "#38e8ff" } });
    expect(document.querySelector('[data-slot="relight-color-hex"]').textContent).toBe("#38E8FF");

    rerender(<RelightPanel isPrimaryProcessing onBack={onBack} onClose={onClose} />);
    expect(screen.getByRole("button", { name: /Processing/i }).disabled).toBe(true);

    rerender(<RelightPanel isSubmitting onBack={onBack} onClose={onClose} />);
    expect(screen.getByRole("button", { name: /Starting/i }).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Close Relight" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("useImageRelightEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes hex colors strictly to 6-digit #RRGGBB and excludes forbidden payload fields", () => {
    expect(normalizeRelightHexColor("#fff")).toBe("#FFFFFF");
    expect(normalizeRelightHexColor("#ffd4a3")).toBe("#FFD4A3");
    expect(normalizeRelightHexColor("white")).toBe("#FFFFFF");

    const payload = buildImageRelightPayload({
      workflowId: "wf-1",
      light_type: "HARD",
      brightness: 80,
      color: "#abc",
      size: 40,
      rotation: 45,
      tilt: 20,
      distance: 60,
      parameters: { resolution: "1k" },
    });

    expect(payload).toEqual({
      workflow_id: "wf-1",
      light_type: "hard",
      brightness: 80,
      color: "#AABBCC",
      size: 40,
      rotation: 45,
      tilt: 20,
      distance: 60,
      parameters: { resolution: "1k" },
    });
    expect(payload).not.toHaveProperty("model");
    expect(payload).not.toHaveProperty("media_id");
    expect(payload).not.toHaveProperty("image_url");
  });

  it("calls POST /images/relight and immediately patches Project Cache with processing primary media", async () => {
    const { queryClient, wrapper } = createWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");

    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [
          {
            id: "wf-1",
            primary_media_id: "media-old",
            metadata: { primaryMediaId: "media-old" },
            items: [
              { id: "media-old", url: "https://example.com/orig.png", status: "success", is_primary: true, width: 1024, height: 1024 },
            ],
          },
        ],
        media: [
          { id: "media-old", workflowId: "wf-1", url: "https://example.com/orig.png", status: "success", is_primary: true, width: 1024, height: 1024 },
        ],
      },
    });

    api.post.mockResolvedValueOnce({
      ok: true,
      status: "processing",
      needsCredits: false,
      cost: 13,
      workflowId: "wf-1",
      mediaId: "media-relight-1",
      sourceMediaId: "media-old",
      project_id: "proj-1",
    });

    const { result } = renderHook(() => useImageRelightEdit(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        workflowId: "wf-1",
        projectId: "proj-1",
        light_type: "soft",
        brightness: 75,
        color: "#FFD4A3",
        size: 60,
        rotation: 45,
        tilt: 30,
        distance: 50,
        parameters: { resolution: "1k" },
      });
    });

    expect(api.post).toHaveBeenCalledWith(
      "/images/relight",
      expect.objectContaining({
        workflow_id: "wf-1",
        light_type: "soft",
        brightness: 75,
        color: "#FFD4A3",
        size: 60,
        rotation: 45,
        tilt: 30,
        distance: 50,
      }),
      { timeout: 20000 }
    );

    const updated = queryClient.getQueryData(pKey);
    const wf = updated.projectContents.workflows[0];
    expect(wf.primary_media_id).toBe("media-relight-1");
    expect(wf.items[0].id).toBe("media-relight-1");
    expect(wf.items[0].step_id).toBe("image_relight");
    expect(wf.items[0].status).toBe("processing");
    expect(wf.items[0].is_primary).toBe(true);
    expect(wf.items[1].id).toBe("media-old");
    expect(wf.items[1].is_primary).toBe(false);
  });

  it("passes needsCredits response through without injecting a processing placeholder", async () => {
    const { queryClient, wrapper } = createWrapper();
    const pKey = queryKeys.projectData.byProject("proj-1");

    queryClient.setQueryData(pKey, {
      projectContents: {
        workflows: [{ id: "wf-1", primary_media_id: "media-old", items: [{ id: "media-old", is_primary: true }] }],
        media: [{ id: "media-old", workflowId: "wf-1", is_primary: true }],
      },
    });

    api.post.mockResolvedValueOnce({
      ok: true,
      status: "saved",
      needsCredits: true,
      message: "Insufficient credits",
      workflowId: "wf-1",
      mediaId: "media-saved",
    });

    const { result } = renderHook(() => useImageRelightEdit(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        workflowId: "wf-1",
        projectId: "proj-1",
      });
    });

    expect(response.needsCredits).toBe(true);
    const unchanged = queryClient.getQueryData(pKey);
    expect(unchanged.projectContents.workflows[0].primary_media_id).toBe("media-old");
  });
});
