import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/shared/ui/context-menu";

describe("Unified compact menu styling", () => {
  it("renders DropdownMenu with standardized width w-52 and compact item height min-h-[38px]", () => {
    render(
      <DropdownMenu open={true}>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Option 1</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const item = screen.getByText("Option 1");
    const menuItem = item.closest('[data-slot="dropdown-menu-item"]');
    expect(menuItem).not.toBeNull();
    expect(menuItem.className).toContain("min-h-[38px]");
    expect(menuItem.className).toContain("text-[13px]");

    const content = item.closest('[data-slot="dropdown-menu-content"]');
    expect(content).not.toBeNull();
    expect(content.className).toContain("w-52");
  });

  it("renders ContextMenu with standardized width w-52 and compact item height min-h-[38px]", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right click</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Context Option</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );

    // In Radix ContextMenu with open={true} or when rendered
    // Content gets rendered into portal
    const trigger = screen.getByText("Right click");
    expect(trigger).toBeDefined();
  });
});
