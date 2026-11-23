import * as React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  MenuItemContent,
  menuItemClassName,
  menuPanelClassName,
  Select,
  SelectGroup,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from "@/components/base";

afterEach(() => {
  cleanup();
});

const SHARED_PANEL_CLASSES = [
  "bg-surface-menu-glass",
  "rounded-xl",
  "overflow-x-hidden",
  "overflow-y-auto",
  "text-text-primary",
  "p-1.5",
  "gap-0.5",
  "font-sans",
  "antialiased",
];

const SHARED_ITEM_CLASSES = [
  "ds-menu-item",
  "ds-text-caption-m",
  "font-normal",
  "text-text-primary",
  "rounded-lg",
  "gap-2",
  "hover:bg-surface-tonal",
  "[&_svg:not([class*='text-'])]:text-icon-primary",
  "[&_svg:not([class*='size-'])]:size-4",
  "[&_.huge-icon:not([class*='text-'])]:text-icon-primary",
];

describe("Unified Menu System — DropdownMenu, ContextMenu, and Select parity", () => {
  it("renders DropdownMenu with canonical unified panel, item, label, separator, and destructive tokens", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>Option 1</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const content = screen.getByText("Option 1").closest('[data-slot="dropdown-menu-content"]');
    expect(content).not.toBeNull();
    expect(content.className).toContain("w-56");
    expect(content.className).toContain("surface-glass");
    for (const cls of SHARED_PANEL_CLASSES) {
      expect(content.className).toContain(cls);
    }

    const menuItem = screen.getByText("Option 1").closest('[data-slot="dropdown-menu-item"]');
    expect(menuItem).not.toBeNull();
    for (const cls of SHARED_ITEM_CLASSES) {
      expect(menuItem.className).toContain(cls);
    }

    const deleteItem = screen.getByText("Delete").closest('[data-slot="dropdown-menu-item"]');
    expect(deleteItem?.getAttribute("data-variant")).toBe("destructive");
    expect(deleteItem?.className).toContain("data-[variant=destructive]:!text-error");

    const label = screen.getByText("Actions");
    expect(label.className).toContain("text-text-secondary");
    expect(label.className).toContain("font-medium");
    expect(label.className).not.toContain("uppercase");

    const sep = content.querySelector('[data-slot="dropdown-menu-separator"]');
    expect(sep?.className).toContain("bg-border-menu-subtle");
    expect(sep?.className).toContain("m-0");
  });

  it("renders ContextMenu with the exact same shared panel, item, separator, and destructive classes as DropdownMenu", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Context</ContextMenuLabel>
          <ContextMenuItem>Context Option</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">Context Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    fireEvent.contextMenu(screen.getByText("Right click"));

    const content = screen.getByText("Context Option").closest('[data-slot="context-menu-content"]');
    expect(content).not.toBeNull();
    expect(content.className).toContain("w-56");
    expect(content.className).toContain("surface-glass");
    for (const cls of SHARED_PANEL_CLASSES) {
      expect(content.className).toContain(cls);
    }

    const item = screen.getByText("Context Option").closest('[data-slot="context-menu-item"]');
    expect(item).not.toBeNull();
    for (const cls of SHARED_ITEM_CLASSES) {
      expect(item.className).toContain(cls);
    }

    const deleteItem = screen.getByText("Context Delete").closest('[data-slot="context-menu-item"]');
    expect(deleteItem?.className).toContain("data-[variant=destructive]:!text-error");

    const label = screen.getByText("Context");
    expect(label.className).toContain("text-text-secondary");
    expect(label.className).toContain("font-medium");
    expect(label.className).not.toContain("uppercase");

    const sep = content.querySelector('[data-slot="context-menu-separator"]');
    expect(sep?.className).toContain("bg-border-menu-subtle");
    expect(sep?.className).toContain("m-0");
  });

  it("renders Select with the exact same shared panel, item, label, and separator classes as DropdownMenu", () => {
    render(
      <Select defaultValue="opt-1" open={true}>
        <SelectTrigger aria-label="Choose option">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Choices</SelectLabel>
            <SelectItem value="opt-1">Option One</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectItem value="opt-2">Option Two</SelectItem>
        </SelectContent>
      </Select>
    );

    const optionOne = screen.getAllByText("Option One").find((el) =>
      el.closest('[data-slot="select-item"]')
    );
    expect(optionOne).toBeDefined();

    const content = optionOne.closest('[data-slot="select-content"]');
    expect(content).not.toBeNull();
    expect(content.className).toContain("surface-listbox");
    for (const cls of SHARED_PANEL_CLASSES) {
      expect(content.className).toContain(cls);
    }

    const selectItem = optionOne.closest('[data-slot="select-item"]');
    expect(selectItem).not.toBeNull();
    for (const cls of SHARED_ITEM_CLASSES) {
      expect(selectItem.className).toContain(cls);
    }
    expect(optionOne.className).not.toContain("capitalize");

    const label = screen.getByText("Choices");
    expect(label.className).toContain("text-text-secondary");
    expect(label.className).toContain("font-medium");
    expect(label.className).not.toContain("uppercase");

    const sep = content.querySelector('[data-slot="select-separator"]');
    expect(sep?.className).toContain("bg-border-menu-subtle");
    expect(sep?.className).toContain("m-0");
  });

  it("maintains full DropdownMenu ↔ ContextMenu parity for Content, SubContent, SubTrigger, CheckboxItem, and RadioItem", () => {
    const contextTriggerRef = React.createRef();

    render(
      <>
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Open Dropdown</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>DD Checked</DropdownMenuCheckboxItem>
            <DropdownMenuRadioGroup value="a">
              <DropdownMenuRadioItem value="a">DD Radio</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSub open={true}>
              <DropdownMenuSubTrigger>DD More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>DD Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        <ContextMenu>
          <ContextMenuTrigger ref={contextTriggerRef}>Right Click Target</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked={true}>CM Checked</ContextMenuCheckboxItem>
            <ContextMenuRadioGroup value="a">
              <ContextMenuRadioItem value="a">CM Radio</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
            <ContextMenuSub open={true}>
              <ContextMenuSubTrigger>CM More</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>CM Sub Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      </>
    );

    expect(contextTriggerRef.current).toBeInstanceOf(HTMLElement);

    fireEvent.contextMenu(screen.getByText("Right Click Target"));

    const ddContent = screen.getByText("DD Checked").closest('[data-slot="dropdown-menu-content"]');
    const ddSubContent = screen.getByText("DD Sub Item").closest('[data-slot="dropdown-menu-sub-content"]');
    const cmContent = screen.getByText("CM Checked").closest('[data-slot="context-menu-content"]');
    const cmSubContent = screen.getByText("CM Sub Item").closest('[data-slot="context-menu-sub-content"]');

    for (const panel of [ddContent, ddSubContent, cmContent, cmSubContent]) {
      expect(panel).not.toBeNull();
      expect(panel.className).toContain("w-56");
      expect(panel.className).toContain("surface-glass");
      expect(panel.className).not.toContain("overflow-hidden");
      for (const cls of SHARED_PANEL_CLASSES) {
        expect(panel.className).toContain(cls);
      }
    }

    for (const ddPanel of [ddContent, ddSubContent]) {
      expect(ddPanel.className).toContain("max-h-(--radix-dropdown-menu-content-available-height)");
      expect(ddPanel.className).toContain("origin-(--radix-dropdown-menu-content-transform-origin)");
    }

    for (const cmPanel of [cmContent, cmSubContent]) {
      expect(cmPanel.className).toContain("max-h-(--radix-context-menu-content-available-height)");
      expect(cmPanel.className).toContain("origin-(--radix-context-menu-content-transform-origin)");
    }

    const ddSubTrigger = screen.getByText("DD More").closest('[data-slot="dropdown-menu-sub-trigger"]');
    const cmSubTrigger = screen.getByText("CM More").closest('[data-slot="context-menu-sub-trigger"]');
    expect(ddSubTrigger?.className).toBe(cmSubTrigger?.className);

    const ddCheckbox = screen.getByText("DD Checked").closest('[data-slot="dropdown-menu-checkbox-item"]');
    const cmCheckbox = screen.getByText("CM Checked").closest('[data-slot="context-menu-checkbox-item"]');
    expect(ddCheckbox?.className).toBe(cmCheckbox?.className);
    expect(ddCheckbox?.className).toContain("pl-8");

    const ddRadio = screen.getByText("DD Radio").closest('[data-slot="dropdown-menu-radio-item"]');
    const cmRadio = screen.getByText("CM Radio").closest('[data-slot="context-menu-radio-item"]');
    expect(ddRadio?.className).toBe(cmRadio?.className);
    expect(ddRadio?.className).toContain("pl-8");
  });

  it("wraps MenuItemContent trailing slot with ml-auto and drops legacy normal/danger aliases", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <MenuItemContent trailing={<span data-testid="trailing-control">ON</span>}>
              Setting Row
            </MenuItemContent>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <MenuItemContent checked={true}>Checked Row</MenuItemContent>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trailingControl = screen.getByTestId("trailing-control");
    const trailingWrapper = trailingControl.parentElement;
    expect(trailingWrapper?.className).toContain("ml-auto");
    expect(trailingWrapper?.className).toContain("shrink-0");
    expect(trailingWrapper?.className).toContain("flex");
    expect(trailingWrapper?.className).toContain("items-center");

    const checkedRow = screen.getByText("Checked Row").closest('[data-slot="dropdown-menu-item"]');
    const checkIcon = checkedRow?.querySelector(".huge-icon");
    expect(checkIcon?.parentElement?.className).toContain("ml-auto");

    expect(menuPanelClassName({ variant: "normal" })).toContain("surface-glass");
    expect(menuPanelClassName({ variant: "normal" })).not.toContain("shadow-none");
    expect(menuItemClassName()).not.toContain("data-[variant=danger]");
  });

  it("repositions ContextMenu to the new cursor coordinates when right-clicking again while open without locking body pointer-events", async () => {
    function getPopperCoords() {
      const wrapper = document.querySelector("[data-radix-popper-content-wrapper]");
      const match = /translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/.exec(
        wrapper?.style?.transform || ""
      );
      return match ? { x: Number(match[1]), y: Number(match[2]) } : null;
    }

    render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div data-testid="ctx-surface" style={{ width: 800, height: 600 }}>
            Surface
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Context Action</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    const surface = screen.getByTestId("ctx-surface");

    // 1. Open at point A (100, 100)
    fireEvent.contextMenu(surface, { clientX: 100, clientY: 100 });
    await waitFor(() => {
      const coords = getPopperCoords();
      expect(coords).not.toBeNull();
      expect(Math.abs(coords.x - 100)).toBeLessThanOrEqual(5);
      expect(Math.abs(coords.y - 100)).toBeLessThanOrEqual(5);
    });

    // Must not disable body pointer-events so a second right-click reaches triggers directly
    expect(document.body.style.pointerEvents).not.toBe("none");

    // 2. Right-click at point B (400, 300) WHILE menu is still open
    fireEvent.contextMenu(surface, { clientX: 400, clientY: 300 });
    await waitFor(() => {
      const coords = getPopperCoords();
      expect(coords).not.toBeNull();
      expect(Math.abs(coords.x - 400)).toBeLessThanOrEqual(5);
      expect(Math.abs(coords.y - 300)).toBeLessThanOrEqual(5);
    });

    // 3. Real browser right-click sequence (pointerdown outside + contextmenu) at point C (240, 180)
    fireEvent.pointerDown(surface, { button: 2, pointerType: "mouse", clientX: 240, clientY: 180 });
    fireEvent.contextMenu(surface, { clientX: 240, clientY: 180 });
    await waitFor(() => {
      const coords = getPopperCoords();
      expect(coords).not.toBeNull();
      expect(Math.abs(coords.x - 240)).toBeLessThanOrEqual(5);
      expect(Math.abs(coords.y - 180)).toBeLessThanOrEqual(5);
    });
  });
});
