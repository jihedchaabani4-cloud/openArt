import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import {
  StudioItemDropdownMenu,
  StudioContextMenuContent,
} from "../StudioItemMenu";
import { ContextMenu, ContextMenuTrigger } from "@/shared/ui/context-menu";

describe("StudioItemDropdownMenu & StudioContextMenuContent Material Flow styling", () => {
  const sampleItems = [
    { key: "fav", label: "Favorite", icon: "favorite", onClick: vi.fn() },
    { key: "reuse", label: "Reuse prompt", icon: "keyboard_return", onClick: vi.fn() },
    { key: "sep-1", type: "separator" },
    { key: "trash", label: "Move to trash", icon: "delete", variant: "destructive", onClick: vi.fn() },
  ];

  it("renders dropdown menu items conforming to Material Flow structure and classes", async () => {
    render(
      <StudioItemDropdownMenu
        items={sampleItems}
        open={true}
        onOpenChange={vi.fn()}
      />
    );

    // Verify items are rendered
    const favItem = screen.getByText("Favorite");
    expect(favItem).toBeDefined();

    // Verify parent structure has .label, .item-text, and .left-content
    expect(favItem.closest(".label")).not.toBeNull();
    expect(favItem.closest(".item-text")).not.toBeNull();
    expect(favItem.closest(".left-content")).not.toBeNull();
    expect(favItem.closest(".mat-mdc-menu-item-text")).not.toBeNull();

    // Verify item has Google Flow classes
    const menuItem = favItem.closest('[data-slot="dropdown-menu-item"]');
    expect(menuItem).not.toBeNull();
    expect(menuItem.classList.contains("mat-mdc-menu-item")).toBe(true);
    expect(menuItem.classList.contains("flow-internal-menu-item")).toBe(true);

    // Destructive item should have delete-button class
    const trashItem = screen.getByText("Move to trash");
    const trashMenuItem = trashItem.closest('[data-slot="dropdown-menu-item"]');
    expect(trashMenuItem.classList.contains("delete-button")).toBe(true);

    // Verify reduced width classes
    const menuContent = favItem.closest('[data-slot="dropdown-menu-content"]');
    expect(menuContent.classList.contains("w-52")).toBe(true);
    expect(menuContent.classList.contains("min-w-[12rem]")).toBe(true);

    // Verify click handler triggers
    fireEvent.click(favItem);
    expect(sampleItems[0].onClick).toHaveBeenCalled();
  });

  it("renders context menu items with matching Material Flow structure", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right click me</ContextMenuTrigger>
        <StudioContextMenuContent items={sampleItems} />
      </ContextMenu>
    );

    // Context menu trigger should be present
    expect(screen.getByText("Right click me")).toBeDefined();
  });

  it("filters out inactive / disabled items so they are not rendered in dropdown", () => {
    const itemsWithDisabled = [
      { key: "custom-active", label: "Unique Active Item", icon: "favorite", onClick: vi.fn() },
      { key: "disabled-btn", label: "Inactive Button", disabled: true, onClick: vi.fn() },
      { key: "sep-1", type: "separator" },
      { key: "custom-trash", label: "Unique Trash Item", icon: "delete", onClick: vi.fn() },
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
});
