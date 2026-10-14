import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import { ElementInfoSidebar } from "./ElementInfoSidebar";

describe("ElementInfoSidebar", () => {
  afterEach(() => {
    cleanup();
  });

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

  it("renders hover info buttons for input descriptions instead of static hint paragraphs", () => {
    render(
      <ElementInfoSidebar
        draftTitle="Test Element"
        setDraftTitle={vi.fn()}
        onSaveTitle={vi.fn()}
        draftDesc=""
        setDraftDesc={vi.fn()}
        onSaveDescription={vi.fn()}
        draftGuidelines=""
        setDraftGuidelines={vi.fn()}
        onSaveGuidelines={vi.fn()}
      />
    );

    // Verify hover buttons are present for inputs
    const typeHoverBtn = screen.getByTestId("type-info-hover");
    expect(typeHoverBtn).toBeDefined();

    const descHoverBtn = screen.getByTestId("desc-info-hover");
    expect(descHoverBtn).toBeDefined();

    const guidelinesHoverBtn = screen.getByTestId("guidelines-info-hover");
    expect(guidelinesHoverBtn).toBeDefined();

    // Verify static hints below textareas are not rendered
    expect(
      screen.queryByText("Le modèle utilisera cette description pour intégrer fidèlement l'élément dans vos prompts.")
    ).toBeNull();
  });

  it("renders textareas using the personality variant and flow classes", () => {
    render(
      <ElementInfoSidebar
        draftTitle="Test Element"
        setDraftTitle={vi.fn()}
        onSaveTitle={vi.fn()}
        draftDesc="Test description"
        setDraftDesc={vi.fn()}
        onSaveDescription={vi.fn()}
        draftGuidelines="Test guidelines"
        setDraftGuidelines={vi.fn()}
        onSaveGuidelines={vi.fn()}
      />
    );

    const descTextarea = screen.getByPlaceholderText(/Décrivez les spécificités/i);
    expect(descTextarea.className).toContain("personality-textarea");
    expect(descTextarea.parentElement.className).toContain("personality-textarea-wrapper");

    const guidelinesTextarea = screen.getByPlaceholderText(/Règles à respecter/i);
    expect(guidelinesTextarea.className).toContain("personality-textarea");
    expect(guidelinesTextarea.parentElement.className).toContain("personality-textarea-wrapper");
  });
});
