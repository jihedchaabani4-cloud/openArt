"use client";

import * as React from "react";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/base/dropdown-menu";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/primitives/context-menu";
import {
  MenuItemsList,
  filterActiveMenuItems,
} from "@/components/base/menu";
import { IconButton } from "@/components/base/icon-button";

const DROPDOWN_MENU_COMPONENTS = {
  Item: DropdownMenuItem,
  Separator: DropdownMenuSeparator,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
};

const CONTEXT_MENU_COMPONENTS = {
  Item: ContextMenuItem,
  Separator: ContextMenuSeparator,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
};

/**
 * Universal Dropdown Menu for Studio Media Items.
 * Renders items via the shared MenuItemsList component.
 */
export function StudioItemDropdownMenu({
  items = [],
  open,
  onOpenChange,
  trigger,
  align = "end",
}) {
  const activeItems = React.useMemo(() => filterActiveMenuItems(items), [items]);

  const defaultTrigger = (
    <IconButton
      variant="overlay"
      onClick={(e) => e.stopPropagation()}
      aria-label="More options"
      title="More options"
    >
      <HugeIcon name="more-vertical" />
    </IconButton>
  );

  if (!activeItems.length) {
    return trigger || defaultTrigger;
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
        <MenuItemsList
          items={activeItems}
          components={DROPDOWN_MENU_COMPONENTS}
          onClose={onOpenChange ? () => onOpenChange(false) : undefined}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Universal Context Menu Content for Studio Media Items.
 * Renders the exact same items list via the shared MenuItemsList component.
 */
export function StudioContextMenuContent({
  items = [],
}) {
  const activeItems = React.useMemo(() => filterActiveMenuItems(items), [items]);

  return (
    <ContextMenuContent>
      <MenuItemsList
        items={activeItems}
        components={CONTEXT_MENU_COMPONENTS}
      />
    </ContextMenuContent>
  );
}
