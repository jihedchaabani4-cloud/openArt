import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FlowErrorTile } from "./FlowErrorTile";

describe("FlowErrorTile", () => {
  afterEach(cleanup);

  it("disables reuse when the failed workflow has no saved generation config", () => {
    render(<FlowErrorTile canReusePrompt={false} />);

    expect(screen.getByRole("button", { name: "Reuse prompt" }).disabled).toBe(true);
  });

  it("reuses the failed workflow's saved parameters when available", () => {
    const onReusePrompt = vi.fn();
    render(<FlowErrorTile canReusePrompt onReusePrompt={onReusePrompt} />);

    fireEvent.click(screen.getByRole("button", { name: "Reuse prompt" }));

    expect(onReusePrompt).toHaveBeenCalledTimes(1);
  });
});
