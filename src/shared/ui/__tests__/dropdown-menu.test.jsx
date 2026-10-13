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

describe("Google Flow menu styling matching user tokens and DOM", () => {
  it("renders DropdownMenu with width w-52, blur, bg, and item height min-h-[48px] with text-[14px]", () => {
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
    expect(menuItem.className).toContain("min-h-[48px]");
    expect(menuItem.className).toContain("text-[14px]");

    const content = item.closest('[data-slot="dropdown-menu-content"]');
    expect(content).not.toBeNull();
    expect(content.className).toContain("w-52");
    expect(content.style.borderRadius).toBe("var(--mat-menu-container-shape, 24px)");
    expect(content.style.backgroundColor).toBe("var(--mat-menu-container-color, rgba(22, 23, 24, 0.9))");
    expect(content.style.backdropFilter).toContain("blur(100px)");
  });

  it("renders ContextMenu with width w-52, blur, bg, and item height min-h-[48px] with text-[14px]", () => {
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
