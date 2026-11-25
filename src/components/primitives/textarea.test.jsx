import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Textarea } from "./textarea";

describe("Textarea component", () => {
  it("renders personality variant with personality-section and personality-textarea", () => {
    const { container } = render(
      <Textarea
        variant="personality"
        label="Character info"
        labelExtra="(optional)"
        placeholder="Describe how your character acts..."
        hint="The Flow agent can use this information to help craft scenes with your character."
      />
    );

    // Verify outer container uses personality-section
    const section = container.firstChild;
    expect(section.className).toContain("personality-section");

    // Verify label-row and field-label
    const labelRow = section.querySelector(".label-row");
    expect(labelRow).not.toBeNull();
    const fieldLabel = section.querySelector(".field-label");
    expect(fieldLabel).not.toBeNull();
    expect(fieldLabel.textContent).toContain("Character info");
    expect(fieldLabel.textContent).toContain("(optional)");

    // Verify personality-textarea-wrapper and textarea element
    const wrapper = section.querySelector(".personality-textarea-wrapper");
    expect(wrapper).not.toBeNull();
    const textarea = screen.getByPlaceholderText("Describe how your character acts...");
    expect(textarea).toBeDefined();
    expect(textarea.className).toContain("personality-textarea");

    // Verify disclaimer overflow and text
    const disclaimer = section.querySelector(".disclaimer-overflow");
    expect(disclaimer).not.toBeNull();
    const disclaimerText = section.querySelector(".disclaimer-text");
    expect(disclaimerText.textContent).toContain("The Flow agent can use this information");
  });

  it("renders standalone personality variant without container when no label or hint is provided", () => {
    const { container } = render(
      <Textarea
        variant="personality"
        placeholder="Custom notes..."
      />
    );

    const wrapper = container.firstChild;
    expect(wrapper.className).toContain("personality-textarea-wrapper");
    const textarea = screen.getByPlaceholderText("Custom notes...");
    expect(textarea.className).toContain("personality-textarea");
  });

  it("renders outline variant using canonical Label primitive and muted labelExtra", () => {
    render(
      <Textarea
        id="prompt-field"
        variant="outline"
        label="Prompt"
        labelExtra="12/200"
        placeholder="Describe background..."
      />
    );

    const textarea = screen.getByLabelText("Prompt");
    expect(textarea.getAttribute("id")).toBe("prompt-field");
    expect(textarea.className).toContain("ds-type-small");

    const labelEl = screen.getByText("Prompt");
    expect(labelEl.tagName).toBe("LABEL");
    expect(labelEl.getAttribute("for")).toBe("prompt-field");
    expect(labelEl.getAttribute("data-slot")).toBe("label");
    expect(labelEl.className).toContain("ds-label");

    const extraEl = screen.getByText("12/200");
    expect(extraEl.tagName).toBe("SPAN");
    expect(extraEl.getAttribute("data-slot")).toBe("label");
    expect(extraEl.className).toContain("ds-label");
    expect(extraEl.className).toContain("tabular-nums");
  });
});
