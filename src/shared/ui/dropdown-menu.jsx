"use client"

import * as React from "react"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "@/shared/lib/utils"

function DropdownMenu({
  ...props
}) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}) {
  return (<DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />);
}

function DropdownMenuTrigger({
  ...props
}) {
  return (<DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />);
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
        style={{
          backgroundColor: "var(--mat-menu-container-color, rgba(22, 23, 24, 0.9))",
          backdropFilter: "blur(100px) saturate(190%) contrast(105%)",
          WebkitBackdropFilter: "blur(100px) saturate(190%) contrast(105%)",
          boxShadow: "var(--mat-menu-container-elevation-shadow, 0 16px 32px -8px rgba(0, 0, 0, 0.4))",
          borderRadius: "var(--mat-menu-container-shape, 24px)",
          border: "none",
          color: "var(--mat-sys-on-surface, #e3e3e3)",
          ...style,
        }}
        className={cn(
          "z-50 max-h-(--radix-dropdown-menu-content-available-height) w-52 min-w-[12rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto p-1.5 flex flex-col gap-0.5 font-sans antialiased",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props} />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}) {
  return (<DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />);
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
        // Layout
        "relative flex cursor-pointer items-center gap-3 rounded-[var(--mat-sys-corner-medium,12px)] px-3 py-2 min-h-[48px] text-[14px] leading-5 font-medium outline-hidden select-none font-sans antialiased",
        // Theme defaults: on-surface text, state layers for hover/focus/active
        "text-[var(--mat-menu-item-label-text-color,var(--foreground-neutral-000,#fff))] hover:text-white hover:bg-[var(--mat-menu-item-hover-state-layer-color,var(--foreground-state-10))] focus:bg-[var(--mat-menu-item-focus-state-layer-color,var(--foreground-state-15))] focus:text-white active:bg-[var(--foreground-state-25)] transition-all duration-150",
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
        "relative flex cursor-pointer items-center gap-2 rounded-sm py-2.5 pr-2 pl-8 text-sm outline-hidden select-none",
        "text-white hover:bg-white/10 focus:bg-white/10 focus:text-white",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      checked={checked}
      {...props}>
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <GoogleIcon iconName="check" className="text-[12px]" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}) {
  return (<DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />);
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
        "relative flex cursor-pointer items-center gap-2 rounded-sm py-2.5 pr-2 pl-8 text-sm outline-hidden select-none",
        "text-white hover:bg-white/10 focus:bg-white/10 focus:text-white",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}>
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <GoogleIcon iconName="circle" fill className="text-[8px]" />
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
        "px-2 py-1.5 text-xs font-medium text-white/50 data-[inset]:pl-8",
        className
      )}
      {...props} />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1.5 h-px bg-[var(--mat-menu-divider-color,var(--foreground-state-15))]", className)}
      {...props} />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("ml-auto text-xs tracking-widest text-white/40", className)}
      {...props} />
  );
}

function DropdownMenuSub({
  ...props
}) {
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
        "flex cursor-pointer items-center gap-3 rounded-[var(--mat-sys-corner-medium,12px)] px-3 py-2 min-h-[48px] text-[14px] leading-5 font-medium outline-hidden select-none font-sans antialiased",
        "text-[var(--mat-menu-item-label-text-color,var(--foreground-neutral-000,#fff))] hover:bg-[var(--mat-menu-item-hover-state-layer-color,var(--foreground-state-10))] hover:text-white focus:bg-[var(--mat-menu-item-focus-state-layer-color,var(--foreground-state-15))] focus:text-white",
        "data-[state=open]:bg-[var(--foreground-state-15)] data-[state=open]:text-white transition-all duration-150",
        "[&_svg:not([class*='text-'])]:text-white/70 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        "data-[inset]:pl-8",
        className
      )}
      {...props}>
      {children}
      <GoogleIcon iconName="chevron_right" className="ml-auto text-[18px] text-[var(--foreground-neutral-400,#bdc1c6)]" />
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
      style={{
        backgroundColor: "var(--mat-menu-container-color, rgba(22, 23, 24, 0.9))",
        backdropFilter: "blur(100px) saturate(190%) contrast(105%)",
        WebkitBackdropFilter: "blur(100px) saturate(190%) contrast(105%)",
        boxShadow: "var(--mat-menu-container-elevation-shadow, 0 16px 32px -8px rgba(0, 0, 0, 0.4))",
        borderRadius: "var(--mat-menu-container-shape, 24px)",
        border: "none",
        color: "var(--mat-sys-on-surface, #e3e3e3)",
        ...style,
      }}
      className={cn(
        "z-50 w-52 min-w-[12rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden p-1.5 flex flex-col gap-0.5 font-sans antialiased",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props} />
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
}