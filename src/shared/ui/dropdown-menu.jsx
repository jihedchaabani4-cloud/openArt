"use client";

import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Icon } from "@/shared/ui/Icon";
import { cn } from "@/shared/lib/utils";

/**
 * Dropdown Menu Primitive — design-system.md §6.1 & §6.2
 */

function DropdownMenu({ ...props }) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({ ...props }) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({ ...props }) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  style,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        style={style}
        className={cn(
          "z-[100] min-w-[200px] rounded-[var(--r-lg)] p-1 flex flex-col gap-0.5 font-sans antialiased",
          "bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)]",
          "shadow-[0_16px_32px_rgba(0,0,0,0.40),0_4px_8px_rgba(0,0,0,0.24)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({ ...props }) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-[var(--r-sm)] px-[10px] min-h-[2.125rem] h-[36px] text-sm leading-[20px] font-medium outline-hidden select-none font-sans antialiased transition-colors duration-150",
        "text-[var(--text-primary)] hover:bg-[var(--overlay-5)] focus:bg-[var(--overlay-5)] active:bg-[var(--overlay-10)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[inset]:pl-8",
        (variant === "danger" || variant === "destructive") && "!text-[var(--pink-400)] hover:!text-[var(--pink-400)] [&_svg]:!text-[var(--pink-400)]",
        className
      ) + " rounded-sm"}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-[var(--r-sm)] px-[10px] pl-8 h-[36px] text-[14px] leading-[20px] font-medium outline-hidden select-none text-[var(--text-primary)] hover:bg-[var(--overlay-5)] focus:bg-[var(--overlay-5)] data-[disabled]:opacity-40",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2.5 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Icon name="check" size={14} className="text-[var(--brand)] font-bold" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({ ...props }) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-[var(--r-sm)] px-[10px] pl-8 h-[36px] text-[14px] leading-[20px] font-medium outline-hidden select-none text-[var(--text-primary)] hover:bg-[var(--overlay-5)] focus:bg-[var(--overlay-5)] data-[disabled]:opacity-40",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2.5 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Icon name="circle" size={8} className="fill-[var(--brand)] text-[var(--brand)]" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-[10px] py-1.5 text-[12px] leading-[16px] font-medium text-[var(--text-tertiary)] data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("h-px my-1 bg-[var(--border-subtle)]", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-[var(--text-tertiary)]", className)}
      {...props}
    />
  );
}

function DropdownMenuSub({ ...props }) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-[var(--r-sm)] px-[10px] h-[36px] text-[14px] leading-[20px] font-medium outline-hidden select-none font-sans antialiased text-[var(--text-primary)] hover:bg-[var(--overlay-5)] focus:bg-[var(--overlay-5)] data-[state=open]:bg-[var(--overlay-5)]",
        className
      )}
      {...props}
    >
      {children}
      <Icon name="chevron_right" size={14} className="ml-auto text-[var(--text-secondary)]" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  style,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      style={style}
      className={cn(
        "z-[100] min-w-[200px] rounded-[var(--r-lg)] p-1 flex flex-col gap-0.5 font-sans antialiased",
        "bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)]",
        "shadow-[0_16px_32px_rgba(0,0,0,0.40),0_4px_8px_rgba(0,0,0,0.24)]",
        className
      )}
      {...props}
    />
  );
}

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