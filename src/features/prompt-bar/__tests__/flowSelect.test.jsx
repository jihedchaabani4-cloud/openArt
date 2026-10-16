import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { FlowSelect } from "../ui/common/selectors/FlowPromptBoxSettings";

afterEach(() => {
  cleanup();
});

describe("FlowSelect component", () => {
  const items = [
    { value: "fast", label: "Fast Mode" },
    { value: "quality", label: "High Quality" },
    { value: "ultra", label: "Ultra HD" },
  ];

  it("renders trigger button with label, displayValue, and custom icon", () => {
    render(
      <FlowSelect
        value="fast"
        onChange={vi.fn()}
        items={items}
        icon={<span data-testid="custom-icon">⚡</span>}
        label="Preset"
        displayValue="Fast Mode"
        ariaLabel="Select preset"
      />
    );

    const trigger = screen.getByRole("button", { name: "Select preset" });
    expect(trigger).toBeDefined();
    expect(screen.getByTestId("custom-icon")).toBeDefined();
    expect(screen.getByText("Preset:")).toBeDefined();
    expect(screen.getByText("Fast Mode")).toBeDefined();
  });

  it("opens option list when trigger is clicked", () => {
    render(
      <FlowSelect
        value="fast"
        onChange={vi.fn()}
        items={items}
        label="Preset"
        displayValue="Fast Mode"
      />
    );

    expect(screen.queryByRole("listbox")).toBeNull();

    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeDefined();
    expect(within(listbox).getByText("Fast Mode")).toBeDefined();
    expect(within(listbox).getByText("High Quality")).toBeDefined();
    expect(within(listbox).getByText("Ultra HD")).toBeDefined();
  });

  it("selects an option, calls onChange with value, and closes menu", () => {
    const onChange = vi.fn();
    render(
      <FlowSelect
        value="fast"
        onChange={onChange}
        items={items}
        label="Preset"
        displayValue="Fast Mode"
      />
    );

    fireEvent.click(screen.getByRole("button"));
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeDefined();

    const highQualityBtn = within(listbox).getByText("High Quality");
    fireEvent.click(highQualityBtn);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("quality");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("renders checkmark for the selected item", () => {
    render(
      <FlowSelect
        value="quality"
        onChange={vi.fn()}
        items={items}
        label="Preset"
        displayValue="High Quality"
      />
    );

    fireEvent.click(screen.getByRole("button"));
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeDefined();

    const optionButtons = within(listbox).getAllByRole("button");
    const selectedOption = optionButtons.find((btn) => btn.textContent.includes("High Quality"));
    expect(selectedOption).toBeDefined();
    expect(selectedOption.textContent).toContain("check");

    const unselectedOption = optionButtons.find((btn) => btn.textContent.includes("Fast Mode"));
    expect(unselectedOption).toBeDefined();
    expect(unselectedOption.textContent).not.toContain("check");
  });
});
