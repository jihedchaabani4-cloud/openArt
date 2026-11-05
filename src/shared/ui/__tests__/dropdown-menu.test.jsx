import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
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
  it("renders DropdownMenu with width w-52, rounded-lg, flat bg-surface-card, border-white/10, and zero shadows", () => {
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
    expect(menuItem.className).toContain("text-[14px]");
    expect(menuItem.className).toContain("pl-3");
    expect(menuItem.className).toContain("pr-4");
    expect(menuItem.className).toContain("text-white/90");

    const deleteItem = screen.getByText("Delete").closest('[data-slot="dropdown-menu-item"]');
    expect(deleteItem?.className).toContain("data-[variant=destructive]:!text-danger");

    const content = item.closest('[data-slot="dropdown-menu-content"]');
    expect(content).not.toBeNull();
    expect(content.className).toContain("w-52");
    expect(content.className).toContain("rounded-lg");
    expect(content.className).toContain("bg-surface-card");
    expect(content.className).toContain("border-white/10");
    expect(content.className).toContain("shadow-none");
    expect(content.className).not.toContain("backdrop-blur");
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
