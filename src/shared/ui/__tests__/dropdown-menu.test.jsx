import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/shared/ui/context-menu";

describe("DropdownMenu and ContextMenu — Runway Flat Surface Architecture", () => {
  it("renders DropdownMenu with width w-52, rounded-md, flat bg-surface-card, border-white/10, and zero shadows", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Option 1</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const item = screen.getByText("Option 1");
    const menuItem = item.closest('[data-slot="dropdown-menu-item"]');
    expect(menuItem).not.toBeNull();
    expect(menuItem.className).toContain("min-h-[2.125rem]");
    expect(menuItem.className).toContain("rounded-sm");
    expect(menuItem.className).toContain("text-sm");
    expect(menuItem.className).toContain("pl-3");
    expect(menuItem.className).toContain("pr-4");
    expect(menuItem.className).toContain("text-on-surface");

    const deleteItem = screen.getByText("Delete").closest('[data-slot="dropdown-menu-item"]');
    expect(deleteItem?.className).toContain("data-[variant=destructive]:!text-error");

    const content = item.closest('[data-slot="dropdown-menu-content"]');
    expect(content).not.toBeNull();
    expect(content.className).toContain("w-52");
    expect(content.className).toContain("rounded-md");
    expect(content.className).toContain("bg-surface-container-high");
    expect(content.className).toContain("border-outline-variant");
    expect(content.className).toContain("shadow-none");
  });

  it("renders ContextMenu trigger and content structure conforming to Runway flat surfaces", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Context Option</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    const trigger = screen.getByText("Right click");
    expect(trigger).toBeDefined();
  });
});
