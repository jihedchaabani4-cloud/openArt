"use client";

import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import {
  MENU_INDICATOR_SLOT_CLASS,
  MENU_LABEL_CLASS,
  MENU_PANEL_DEFAULT_WIDTH,
  MENU_SEPARATOR_CLASS,
  MENU_SHORTCUT_CLASS,
  MenuCheckIcon,
  MenuRadioDotIcon,
  MenuSubChevronIcon,
  menuItemClassName,
  menuPanelClassName,
} from "@/components/base/menu";
import { cn } from "@/shared/lib/utils";

function DropdownMenu({ ...props }) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({ ...props }) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

const DropdownMenuTrigger = React.forwardRef(function DropdownMenuTrigger(props, ref) {
  return <DropdownMenuPrimitive.Trigger ref={ref} data-slot="dropdown-menu-trigger" {...props} />;
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef(function DropdownMenuContent(
  {
    className,
    variant = "glass",
    sideOffset = 6,
    style,
    ...props
  },
  ref
) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        data-slot="dropdown-menu-content"
        data-variant={variant}
        sideOffset={sideOffset}
        style={style}
        className={menuPanelClassName({
          variant,
          className: cn(
            "max-h-(--radix-dropdown-menu-content-available-height) origin-(--radix-dropdown-menu-content-transform-origin)",
            MENU_PANEL_DEFAULT_WIDTH,
            className
          ),
        })}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

function DropdownMenuGroup({ ...props }) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

const DropdownMenuItem = React.forwardRef(function DropdownMenuItem(
  {
    className,
    inset,
    selected,
    variant = "default",
    ...props
  },
  ref
) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-selected={selected ? "true" : undefined}
      data-variant={variant}
      className={menuItemClassName({ inset, selected, className })}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuCheckboxItem = React.forwardRef(function DropdownMenuCheckboxItem(
  {
    className,
    children,
    checked,
    ...props
  },
  ref
) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      data-slot="dropdown-menu-checkbox-item"
      className={menuItemClassName({ hasIndicator: true, className })}
      checked={checked}
      {...props}
    >
      <span className={MENU_INDICATOR_SLOT_CLASS}>
        <DropdownMenuPrimitive.ItemIndicator>
          <MenuCheckIcon />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
});
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

function DropdownMenuRadioGroup({ ...props }) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

const DropdownMenuRadioItem = React.forwardRef(function DropdownMenuRadioItem(
  {
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      data-slot="dropdown-menu-radio-item"
      className={menuItemClassName({ hasIndicator: true, className })}
      {...props}
    >
      <span className={MENU_INDICATOR_SLOT_CLASS}>
        <DropdownMenuPrimitive.ItemIndicator>
          <MenuRadioDotIcon />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
});
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

const DropdownMenuLabel = React.forwardRef(function DropdownMenuLabel(
  {
    className,
    inset,
    ...props
  },
  ref
) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(MENU_LABEL_CLASS, className)}
      {...props}
    />
  );
});
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef(function DropdownMenuSeparator(
  {
    className,
    ...props
  },
  ref
) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      data-slot="dropdown-menu-separator"
      className={cn(MENU_SEPARATOR_CLASS, className)}
      {...props}
    />
  );
});
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

function DropdownMenuShortcut({
  className,
  ...props
}) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(MENU_SHORTCUT_CLASS, className)}
      {...props}
    />
  );
}

function DropdownMenuSub({ ...props }) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

const DropdownMenuSubTrigger = React.forwardRef(function DropdownMenuSubTrigger(
  {
    className,
    inset,
    variant = "default",
    children,
    ...props
  },
  ref
) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      data-variant={variant}
      className={menuItemClassName({ inset, className })}
      {...props}
    >
      {children}
      <MenuSubChevronIcon />
    </DropdownMenuPrimitive.SubTrigger>
  );
});
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = React.forwardRef(function DropdownMenuSubContent(
  {
    className,
    variant = "glass",
    sideOffset = 6,
    style,
    ...props
  },
  ref
) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        ref={ref}
        data-slot="dropdown-menu-sub-content"
        data-variant={variant}
        sideOffset={sideOffset}
        style={style}
        className={menuPanelClassName({
          variant,
          className: cn(
            "max-h-(--radix-dropdown-menu-content-available-height) origin-(--radix-dropdown-menu-content-transform-origin)",
            MENU_PANEL_DEFAULT_WIDTH,
            className
          ),
        })}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
});
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
