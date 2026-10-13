import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ElementDetailsGallery } from "./ElementDetailsGallery";

describe("ElementDetailsGallery - Studio Media Grid Form", () => {
  const mockItems = [
    {
      id: "item-1",
      name: "item-1",
      url: "https://example.com/ref1.png",
      status: "completed",
    },
    {
      id: "item-2",
      name: "item-2",
      url: "https://example.com/ref2.png",
      status: "completed",
    },
  ];

  it("renders cards conforming to studio form without border-white/10", () => {
    const { container } = render(
      <ElementDetailsGallery
        items={mockItems}
        primaryMediaId="item-1"
      />
    );

    const cards = container.querySelectorAll(".group\\/card, .group");
    expect(cards.length).toBeGreaterThan(0);
    // All media item cards should not have the old border border-white/10
    cards.forEach((card) => {
      expect(card.className).not.toContain("border-white/10");
    });
  });

  it("renders studio action button group with bg-white/60 backdrop-blur-md on media cards", () => {
    const { container } = render(
      <ElementDetailsGallery
        items={mockItems}
        primaryMediaId="item-1"
        onSetCover={vi.fn()}
        onDeleteImage={vi.fn()}
      />
    );

    const buttonGroup = container.querySelector(".bg-white\\/60");
    expect(buttonGroup).not.toBeNull();
    expect(buttonGroup.className).toContain("backdrop-blur-md");
    expect(buttonGroup.className).toContain("rounded-lg");
  });

  it("renders couverture badge for the primary media", () => {
    render(
      <ElementDetailsGallery
        items={mockItems}
        primaryMediaId="item-1"
      />
    );

    const badges = screen.getAllByText("Couverture");
    expect(badges.length).toBeGreaterThan(0);
  });
});
