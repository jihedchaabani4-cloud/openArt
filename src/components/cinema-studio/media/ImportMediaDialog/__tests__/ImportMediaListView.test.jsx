import { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { ImportMediaListView } from "../ImportMediaListView";

const SAMPLE_ITEMS = [
  {
    id: "up-1",
    workflow_id: "up-1",
    display_name: "Upload One",
    url: "https://cdn.example.com/up-1.png",
    type: "upload",
    is_upload: true,
  },
  {
    id: "up-2",
    workflow_id: "up-2",
    display_name: "Upload Two",
    url: "https://cdn.example.com/up-2.png",
    type: "upload",
    is_upload: true,
  },
  {
    id: "up-3",
    workflow_id: "up-3",
    display_name: "Upload Three",
    url: "https://cdn.example.com/up-3.png",
    type: "upload",
    is_upload: true,
  },
];

function StatefulListHarness({ initialItems = SAMPLE_ITEMS, initialListKey = "upload:" }) {
  const [items, setItems] = useState(initialItems);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [listKey, setListKey] = useState(initialListKey);

  const clampedIdx = Math.min(focusedIdx, Math.max(0, items.length - 1));
  const focusedId = items[clampedIdx]?.id;

  const handleSelectDirect = (selected) => {
    setItems((prev) => prev.filter((it) => it.id !== selected.id));
  };

  return (
    <div>
      <button type="button" onClick={() => setListKey("image:")}>
        Switch tab
      </button>
      <ImportMediaListView
        items={items}
        listKey={listKey}
        focusedId={focusedId}
        onFocusChange={(_item, idx) => setFocusedIdx(idx)}
        onSelectDirect={handleSelectDirect}
        availableSlots={4}
      />
    </div>
  );
}

describe("ImportMediaListView — removal animation and focus handoff", () => {
  afterEach(() => {
    cleanup();
  });

  it("animates out a removed item and shifts focus cleanly to the next item when Add to prompt is clicked", async () => {
    render(<StatefulListHarness />);

    // Select the second item ("Upload Two")
    fireEvent.click(screen.getByRole("option", { name: /Upload Two/i }));
    expect(screen.getByRole("option", { name: /Upload Two/i }).getAttribute("aria-selected")).toBe("true");

    // Click "Add to prompt"
    fireEvent.click(screen.getByRole("button", { name: "Add to prompt" }));

    // Next item ("Upload Three") immediately becomes active without flashing "Upload One"
    expect(screen.getByRole("option", { name: /Upload Three/i }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("option", { name: /Upload One/i }).getAttribute("aria-selected")).toBe("false");

    // Exiting item finishes exit animation and unmounts cleanly
    await waitFor(
      () => {
        expect(screen.queryByRole("option", { name: /Upload Two/i })).toBeNull();
      },
      { timeout: 1500 }
    );

    expect(screen.getByRole("option", { name: /Upload One/i })).toBeTruthy();
    expect(screen.getByRole("option", { name: /Upload Three/i })).toBeTruthy();
  });

  it("animates out the last remaining item and displays empty state cleanly", async () => {
    render(<StatefulListHarness initialItems={[SAMPLE_ITEMS[0]]} />);

    fireEvent.click(screen.getByRole("button", { name: "Add to prompt" }));

    await waitFor(
      () => {
        expect(screen.queryByRole("option", { name: /Upload One/i })).toBeNull();
      },
      { timeout: 1500 }
    );

    expect(screen.getByText("No assets found")).toBeTruthy();
    expect(screen.getByText("No item selected")).toBeTruthy();
  });

  it("calls onSelectDirect on double-click and removes item smoothly", async () => {
    const onSelectSpy = vi.fn();
    function DoubleClickHost() {
      const [items, setItems] = useState(SAMPLE_ITEMS.slice(0, 2));
      return (
        <ImportMediaListView
          items={items}
          onSelectDirect={(item) => {
            onSelectSpy(item);
            setItems((prev) => prev.filter((it) => it.id !== item.id));
          }}
          availableSlots={4}
        />
      );
    }

    render(<DoubleClickHost />);
    fireEvent.doubleClick(screen.getByRole("option", { name: /Upload One/i }));

    expect(onSelectSpy).toHaveBeenCalledTimes(1);
    expect(onSelectSpy.mock.calls[0][0].id).toBe("up-1");

    await waitFor(
      () => {
        expect(screen.queryByRole("option", { name: /Upload One/i })).toBeNull();
      },
      { timeout: 1500 }
    );
    expect(screen.getByRole("option", { name: /Upload Two/i })).toBeTruthy();
  });
});
