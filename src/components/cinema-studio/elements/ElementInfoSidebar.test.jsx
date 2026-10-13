import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ElementInfoSidebar } from "./ElementInfoSidebar";

describe("ElementInfoSidebar", () => {
  it("renders description textarea with a compact minHeight smaller than 190px", () => {
    render(
      <ElementInfoSidebar
        draftTitle="Test Element"
        setDraftTitle={vi.fn()}
        onSaveTitle={vi.fn()}
        draftDesc=""
        setDraftDesc={vi.fn()}
        onSaveDescription={vi.fn()}
      />
    );

    const descTextarea = screen.getByPlaceholderText(/Décrivez les spécificités/i);
    expect(descTextarea).toBeDefined();
    // Verify compact height is 90px (down from 190px)
    expect(descTextarea.style.minHeight).toBe("90px");
  });
});
