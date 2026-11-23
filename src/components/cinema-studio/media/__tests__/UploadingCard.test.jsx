import { describe, it, expect, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { UploadingCard } from "../UploadingCard";
import { MediaView } from "../MediaView";
import { MediaRenderer } from "../MediaRenderer";
import {
  setUploadProgress,
  clearUploadProgress,
} from "@/features/media/model/uploadProgressStore";

describe("UploadingCard & Shared Gallery Uploading View", () => {
  afterEach(() => {
    cleanup();
    clearUploadProgress("upload-live-1");
    clearUploadProgress("upload-live-2");
  });

  it("renders media preview under frosted blur + moving wave with 25% bottom progress line, spinner, and percentage", () => {
    const { container } = render(
      <UploadingCard
        src="blob:http://localhost:3000/preview-image"
        progress={42}
        alt="Desert shot"
      />
    );

    const preview = container.querySelector('[data-slot="uploading-media-preview"]');
    expect(preview).not.toBeNull();
    expect(preview.tagName).toBe("IMG");
    expect(preview.getAttribute("src")).toBe("blob:http://localhost:3000/preview-image");

    const blurLayer = container.querySelector('[data-slot="uploading-blur-layer"]');
    expect(blurLayer?.className).toContain("backdrop-blur-md");

    const waveLayer = container.querySelector('[data-slot="uploading-wave-layer"]');
    expect(waveLayer?.querySelector(".ds-upload-wave-primary")).not.toBeNull();
    expect(waveLayer?.querySelector(".ds-upload-wave-secondary")).not.toBeNull();

    const progressRow = container.querySelector('[data-slot="uploading-progress-row"]');
    expect(progressRow?.className).toContain("bottom-[25%]");

    const progressbar = screen.getByRole("progressbar", { name: "Upload progress" });
    expect(progressbar.getAttribute("aria-valuenow")).toBe("42");

    const fill = container.querySelector('[data-slot="uploading-progress-fill"]');
    expect(fill?.style.width).toBe("42%");

    const spinner = container.querySelector('[data-icon-name="loading-03"]');
    expect(spinner).not.toBeNull();
    expect(spinner.className).toContain("animate-spin");

    expect(screen.getByText("42%")).toBeDefined();
  });

  it("renders video preview underneath when uploading a video", () => {
    const { container } = render(
      <UploadingCard
        src="blob:http://localhost:3000/preview-video"
        isVideo
        progress={18}
      />
    );

    const preview = container.querySelector('[data-slot="uploading-media-preview"]');
    expect(preview).not.toBeNull();
    expect(preview.tagName).toBe("VIDEO");
    expect(preview.getAttribute("src")).toBe("blob:http://localhost:3000/preview-video");
    expect(screen.getByText("18%")).toBeDefined();
  });

  it("subscribes to live uploadProgressStore updates and overrides initial 0 progress", () => {
    setUploadProgress("upload-live-1", 12);
    const { container } = render(
      <UploadingCard
        src="blob:http://localhost:3000/live-img"
        uploadId="upload-live-1"
        progress={0}
      />
    );

    expect(screen.getByText("12%")).toBeDefined();
    expect(container.querySelector('[data-slot="uploading-progress-fill"]')?.style.width).toBe("12%");

    act(() => {
      setUploadProgress("upload-live-1", 73, "uploading");
    });

    expect(screen.getByText("73%")).toBeDefined();
    expect(container.querySelector('[data-slot="uploading-progress-fill"]')?.style.width).toBe("73%");

    // Once frontend finishes sending bytes, transitions cleanly into processing-upload state
    act(() => {
      setUploadProgress("upload-live-1", 100, "processing");
    });

    expect(container.querySelector('[data-upload-phase="processing"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="uploading-progress-indeterminate"]')).not.toBeNull();
    expect(screen.getByText("Processing")).toBeDefined();

    // Backend returns 200 -> done
    act(() => {
      setUploadProgress("upload-live-1", 100, "done");
    });

    expect(screen.getByText("100%")).toBeDefined();
    expect(container.querySelector(".ds-upload-bar-sheen")).toBeNull();
  });

  it("MediaView renders UploadingCard for explicit uploading status and normalized raw uploading status", () => {
    setUploadProgress("upload-live-2", 55);
    const { container, rerender } = render(
      <MediaView
        src="blob:http://localhost:3000/a"
        status="uploading"
        item={{ id: "i-1", uploadId: "upload-live-2", status: "uploading" }}
      />
    );

    expect(container.querySelector('[data-slot="uploading-card"]')).not.toBeNull();
    expect(screen.getByText("55%")).toBeDefined();

    // Even if upstream normalizer mapped status -> "processing", raw.status === "uploading" still routes to UploadingCard
    rerender(
      <MediaView
        src="blob:http://localhost:3000/a"
        status="processing"
        item={{
          id: "i-1",
          status: "processing",
          raw: { status: "uploading", uploadId: "upload-live-2" },
        }}
      />
    );

    expect(container.querySelector('[data-slot="uploading-card"]')).not.toBeNull();
    expect(screen.getByText("55%")).toBeDefined();

    // Standard generation processing still renders ProcessingCard (not UploadingCard)
    rerender(
      <MediaView
        src={null}
        status="processing"
        progress={30}
        item={{ id: "i-2", status: "processing" }}
      />
    );

    expect(container.querySelector('[data-slot="uploading-card"]')).toBeNull();
    expect(container.querySelector('[data-slot="processing-card"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="processing-spinner"]')).not.toBeNull();
  });

  it("MediaRenderer renders UploadingCard for uploading items in default SharedGalleryGrid", () => {
    const { container } = render(
      <MediaRenderer
        item={{
          id: "m-up-1",
          url: "blob:http://localhost:3000/grid-upload",
          kind: "image",
          status: "processing",
          raw: { status: "uploading", progress: 64 },
        }}
      />
    );

    expect(container.querySelector('[data-slot="uploading-card"]')).not.toBeNull();
    expect(screen.getByText("64%")).toBeDefined();
  });
});
