import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { ShineText } from "./ShineText";

describe("ShineText", () => {
  afterEach(cleanup);

  it("renders its children text", () => {
    render(<ShineText>Generating your character…</ShineText>);

    expect(screen.getByText("Generating your character…")).toBeTruthy();
  });

  it("runs the sweep animation while processing is active (default)", () => {
    render(<ShineText>Generating…</ShineText>);
    const el = screen.getByText("Generating…");

    expect(el.className).toContain("shine-text--sweep");
    expect(el.className).not.toContain("shine-text--idle");
  });

  it("falls back to static dim text once processing ends (active = false)", () => {
    render(
      <ShineText active={false}>Generating…</ShineText>
    );
    const el = screen.getByText("Generating…");

    expect(el.className).toContain("shine-text--idle");
    expect(el.className).not.toContain("shine-text--sweep");
  });

  it("keys its styles from ShineText.css — sweep keyframes live in one shared stylesheet", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "./ShineText.css"), "utf8");

    expect(css).toContain("@keyframes shineTextSweep");
    expect(css).toContain(".shine-text--sweep");
    expect(css).toContain(".shine-text--sweep--once");
    expect(css).toContain(".shine-text--idle");
  });

  it("does not self-inject a <style> tag (styles come from the imported stylesheet)", () => {
    render(
      <ShineText active>Generating…</ShineText>
    );

    const componentStyles = Array.from(document.querySelectorAll("style")).filter(
      (s) => s.textContent.includes("shine-text--sweep")
    );
    expect(componentStyles.length).toBe(0);
  });

  it("merges caller className and keeps it in sync with the sweep variant", () => {
    render(
      <ShineText className="text-2xl font-semibold">Generating…</ShineText>
    );
    const el = screen.getByText("Generating…");

    expect(el.className).toContain("text-2xl");
    expect(el.className).toContain("font-semibold");
    expect(el.className).toContain("shine-text--sweep");
  });

  it("renders the idle variant with the exact transition when processing stops", () => {
    render(
      <ShineText active={false} className="text-lg">
        Almost done…
      </ShineText>
    );
    const el = screen.getByText("Almost done…");

    expect(el.className).toContain("shine-text--idle");
    expect(el.className).toContain("text-lg");
  });
});
