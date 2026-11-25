import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  StudioItemDropdownMenu,
  StudioContextMenuContent,
} from "../StudioItemMenu";
import { ContextMenu, ContextMenuTrigger } from "@/components/primitives/context-menu";

afterEach(() => {
  cleanup();
});

describe("StudioItemDropdownMenu & StudioContextMenuContent unified menu contract", () => {
  const createSampleItems = () => [
    { key: "fav", label: "Favorite", icon: "favourite", onClick: vi.fn() },
    { key: "reuse", label: "Reuse prompt", icon: "arrow-turn-backward", onClick: vi.fn() },
    { key: "sep-1", type: "separator" },
    {
      key: "trash",
      label: "Move to trash",
      icon: "delete-02",
      variant: "destructive",
      onClick: vi.fn(),
    },
  ];

  it("renders dropdown menu items through the unified menu contract without legacy Material classes", () => {
    const sampleItems = createSampleItems();
    const onOpenChange = vi.fn();

    render(
      <StudioItemDropdownMenu
        items={sampleItems}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    const favItem = screen.getByText("Favorite");
    const menuItem = favItem.closest('[data-slot="dropdown-menu-item"]');
    expect(menuItem).not.toBeNull();
    expect(menuItem.className).toContain("ds-menu-item");
    expect(menuItem.className).toContain("ds-type-small");
    expect(menuItem.className).toContain("text-text-primary");
    expect(menuItem.className).toContain("[&_.huge-icon:not([class*='text-'])]:text-icon-primary");
    expect(menuItem.className).not.toContain("mat-mdc-menu-item");
    expect(menuItem.className).not.toContain("flow-internal-menu-item");

    const trashItem = screen.getByText("Move to trash");
    const trashMenuItem = trashItem.closest('[data-slot="dropdown-menu-item"]');
    expect(trashMenuItem.getAttribute("data-variant")).toBe("destructive");
    expect(trashMenuItem.className).toContain("data-[variant=destructive]:!text-error");
    expect(trashMenuItem.className).not.toContain("delete-button");

    const menuContent = favItem.closest('[data-slot="dropdown-menu-content"]');
    expect(menuContent.className).toContain("w-56");
    expect(menuContent.className).toContain("surface-glass");
    expect(menuContent.className).toContain("bg-surface-menu-glass");
    expect(menuContent.className).toContain("rounded-comfortable");
    expect(menuContent.className).toContain("p-1.5");
    expect(menuContent.className).not.toContain("mat-mdc-menu-panel");

    const sep = menuContent.querySelector('[data-slot="dropdown-menu-separator"]');
    expect(sep?.className).toContain("bg-border-menu-subtle");
    expect(sep?.className).toContain("m-0");

    fireEvent.click(favItem);
    expect(sampleItems[0].onClick).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders context menu items with the exact same unified classes and structure as dropdown menu", () => {
    const sampleItems = createSampleItems();

    render(
      <ContextMenu>
        <ContextMenuTrigger>Right click me</ContextMenuTrigger>
        <StudioContextMenuContent items={sampleItems} />
      </ContextMenu>
    );

    fireEvent.contextMenu(screen.getByText("Right click me"));

    const favItem = screen.getByText("Favorite");
    const ctxItem = favItem.closest('[data-slot="context-menu-item"]');
    expect(ctxItem).not.toBeNull();
    expect(ctxItem.className).toContain("ds-menu-item");
    expect(ctxItem.className).toContain("ds-type-small");
    expect(ctxItem.className).toContain("text-text-primary");

    const trashItem = screen.getByText("Move to trash").closest('[data-slot="context-menu-item"]');
    expect(trashItem?.getAttribute("data-variant")).toBe("destructive");
    expect(trashItem?.className).toContain("data-[variant=destructive]:!text-error");

    const ctxContent = favItem.closest('[data-slot="context-menu-content"]');
    expect(ctxContent.className).toContain("w-56");
    expect(ctxContent.className).toContain("surface-glass");
    expect(ctxContent.className).toContain("bg-surface-menu-glass");
    expect(ctxContent.className).toContain("rounded-comfortable");
    expect(ctxContent.className).toContain("p-1.5");

    const sep = ctxContent.querySelector('[data-slot="context-menu-separator"]');
    expect(sep?.className).toContain("bg-border-menu-subtle");
    expect(sep?.className).toContain("m-0");

    fireEvent.click(favItem);
    expect(sampleItems[0].onClick).toHaveBeenCalledTimes(1);
  });

  it("filters out inactive / disabled items so they are not rendered in dropdown", () => {
    const itemsWithDisabled = [
      { key: "custom-active", label: "Unique Active Item", icon: "favourite", onClick: vi.fn() },
      { key: "disabled-btn", label: "Inactive Button", disabled: true, onClick: vi.fn() },
      { key: "sep-1", type: "separator" },
      { key: "custom-trash", label: "Unique Trash Item", icon: "delete-02", onClick: vi.fn() },
    ];

    render(
      <StudioItemDropdownMenu
        items={itemsWithDisabled}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    expect(screen.getByText("Unique Active Item")).toBeDefined();
    expect(screen.getByText("Unique Trash Item")).toBeDefined();
    expect(screen.queryByText("Inactive Button")).toBeNull();
  });

  it("enforces default w-56 + surface-glass parity between Dropdown and Context media menus without caller className overrides", () => {
    const sampleItems = createSampleItems();

    render(
      <>
        <StudioItemDropdownMenu
          items={sampleItems}
          open={true}
          onOpenChange={vi.fn()}
          className="w-72 custom-override"
        />
        <ContextMenu>
          <ContextMenuTrigger>Parity trigger</ContextMenuTrigger>
          <StudioContextMenuContent
            items={sampleItems}
            className="w-72 custom-override"
          />
        </ContextMenu>
      </>
    );

    fireEvent.contextMenu(screen.getByText("Parity trigger"));

    const dropdownContent = document.querySelector('[data-slot="dropdown-menu-content"]');
    const contextContent = document.querySelector('[data-slot="context-menu-content"]');
    expect(dropdownContent).not.toBeNull();
    expect(contextContent).not.toBeNull();

    for (const panel of [dropdownContent, contextContent]) {
      expect(panel.className).toContain("w-56");
      expect(panel.className).toContain("surface-glass");
      expect(panel.className).toContain("bg-surface-menu-glass");
      expect(panel.className).not.toContain("w-72");
      expect(panel.className).not.toContain("custom-override");
    }
  });
});
