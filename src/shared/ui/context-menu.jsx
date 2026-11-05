"use client"

import * as React from "react"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import { ContextMenu as ContextMenuPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"

function ContextMenu({
  ...props
}) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}

function ContextMenuTrigger({
  ...props
}) {
  return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />;
}

function ContextMenuGroup({
  ...props
}) {
  return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />;
}

function ContextMenuPortal({
  ...props
}) {
  return <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />;
}

function ContextMenuSub({
  ...props
}) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />;
}

function ContextMenuRadioGroup({
  ...props
}) {
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
        "flex cursor-pointer items-center gap-3 rounded-sm pl-3 pr-4 py-2 min-h-[2.125rem] text-[14px] leading-5 font-medium outline-hidden select-none font-sans antialiased",
        "text-[var(--mat-menu-item-label-text-color,var(--foreground-neutral-000,#fff))] hover:bg-[var(--mat-menu-item-hover-state-layer-color,var(--foreground-state-10))] hover:text-white focus:bg-[var(--mat-menu-item-focus-state-layer-color,var(--foreground-state-15))] focus:text-white",
        "data-[state=open]:bg-[var(--foreground-state-15)] data-[state=open]:text-white transition-colors duration-100 ease-in-out",
        "[&_svg:not([class*='text-'])]:text-white/70 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        "data-[inset]:pl-8",
        className
      )}
      {...props}>
      {children}
      <GoogleIcon iconName="chevron_right" className="ml-auto text-[18px] text-[var(--foreground-neutral-400,#bdc1c6)]" />
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
      style={{
        backgroundColor: "var(--mat-menu-container-color, rgba(22, 23, 24, 0.9))",
        backdropFilter: "blur(100px) saturate(190%) contrast(105%)",
        WebkitBackdropFilter: "blur(100px) saturate(190%) contrast(105%)",
        boxShadow: "var(--mat-menu-container-elevation-shadow, none)",
        borderRadius: "var(--mat-menu-container-shape, 8px)",
        border: "1px solid var(--border-dark, rgba(255, 255, 255, 0.1))",
        color: "var(--mat-sys-on-surface, #e3e3e3)",
        ...style,
      }}
      className={cn(
        "z-50 w-52 min-w-[12rem] rounded-lg origin-(--radix-context-menu-content-transform-origin) overflow-hidden p-1.5 flex flex-col gap-0.5 font-sans antialiased",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props} />
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
        style={{
          backgroundColor: "var(--mat-menu-container-color, rgba(22, 23, 24, 0.9))",
          backdropFilter: "blur(100px) saturate(190%) contrast(105%)",
          WebkitBackdropFilter: "blur(100px) saturate(190%) contrast(105%)",
          boxShadow: "var(--mat-menu-container-elevation-shadow, none)",
          borderRadius: "var(--mat-menu-container-shape, 8px)",
          border: "1px solid var(--border-dark, rgba(255, 255, 255, 0.1))",
          color: "var(--mat-sys-on-surface, #e3e3e3)",
          ...style,
        }}
        className={cn(
          // Layout & shape
          "z-50 w-52 min-w-[12rem] rounded-lg overflow-hidden p-1.5 flex flex-col gap-0.5 font-sans antialiased",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props} />
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
        // Layout
        "relative flex cursor-pointer items-center gap-3 rounded-sm pl-3 pr-4 py-2 min-h-[2.125rem] text-[14px] leading-5 font-medium outline-hidden select-none font-sans antialiased",
        // Theme defaults: on-surface text, state layers for hover & focus
        "text-[var(--mat-menu-item-label-text-color,var(--foreground-neutral-000,#fff))] hover:bg-[var(--mat-menu-item-hover-state-layer-color,var(--foreground-state-10))] hover:text-white focus:bg-[var(--mat-menu-item-focus-state-layer-color,var(--foreground-state-15))] focus:text-white active:bg-[var(--foreground-state-25)] transition-colors duration-100 ease-in-out",
        // Icon defaults
        "[&_svg:not([class*='text-'])]:text-[var(--mat-menu-item-icon-color,var(--foreground-neutral-000,#fff))] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        "[&_.google-symbols]:text-[var(--mat-menu-item-icon-color,var(--foreground-neutral-000,#fff))] [&_mat-icon]:text-[var(--mat-menu-item-icon-color,var(--foreground-neutral-000,#fff))] [&_.google-symbols]:text-[20px] [&_mat-icon]:text-[20px]",
        // Disabled & inset
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8",
        // Destructive / Danger variant (pure text & icon red, NO red background, ghost hover layer)
        "data-[variant=destructive]:!text-[var(--foreground-color-danger,#fe6e6e)] data-[variant=destructive]:hover:!text-[var(--foreground-color-danger,#fe6e6e)] data-[variant=destructive]:focus:!text-[var(--foreground-color-danger,#fe6e6e)] data-[variant=destructive]:hover:bg-[var(--mat-menu-item-hover-state-layer-color,var(--foreground-state-10))] data-[variant=destructive]:focus:bg-[var(--mat-menu-item-focus-state-layer-color,var(--foreground-state-15))] data-[variant=destructive]:[&_svg]:!text-[var(--foreground-color-danger,#fe6e6e)] data-[variant=destructive]:[&_.google-symbols]:!text-[var(--foreground-color-danger,#fe6e6e)] data-[variant=destructive]:[&_mat-icon]:!text-[var(--foreground-color-danger,#fe6e6e)]",
        "data-[variant=danger]:!text-[var(--foreground-color-danger,#fe6e6e)] data-[variant=danger]:hover:!text-[var(--foreground-color-danger,#fe6e6e)] data-[variant=danger]:focus:!text-[var(--foreground-color-danger,#fe6e6e)] data-[variant=danger]:hover:bg-[var(--mat-menu-item-hover-state-layer-color,var(--foreground-state-10))] data-[variant=danger]:focus:bg-[var(--mat-menu-item-focus-state-layer-color,var(--foreground-state-15))] data-[variant=danger]:[&_svg]:!text-[var(--foreground-color-danger,#fe6e6e)] data-[variant=danger]:[&_.google-symbols]:!text-[var(--foreground-color-danger,#fe6e6e)] data-[variant=danger]:[&_mat-icon]:!text-[var(--foreground-color-danger,#fe6e6e)]",
        className
      )}
      {...props} />
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
        "relative flex cursor-pointer items-center gap-2 rounded-sm py-2.5 pr-2 pl-8 text-sm outline-hidden select-none",
        "text-white hover:bg-white/10 focus:bg-white/10 focus:text-white",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      checked={checked}
      {...props}>
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <GoogleIcon iconName="check" className="text-[12px]" />
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
        "relative flex cursor-pointer items-center gap-2 rounded-sm py-2.5 pr-2 pl-8 text-sm outline-hidden select-none",
        "text-white hover:bg-white/10 focus:bg-white/10 focus:text-white",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}>
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <GoogleIcon iconName="circle" fill className="text-[8px]" />
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
        "px-2 py-1.5 text-xs font-medium text-white/50 data-[inset]:pl-8",
        className
      )}
      {...props} />
  );
}

function ContextMenuSeparator({
  className,
  ...props
}) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("-mx-1 my-1.5 h-px bg-[var(--mat-menu-divider-color,var(--foreground-state-15))]", className)}
      {...props} />
  );
}

function ContextMenuShortcut({
  className,
  ...props
}) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-white/40", className)}
      {...props} />
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
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuRadioGroup,
}