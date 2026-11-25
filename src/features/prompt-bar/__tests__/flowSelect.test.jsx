import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import {
  FlowSelect,
  FlowPromptBoxSettings,
} from "@/components/cinema-studio/prompt-bar/selectors/FlowPromptBoxSettings";
import { createPromptBarStore } from "../store/createPromptBarStore.js";
import { createBoundPromptBarService } from "../store/publicActions.js";
import { generatedMediaTemplate } from "../templates/generatedMedia.template.js";

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
    expect(screen.getByText("Preset")).toBeDefined();
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

  it("renders the dropdown on the shared unified menu surface", () => {
    render(
      <FlowSelect
        value="fast"
        onChange={vi.fn()}
        items={items}
        label="Preset"
        displayValue="Fast Mode"
        width={240}
      />
    );

    fireEvent.click(screen.getByRole("button"));

    const listbox = screen.getByRole("listbox");
    expect(listbox.getAttribute("data-slot")).toBe("popover-content");
    expect(listbox.className).toContain("bg-surface-menu-glass");
    expect(listbox.className).toContain("surface-listbox");
    expect(listbox.className).toContain("rounded-comfortable");
    expect(listbox.className).toContain("text-text-primary");
    expect(listbox.className).toContain("p-1.5");
    expect(listbox.style.width).toBe("240px");
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

    const highQualityOption = within(listbox).getByText("High Quality");
    fireEvent.click(highQualityOption);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("quality");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("renders unified .ds-menu-item rows and checkmark for the selected option", () => {
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

    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(3);

    const selectedOption = options.find((opt) => opt.textContent.includes("High Quality"));
    expect(selectedOption).toBeDefined();
    expect(selectedOption.className).toContain("ds-menu-item");
    expect(selectedOption.getAttribute("aria-selected")).toBe("true");
    expect(selectedOption.getAttribute("data-selected")).toBe("true");
    expect(selectedOption.querySelector('[data-icon-name="tick-02"]')).not.toBeNull();

    const unselectedOption = options.find((opt) => opt.textContent.includes("Fast Mode"));
    expect(unselectedOption).toBeDefined();
    expect(unselectedOption.className).toContain("ds-menu-item");
    expect(unselectedOption.getAttribute("aria-selected")).toBe("false");
    expect(unselectedOption.querySelector('[data-icon-name="tick-02"]')).toBeNull();
  });

  it("does not auto-focus the unselected first option when opened via click", () => {
    render(
      <FlowSelect
        value="ultra"
        onChange={vi.fn()}
        items={items}
        label="Preset"
        displayValue="Ultra HD"
      />
    );

    fireEvent.click(screen.getByRole("button"));
    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");

    expect(document.activeElement).not.toBe(options[0]);
  });
});

describe("FlowPromptBoxSettings — strict model-owned parameters", () => {
  it("does NOT render Ratio or Outputs controls when the active model does not declare them, and setSetting rejects undeclared keys", () => {
    const minimalModel = {
      id: "minimal_model",
      name: "Minimal Model",
      domain: "image",
      pricing: { fixedPrice: 10 },
      parameters: {
        prompt: { type: "text" },
        quality: {
          type: "select",
          values: [
            { value: "standard", label: "Standard" },
            { value: "hd", label: "HD" },
          ],
          default: "standard",
        },
      },
    };

    const store = createPromptBarStore(
      {
        template: generatedMediaTemplate,
        modelsMap: { [minimalModel.id]: minimalModel },
        selectedModelId: minimalModel.id,
        parameterValues: { quality: "standard" },
      },
      { template: generatedMediaTemplate }
    );
    const service = createBoundPromptBarService(store);

    render(
      <FlowPromptBoxSettings
        currentModel={minimalModel}
        models={[minimalModel]}
        parameters={Object.entries(minimalModel.parameters).filter(([k]) => k !== "prompt")}
        paramValues={store.getState().parameterValues}
        onParamChange={service.setSetting}
      />
    );

    expect(screen.queryByRole("radiogroup", { name: "Format" })).toBeNull();
    expect(screen.queryByRole("radiogroup", { name: "Nombre de sorties" })).toBeNull();
    // Credits default to 1x without writing undeclared count into state
    expect(screen.getByText(/10\s*crédits/)).toBeDefined();
    expect(store.getState().parameterValues).toEqual({ quality: "standard" });

    // Store command remains strict for undeclared keys
    expect(service.setSetting("count", 2).ok).toBe(false);
    expect(service.setSetting("aspect_ratio", "16:9").ok).toBe(false);
    expect(store.getState().parameterValues).toEqual({ quality: "standard" });
  });

  it("renders model-declared aspect_ratio and variations controls from schema and updates store via service.setSetting", () => {
    const modelWithVariations = {
      id: "variations_model",
      name: "Variations Model",
      domain: "image",
      pricing: { fixedPrice: 5 },
      parameters: {
        prompt: { type: "text" },
        aspect_ratio: {
          type: "select",
          values: [
            { value: "1:1", label: "1:1" },
            { value: "16:9", label: "16:9" },
          ],
          default: "1:1",
        },
        variations: {
          type: "select",
          values: [
            { value: 1, label: "1" },
            { value: 2, label: "2" },
            { value: 3, label: "3" },
          ],
          default: 1,
        },
      },
    };

    const store = createPromptBarStore(
      {
        template: generatedMediaTemplate,
        modelsMap: { [modelWithVariations.id]: modelWithVariations },
        selectedModelId: modelWithVariations.id,
        parameterValues: { aspect_ratio: "1:1", variations: 1 },
      },
      { template: generatedMediaTemplate }
    );
    const service = createBoundPromptBarService(store);

    const { rerender } = render(
      <FlowPromptBoxSettings
        currentModel={modelWithVariations}
        models={[modelWithVariations]}
        parameters={Object.entries(modelWithVariations.parameters).filter(([k]) => k !== "prompt")}
        paramValues={store.getState().parameterValues}
        onParamChange={service.setSetting}
      />
    );

    const formatGroup = screen.getByRole("radiogroup", { name: "Format" });
    expect(within(formatGroup).getAllByRole("radio")).toHaveLength(2);
    fireEvent.click(within(formatGroup).getByRole("radio", { name: "16:9" }));
    expect(store.getState().parameterValues.aspect_ratio).toBe("16:9");

    const outputsGroup = screen.getByRole("radiogroup", { name: "Nombre de sorties" });
    expect(within(outputsGroup).getAllByRole("radio")).toHaveLength(3);
    fireEvent.click(within(outputsGroup).getByRole("radio", { name: "3" }));
    expect(store.getState().parameterValues.variations).toBe(3);
    expect("count" in store.getState().parameterValues).toBe(false);

    rerender(
      <FlowPromptBoxSettings
        currentModel={modelWithVariations}
        models={[modelWithVariations]}
        parameters={Object.entries(modelWithVariations.parameters).filter(([k]) => k !== "prompt")}
        paramValues={store.getState().parameterValues}
        onParamChange={service.setSetting}
      />
    );
    expect(screen.getByText(/15\s*crédits/)).toBeDefined();
  });

  it("derives outputs choices from min..max for numeric num_outputs parameter and sends exact key", () => {
    const modelWithRange = {
      id: "range_model",
      name: "Range Model",
      domain: "image",
      parameters: {
        prompt: { type: "text" },
        num_outputs: {
          type: "number",
          min: 1,
          max: 2,
          default: 1,
        },
      },
    };

    const store = createPromptBarStore(
      {
        template: generatedMediaTemplate,
        modelsMap: { [modelWithRange.id]: modelWithRange },
        selectedModelId: modelWithRange.id,
        parameterValues: { num_outputs: 1 },
      },
      { template: generatedMediaTemplate }
    );
    const service = createBoundPromptBarService(store);

    render(
      <FlowPromptBoxSettings
        currentModel={modelWithRange}
        models={[modelWithRange]}
        parameters={Object.entries(modelWithRange.parameters).filter(([k]) => k !== "prompt")}
        paramValues={store.getState().parameterValues}
        onParamChange={service.setSetting}
      />
    );

    const outputsGroup = screen.getByRole("radiogroup", { name: "Nombre de sorties" });
    const radios = within(outputsGroup).getAllByRole("radio");
    expect(radios.map((r) => r.textContent)).toEqual(["1", "2"]);

    fireEvent.click(within(outputsGroup).getByRole("radio", { name: "2" }));
    expect(store.getState().parameterValues.num_outputs).toBe(2);
    expect("count" in store.getState().parameterValues).toBe(false);
  });
});
