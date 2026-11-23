import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { WorkflowTypeBadge } from "../WorkflowTypeBadge";
import { MediaView } from "../MediaView";

describe("WorkflowTypeBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders unified icon-only badges for video, element, and character with identical style", () => {
    const cases = [
      { props: { isVideo: true }, label: "Video", icon: "video-01", type: "video" },
      {
        props: { workflow: { workflow_type: "ELEMENT_SHEET" } },
        label: "Element",
        icon: "shapes",
        type: "element",
      },
      {
        props: { workflow: { workflow_type: "CHARACTER_SHEET" } },
        label: "Character",
        icon: "user",
        type: "character",
      },
    ];

    for (const c of cases) {
      cleanup();
      const { container } = render(<WorkflowTypeBadge {...c.props} />);
      const badge = screen.getByTitle(c.label);
      expect(badge.getAttribute("data-workflow-type")).toBe(c.type);
      expect(badge.className).toContain("size-6");
      expect(badge.className).toContain("rounded-control");
      expect(badge.className).toContain("bg-white");
      expect(badge.className).toContain("text-black");
      const icon = container.querySelector('[data-icon-provider="hugeicons"]');
      expect(icon?.getAttribute("data-icon-name")).toBe(c.icon);
      expect(icon?.className).toContain("text-black");
    }
  });

  it("renders nothing for regular image media", () => {
    const { container } = render(
      <WorkflowTypeBadge
        workflow={{ workflow_type: "IMAGE_GENERATION" }}
        item={{ kind: "image", url: "https://example.com/photo.png" }}
        isVideo={false}
      />
    );
    expect(container.firstChild).toBeNull();

    const { container: explicitImage } = render(<WorkflowTypeBadge type="image" />);
    expect(explicitImage.firstChild).toBeNull();
  });

  it("renders inside MediaView for video, element, and character — and omits for image", () => {
    const { rerender, container } = render(
      <MediaView
        src="https://example.com/el.png"
        status="completed"
        workflow={{ id: "wf-el", workflow_type: "ELEMENT_SHEET" }}
      />
    );
    expect(screen.getByTitle("Element")).toBeDefined();
    expect(container.querySelector('[data-icon-name="shapes"]')).not.toBeNull();

    rerender(
      <MediaView
        src="https://example.com/char.png"
        status="completed"
        workflow={{ id: "wf-char", workflow_type: "CHARACTER" }}
      />
    );
    expect(screen.getByTitle("Character")).toBeDefined();
    expect(container.querySelector('[data-icon-name="user"]')).not.toBeNull();

    rerender(
      <MediaView
        src="https://example.com/vid.mp4"
        status="completed"
        isVideo={true}
        workflow={{ id: "wf-vid", workflow_type: "VIDEO_GENERATION" }}
      />
    );
    expect(screen.getByTitle("Video")).toBeDefined();
    expect(container.querySelector('[data-icon-name="video-01"]')).not.toBeNull();

    rerender(
      <MediaView
        src="https://example.com/img.png"
        status="completed"
        isVideo={false}
        workflow={{ id: "wf-img", workflow_type: "IMAGE_GENERATION" }}
      />
    );
    expect(container.querySelector('[data-slot="workflow-type-badge"]')).toBeNull();
  });
});
