import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { EditStageCanvas, MIN_ZOOM, MAX_ZOOM } from "../EditStageCanvas";

vi.mock("@/components/cinema-studio/media/EditMediaView", () => ({
  EditMediaView: ({ workflow, item }) => (
    <div
      data-testid="mock-edit-media-view"
      data-workflow-id={workflow?.id || ""}
      data-item-id={item?.id || ""}
    />
  ),
}));

const IMAGE_WORKFLOW = {
  id: "wf-image-1",
  items: [{ id: "media-1", url: "https://cdn.example.com/frame.png" }],
};

const ACTIVE_ITEM = IMAGE_WORKFLOW.items[0];

describe("EditStageCanvas", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders EditMediaView and floating zoom controls for image workflows", () => {
    const { container } = render(
      <EditStageCanvas
        workflow={IMAGE_WORKFLOW}
        activeItem={ACTIVE_ITEM}
        workflowId="wf-image-1"
      />
    );

    const mediaView = screen.getByTestId("mock-edit-media-view");
    expect(mediaView.getAttribute("data-workflow-id")).toBe("wf-image-1");
    expect(mediaView.getAttribute("data-item-id")).toBe("media-1");

    const zoomGroup = screen.getByRole("group", { name: "Preview zoom controls" });
    expect(zoomGroup).toBeTruthy();

    const resetBtn = screen.getByRole("button", { name: "Reset zoom" });
    expect(resetBtn.getAttribute("title")).toBe("100%");

    const wrapper = container.querySelector('[data-slot="edit-stage-zoom-wrapper"]');
    expect(wrapper.style.transform).toBe("");
  });

  it("zooms in, zooms out, and resets zoom cleanly", () => {
    const { container } = render(
      <EditStageCanvas
        workflow={IMAGE_WORKFLOW}
        activeItem={ACTIVE_ITEM}
        workflowId="wf-image-1"
      />
    );

    const zoomInBtn = screen.getByRole("button", { name: "Zoom in" });
    const zoomOutBtn = screen.getByRole("button", { name: "Zoom out" });
    const resetBtn = screen.getByRole("button", { name: "Reset zoom" });
    const wrapper = container.querySelector('[data-slot="edit-stage-zoom-wrapper"]');

    fireEvent.click(zoomInBtn);
    expect(resetBtn.getAttribute("title")).toBe("125%");
    expect(wrapper.style.transform).toBe("scale(1.25)");

    fireEvent.click(zoomOutBtn);
    fireEvent.click(zoomOutBtn);
    expect(resetBtn.getAttribute("title")).toBe("75%");
    expect(wrapper.style.transform).toBe("scale(0.75)");

    fireEvent.click(resetBtn);
    expect(resetBtn.getAttribute("title")).toBe("100%");
    expect(wrapper.style.transform).toBe("");
  });

  it("clamps zoom level at MIN_ZOOM (0.5) and MAX_ZOOM (4) and disables boundary buttons", () => {
    const { container } = render(
      <EditStageCanvas
        workflow={IMAGE_WORKFLOW}
        activeItem={ACTIVE_ITEM}
        workflowId="wf-image-1"
      />
    );

    const zoomInBtn = screen.getByRole("button", { name: "Zoom in" });
    const zoomOutBtn = screen.getByRole("button", { name: "Zoom out" });
    const resetBtn = screen.getByRole("button", { name: "Reset zoom" });
    const wrapper = container.querySelector('[data-slot="edit-stage-zoom-wrapper"]');

    // Step down to MIN_ZOOM (1 -> 0.75 -> 0.5)
    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(zoomOutBtn);
    }
    expect(MIN_ZOOM).toBe(0.5);
    expect(resetBtn.getAttribute("title")).toBe("50%");
    expect(wrapper.style.transform).toBe("scale(0.5)");
    expect(zoomOutBtn.disabled).toBe(true);
    expect(zoomInBtn.disabled).toBe(false);

    // Step up to MAX_ZOOM (0.5 -> 4.0 takes 14 steps of 0.25)
    for (let i = 0; i < 20; i += 1) {
      fireEvent.click(zoomInBtn);
    }
    expect(MAX_ZOOM).toBe(4);
    expect(resetBtn.getAttribute("title")).toBe("400%");
    expect(wrapper.style.transform).toBe("scale(4)");
    expect(zoomInBtn.disabled).toBe(true);
    expect(zoomOutBtn.disabled).toBe(false);
  });

  it("hides zoom controls and skips transform when isVideoWorkflow is true", () => {
    const { container } = render(
      <EditStageCanvas
        workflow={IMAGE_WORKFLOW}
        activeItem={ACTIVE_ITEM}
        workflowId="wf-video-1"
        isVideoWorkflow={true}
      />
    );

    expect(screen.queryByRole("group", { name: "Preview zoom controls" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Zoom in" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Zoom out" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reset zoom" })).toBeNull();

    const wrapper = container.querySelector('[data-slot="edit-stage-zoom-wrapper"]');
    expect(wrapper.style.transform).toBe("");
  });

  it("resets zoom level to 1 whenever workflowId changes", () => {
    const { container, rerender } = render(
      <EditStageCanvas
        workflow={IMAGE_WORKFLOW}
        activeItem={ACTIVE_ITEM}
        workflowId="wf-image-1"
      />
    );

    const zoomInBtn = screen.getByRole("button", { name: "Zoom in" });
    const resetBtn = screen.getByRole("button", { name: "Reset zoom" });
    const wrapper = container.querySelector('[data-slot="edit-stage-zoom-wrapper"]');

    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomInBtn);
    expect(resetBtn.getAttribute("title")).toBe("150%");
    expect(wrapper.style.transform).toBe("scale(1.5)");

    rerender(
      <EditStageCanvas
        workflow={{ ...IMAGE_WORKFLOW, id: "wf-image-2" }}
        activeItem={ACTIVE_ITEM}
        workflowId="wf-image-2"
      />
    );

    expect(resetBtn.getAttribute("title")).toBe("100%");
    expect(wrapper.style.transform).toBe("");
  });
});
