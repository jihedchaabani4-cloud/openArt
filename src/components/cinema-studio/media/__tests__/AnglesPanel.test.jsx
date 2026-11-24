import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnglesPanel } from "../AnglesPanel";
import {
  buildImageAnglesPayload,
  useImageAnglesEdit,
} from "@/features/workflows/api/mutations/useImageAnglesEdit";
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

describe("AnglesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders sphere, stepped sliders with initial 0 values, and disables Generate on no-op", () => {
    render(<AnglesPanel previewUrl="https://example.com/scene.png" />);

    expect(screen.getByText("Angles")).toBeTruthy();
    expect(document.querySelector('[data-slot="camera-direction-label"]').textContent).toBe("Front · Eye-Level");
    expect(screen.getByText("Rotation")).toBeTruthy();
    expect(screen.getByText("Tilt")).toBeTruthy();
    expect(screen.getByText("Zoom")).toBeTruthy();

    const generateBtn = screen.getByRole("button", { name: /Generate/i });
    expect(generateBtn.disabled).toBe(true);
    expect(generateBtn.textContent).toContain("12");
  });

  it("updates pose via sphere directional buttons, keyboard arrows, reset, and submits exact payload", () => {
    const onGenerate = vi.fn();
    render(<AnglesPanel previewUrl="https://example.com/scene.png" onGenerate={onGenerate} />);

    fireEvent.click(screen.getByRole("button", { name: "Rotate camera right" }));
    fireEvent.click(screen.getByRole("button", { name: "Tilt camera up" }));

    const sphere = screen.getByRole("application");
    fireEvent.keyDown(sphere, { key: "+" });
    fireEvent.keyDown(sphere, { key: "+" });

    const generateBtn = screen.getByRole("button", { name: /Generate/i });
    expect(generateBtn.disabled).toBe(false);

    fireEvent.click(generateBtn);
    expect(onGenerate).toHaveBeenCalledTimes(1);
    expect(onGenerate).toHaveBeenCalledWith({
      rotation: 15,
      tilt: 15,
      zoom: 2,
      parameters: { resolution: "1k" },
    });

    // Reset returns to (0, 0, 0) and disables Generate again
    fireEvent.click(screen.getByRole("button", { name: /Reset/i }));
    expect(screen.getByRole("button", { name: /Generate/i }).disabled).toBe(true);
  });

  it("supports double-click reset on individual stepped sliders and sphere", () => {
    const onGenerate = vi.fn();
    render(<AnglesPanel onGenerate={onGenerate} />);

    fireEvent.click(screen.getByRole("button", { name: "Rotate camera right" }));
    fireEvent.click(screen.getByRole("button", { name: "Tilt camera down" }));

    const rotationSlider = document.querySelector('[aria-label="Rotation"]');
    fireEvent.doubleClick(rotationSlider);

    fireEvent.click(screen.getByRole("button", { name: /Generate/i }));
    expect(onGenerate).toHaveBeenCalledWith({
      rotation: 0,
      tilt: -15,
      zoom: 0,
      parameters: { resolution: "1k" },
    });

    fireEvent.doubleClick(screen.getByRole("application"));
    expect(screen.getByRole("button", { name: /Generate/i }).disabled).toBe(true);
  });

  it("disables Generate during primary media processing or active submission and fires header actions", () => {
    const onClose = vi.fn();
    const onBack = vi.fn();

    const { rerender } = render(
      <AnglesPanel isPrimaryProcessing onBack={onBack} onClose={onClose} />
    );
    expect(screen.getByRole("button", { name: /Processing/i }).disabled).toBe(true);

    rerender(<AnglesPanel isSubmitting onBack={onBack} onClose={onClose} />);
    expect(screen.getByRole("button", { name: /Starting/i }).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Close Angles" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the subject preview fixed while orbiting the camera node across front and back hemispheres", () => {
    render(<AnglesPanel previewUrl="https://example.com/scene.png" />);

    const subject = document.querySelector('[data-slot="camera-subject-preview"]');
    const cameraNode = document.querySelector('[data-slot="camera-orbit-node"]');

    expect(subject.style.transform).toBe("");
    expect(cameraNode.dataset.hemisphere).toBe("front");
    expect(parseFloat(cameraNode.style.left)).toBe(50);
    expect(parseFloat(cameraNode.style.top)).toBe(50);
    expect(document.querySelector('[data-slot="camera-aim-line"]')).toBeNull();

    // Rotate 120° right (8 clicks x 15°) => camera moves behind subject (back hemisphere), aiming line/cone appear, subject stays fixed
    const rightBtn = screen.getByRole("button", { name: "Rotate camera right" });
    for (let i = 0; i < 8; i += 1) {
      fireEvent.click(rightBtn);
    }

    expect(subject.style.transform).toBe("");
    expect(cameraNode.dataset.hemisphere).toBe("back");
    expect(parseFloat(cameraNode.style.left)).not.toBe(50);
    expect(document.querySelector('[data-slot="camera-aim-line"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="camera-aim-cone"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="camera-aim-arrow"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="camera-direction-label"]').textContent).toContain("Back-Right");
  });

  it("applies 1-click angle templates, updates sphere/sliders, and submits preset pose", () => {
    const onGenerate = vi.fn();
    render(<AnglesPanel previewUrl="https://example.com/scene.png" onGenerate={onGenerate} />);

    const lowAngleBtn = screen.getByRole("button", { name: "Low Angle" });
    expect(lowAngleBtn.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(lowAngleBtn);
    expect(lowAngleBtn.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("-30°")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Generate/i }));
    expect(onGenerate).toHaveBeenCalledWith({
      rotation: 0,
      tilt: -30,
      zoom: 1,
      parameters: { resolution: "1k" },
    });

    // Switching to Back View flips camera to back hemisphere and updates active button
    const backViewBtn = screen.getByRole("button", { name: "Back View" });
    fireEvent.click(backViewBtn);
    expect(backViewBtn.getAttribute("aria-pressed")).toBe("true");
    expect(lowAngleBtn.getAttribute("aria-pressed")).toBe("false");
    expect(document.querySelector('[data-slot="camera-orbit-node"]').dataset.hemisphere).toBe("back");
  });
});

describe("useImageAnglesEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds strict allowlisted payload without forbidden fields and rejects no-op", () => {
    expect(() =>
      buildImageAnglesPayload({ workflowId: "wf-1", rotation: 0, tilt: 0, zoom: 0 })
    ).toThrow(/At least one camera angle adjustment/);

    const payload = buildImageAnglesPayload({
      workflowId: "wf-1",
      rotation: 45,
      tilt: -15,
      zoom: 3,
      parameters: { resolution: "1k" },
    });

    expect(payload).toEqual({
      workflow_id: "wf-1",
      rotation: 45,
      tilt: -15,
      zoom: 3,
      parameters: { resolution: "1k" },
    });
    expect(payload).not.toHaveProperty("model");
    expect(payload).not.toHaveProperty("media_id");
    expect(payload).not.toHaveProperty("image_url");
  });

  it("calls POST /images/angles and immediately patches Project Cache with new processing primary media", async () => {
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
      mediaId: "media-new-angle",
      sourceMediaId: "media-old",
      project_id: "proj-1",
    });

    const { result } = renderHook(() => useImageAnglesEdit(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        workflowId: "wf-1",
        projectId: "proj-1",
        rotation: 30,
        tilt: -10,
        zoom: 2,
        parameters: { resolution: "1k" },
      });
    });

    expect(api.post).toHaveBeenCalledWith(
      "/images/angles",
      {
        workflow_id: "wf-1",
        rotation: 30,
        tilt: -10,
        zoom: 2,
        parameters: { resolution: "1k" },
      },
      { timeout: 20000 }
    );

    const updated = queryClient.getQueryData(pKey);
    const wf = updated.projectContents.workflows[0];
    expect(wf.primary_media_id).toBe("media-new-angle");
    expect(wf.items[0].id).toBe("media-new-angle");
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

    const { result } = renderHook(() => useImageAnglesEdit(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync({
        workflowId: "wf-1",
        projectId: "proj-1",
        rotation: 45,
        tilt: 0,
        zoom: 0,
      });
    });

    expect(response.needsCredits).toBe(true);
    const unchanged = queryClient.getQueryData(pKey);
    expect(unchanged.projectContents.workflows[0].primary_media_id).toBe("media-old");
  });
});
