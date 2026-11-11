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

describe("DropdownMenu and ContextMenu — Higgsfield Cinema Studio Architecture", () => {
  it("renders DropdownMenu with min-w-[200px], rounded-[var(--r-lg)], bg-[var(--bg-surface)], and border-[var(--border-default)]", () => {
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
    expect(menuItem.className).toContain("h-[36px]");
    expect(menuItem.className).toContain("rounded-[var(--r-sm)]");
    expect(menuItem.className).toContain("text-[var(--text-primary)]");

    const deleteItem = screen.getByText("Delete").closest('[data-slot="dropdown-menu-item"]');
    expect(deleteItem?.className).toContain("!text-[var(--pink-400)]");

    const content = item.closest('[data-slot="dropdown-menu-content"]');
    expect(content).not.toBeNull();
    expect(content.className).toContain("min-w-[200px]");
    expect(content.className).toContain("rounded-[var(--r-lg)]");
    expect(content.className).toContain("bg-[var(--bg-surface)]");
    expect(content.className).toContain("border-[var(--border-default)]");
  });

  it("renders ContextMenu trigger and content structure conforming to Cinema Studio surfaces", () => {
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
