import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MediaView } from "../MediaView";
import { MediaViewCard } from "../MediaViewCard";

describe("DIAGNOSIS: Black cards caused by unnormalized 'success' status in MediaView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("REPRO 1: MediaView with status='success' MUST render an <img> element (not empty media layer)", () => {
    const item = {
      id: "elem-media-1",
      url: "https://example.com/element-thumbnail.png",
      status: "success",
      type: "element",
    };

    render(<MediaView item={item} status="success" />);

    const img = document.querySelector("img");
    expect(img, "Expected <img> to be rendered when status is 'success'").not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/element-thumbnail.png");
  });

  it("REPRO 2: MediaViewCard with status='success' MUST render an <img> element", () => {
    const item = {
      id: "elem-media-2",
      url: "https://example.com/element-card.png",
      status: "success",
      is_element: true,
    };

    render(<MediaViewCard item={item} />);

    const img = document.querySelector("img");
    expect(img, "Expected MediaViewCard with status='success' to render <img>").not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/element-card.png");
  });

  it("REPRO 3: MediaView with case-insensitive status ('SUCCESS') MUST render <img>", () => {
    const itemUpper = {
      id: "elem-media-3",
      url: "https://example.com/upper.png",
      status: "SUCCESS",
    };

    render(<MediaView item={itemUpper} status="SUCCESS" />);

    const img = document.querySelector("img");
    expect(img, "Expected <img> for status='SUCCESS'").not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/upper.png");
  });

  it("REPRO 4: MediaView with direct src prop and status='success' MUST render <img>", () => {
    render(
      <MediaView
        src="https://example.com/direct-src.png"
        status="success"
        isVideo={false}
      />
    );

    const img = document.querySelector("img");
    expect(img, "Expected <img> for direct src with status='success'").not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/direct-src.png");
  });
});
