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

  it("renders unified styling with global CSS tokens, rounded-12px, blur variant, and balanced col-span-4", () => {
    const { container } = render(
      <ElementInfoSidebar
        draftTitle="Cyberpunk City"
        setDraftTitle={vi.fn()}
        onSaveTitle={vi.fn()}
        draftDesc="Futuristic neon metropolis"
        setDraftDesc={vi.fn()}
        onSaveDescription={vi.fn()}
        elementType="style"
        onSaveElementType={vi.fn()}
        draftGuidelines="Keep lighting dark"
        setDraftGuidelines={vi.fn()}
        onSaveGuidelines={vi.fn()}
      />
    );

    // 1. Sidebar column container matches CharacterInfoSidebar
    const sidebar = container.firstChild;
    expect(sidebar.className).toContain("lg:col-span-4");
    expect(sidebar.className).toContain("xl:col-span-4");
    expect(sidebar.className).toContain("gap-5");

    // 2. Select trigger for Element Type uses blur variant and rounded-12px
    const selectTrigger = screen.getByRole("combobox");
    expect(selectTrigger).toBeDefined();
    expect(selectTrigger.getAttribute("data-variant")).toBe("blur");
    expect(selectTrigger.className).toContain("rounded-[var(--mat-sys-corner-medium,12px)]");
    expect(selectTrigger.textContent).toContain("Style");

    // 3. Textareas use blur variant and rounded-12px
    const descTextarea = screen.getByPlaceholderText(/Décrivez les spécificités/i);
    const descWrapper = descTextarea.parentElement;
    expect(descWrapper.className).toContain("rounded-[var(--mat-sys-corner-medium,12px)]");
    expect(descWrapper.className).toContain("border-none");
    expect(descWrapper.style.backgroundColor).toContain("var(--foreground-state-10");

    const guidelinesTextarea = screen.getByPlaceholderText(/Règles à respecter/i);
    const guidelinesWrapper = guidelinesTextarea.parentElement;
    expect(guidelinesWrapper.className).toContain("rounded-[var(--mat-sys-corner-medium,12px)]");
    expect(guidelinesWrapper.className).toContain("border-none");
    expect(guidelinesWrapper.style.backgroundColor).toContain("var(--foreground-state-10");
  });
});
