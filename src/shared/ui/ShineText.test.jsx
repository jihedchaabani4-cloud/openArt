import { afterEach, describe, expect, it } from "vitest";
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

  it("injects its own shineTextSweep keyframes for the sweep", () => {
    render(
      <ShineText active>Generating…</ShineText>
    );

    const styles = Array.from(document.querySelectorAll("style"));
    const sweep = styles.filter((s) => s.textContent.includes("@keyframes shineTextSweep"));

    expect(sweep.length).toBeGreaterThanOrEqual(1);
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
