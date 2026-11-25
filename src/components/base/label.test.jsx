import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LabelDefault, { Label } from "./label";

describe("Label base primitive", () => {
  it("renders a <label> with htmlFor and default muted .ds-label attributes", () => {
    render(
      <div>
        <Label htmlFor="zoom-input">Zoom</Label>
        <input id="zoom-input" />
      </div>
    );

    const el = screen.getByText("Zoom");
    expect(el.tagName).toBe("LABEL");
    expect(el.getAttribute("for")).toBe("zoom-input");
    expect(el.getAttribute("data-slot")).toBe("label");
    expect(el.getAttribute("data-variant")).toBe("default");
    expect(el.hasAttribute("data-disabled")).toBe(false);
    expect(el.className).toContain("ds-label");
    expect(el.className).not.toContain("ds-label-caption");
    expect(el.className).not.toContain("ds-label-primary");
    expect(LabelDefault).toBe(Label);
  });

  it("renders as a <span> when as='span' is passed", () => {
    render(<Label as="span">Wide angle lens</Label>);

    const el = screen.getByText("Wide angle lens");
    expect(el.tagName).toBe("SPAN");
    expect(el.getAttribute("data-slot")).toBe("label");
    expect(el.className).toContain("ds-label");
  });

  it("applies caption variant class and data-variant='caption'", () => {
    render(<Label variant="caption">Templates</Label>);

    const el = screen.getByText("Templates");
    expect(el.getAttribute("data-variant")).toBe("caption");
    expect(el.className).toContain("ds-label");
    expect(el.className).toContain("ds-label-caption");
    expect(el.className).not.toContain("ds-label-primary");
  });

  it("applies primary variant class and data-variant='primary'", () => {
    render(<Label variant="primary">Prompt</Label>);

    const el = screen.getByText("Prompt");
    expect(el.getAttribute("data-variant")).toBe("primary");
    expect(el.className).toContain("ds-label");
    expect(el.className).toContain("ds-label-primary");
    expect(el.className).not.toContain("ds-label-caption");
  });

  it("sets data-disabled='true' when disabled and forwards ref and layout className", () => {
    const ref = React.createRef();
    render(
      <Label ref={ref} disabled className="px-1">
        Rotation
      </Label>
    );

    const el = screen.getByText("Rotation");
    expect(el.getAttribute("data-disabled")).toBe("true");
    expect(el.className).toContain("ds-label");
    expect(el.className).toContain("px-1");
    expect(ref.current).toBe(el);
  });
});
