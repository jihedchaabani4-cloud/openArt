"use client";

import * as React from "react";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
import { Icon } from "@/shared/ui/Icon";
import { cn } from "@/shared/lib/utils";

function ContextMenu({ ...props }) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuTrigger({ ...props }) {
  return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />;
}

function ContextMenuGroup({ ...props }) {
  return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />;
}

function ContextMenuPortal({ ...props }) {
  return <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />;
}

function ContextMenuSub({ ...props }) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />;
}

function ContextMenuRadioGroup({ ...props }) {
  return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />;
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}) {
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-[var(--r-sm)] px-[10px] h-[36px] text-[14px] leading-[20px] font-medium outline-hidden select-none font-sans antialiased",
        "text-[var(--text-primary)] hover:bg-[var(--overlay-5)] focus:bg-[var(--overlay-5)] data-[state=open]:bg-[var(--overlay-5)]",
        "data-[inset]:pl-8",
        className
      )}
      {...props}
    >
      {children}
      <Icon name="chevron_right" size={14} className="ml-auto text-[var(--text-secondary)]" />
    </ContextMenuPrimitive.SubTrigger>
  );
}

function ContextMenuSubContent({
  className,
  style,
  ...props
}) {
  return (
    <ContextMenuPrimitive.SubContent
      data-slot="context-menu-sub-content"
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

function ContextMenuContent({
  className,
  style,
  ...props
}) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
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
    </ContextMenuPrimitive.Portal>
  );
}

function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-[var(--r-sm)] px-[10px] h-[36px] text-[14px] leading-[20px] font-medium outline-hidden select-none font-sans antialiased transition-colors duration-150",
        "text-[var(--text-primary)] hover:bg-[var(--overlay-5)] focus:bg-[var(--overlay-5)] active:bg-[var(--overlay-10)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[inset]:pl-8",
        (variant === "danger" || variant === "destructive") && "!text-[var(--pink-400)] hover:!text-[var(--pink-400)] [&_svg]:!text-[var(--pink-400)]",
        className
      )}
      {...props}
    />
  );
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-[var(--r-sm)] px-[10px] pl-8 h-[36px] text-[14px] leading-[20px] font-medium outline-hidden select-none text-[var(--text-primary)] hover:bg-[var(--overlay-5)] focus:bg-[var(--overlay-5)] data-[disabled]:opacity-40",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2.5 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <Icon name="check" size={14} className="text-[var(--brand)] font-bold" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}

function ContextMenuRadioItem({
  className,
  children,
  ...props
}) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-[var(--r-sm)] px-[10px] pl-8 h-[36px] text-[14px] leading-[20px] font-medium outline-hidden select-none text-[var(--text-primary)] hover:bg-[var(--overlay-5)] focus:bg-[var(--overlay-5)] data-[disabled]:opacity-40",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2.5 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <Icon name="circle" size={8} className="fill-[var(--brand)] text-[var(--brand)]" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}) {
  return (
    <ContextMenuPrimitive.Label
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn(
        "px-[10px] py-1.5 text-[12px] leading-[16px] font-medium text-[var(--text-tertiary)] data-[inset]:pl-8",
        className
      )}
      {...props}
    />
  );
}

function ContextMenuSeparator({
  className,
  ...props
}) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("h-px my-1 bg-[var(--border-subtle)]", className)}
      {...props}
    />
  );
}

function ContextMenuShortcut({
  className,
  ...props
}) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-[var(--text-tertiary)]", className)}
      {...props}
    />
  );
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
export default ContextMenu;