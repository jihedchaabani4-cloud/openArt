"use client";

import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { GoogleIcon } from "@/components/primitives/GoogleIcon";
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
    sideOffset = 4,
    style,
    ...props
  },
  ref
) {
  const isListbox = variant === "listbox";
  const isNormal = variant === "normal";
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        data-slot="dropdown-menu-content"
        data-variant={variant}
        sideOffset={sideOffset}
        style={style}
        className={cn(
          "z-50 max-h-(--radix-dropdown-menu-content-available-height) w-52 min-w-[12rem] rounded-2xl origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto p-1.5 flex flex-col gap-0.5",
          isNormal
            ? "bg-[color:var(--ui-menu-background)]/30 backdrop-blur-2xl border border-white/10 shadow-none text-white font-sans antialiased"
            : isListbox
              ? "surface-listbox shadow-xl"
              : "surface-glass shadow-xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
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
    variant = "ghost",
    ...props
  },
  ref
) {
  const isGhost = variant === "ghost" || variant === "default";
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "ds-menu-item relative gap-2.5 cursor-pointer outline-none select-none rounded-xl text-white font-medium text-sm transition-colors",
        isGhost && "hover:bg-white/10 focus:bg-white/10 hover:bg-[color:var(--surface-tonal)] focus:bg-[color:var(--surface-tonal)]",
        "[&_svg:not([class*='text-'])]:text-white/70 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8",
        "data-[variant=ghost]:hover:bg-white/10 data-[variant=ghost]:focus:bg-white/10 data-[variant=ghost]:hover:bg-[color:var(--surface-tonal)] data-[variant=ghost]:focus:bg-[color:var(--surface-tonal)]",
        "data-[variant=destructive]:!text-error data-[variant=destructive]:hover:bg-white/10 data-[variant=destructive]:focus:bg-white/10 data-[variant=destructive]:hover:bg-[color:var(--surface-tonal)] data-[variant=destructive]:focus:bg-[color:var(--surface-tonal)] data-[variant=destructive]:[&_svg]:!text-error",
        "data-[variant=danger]:!text-error data-[variant=danger]:hover:bg-white/10 data-[variant=danger]:focus:bg-white/10 data-[variant=danger]:hover:bg-[color:var(--surface-tonal)] data-[variant=danger]:focus:bg-[color:var(--surface-tonal)] data-[variant=danger]:[&_svg]:!text-error",
        className
      )}
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
      className={cn(
        "relative flex cursor-pointer items-center gap-2 h-[36px] pr-2.5 pl-8 rounded-xl text-sm font-medium outline-none select-none text-white hover:bg-white/10 focus:bg-white/10 hover:bg-[color:var(--surface-tonal)] focus:bg-[color:var(--surface-tonal)] transition-colors",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2.5 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <GoogleIcon iconName="check" className="text-sm font-bold text-white" />
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
      className={cn(
        "relative flex cursor-pointer items-center gap-2 h-[36px] pr-2.5 pl-8 rounded-xl text-sm font-medium outline-none select-none text-white hover:bg-white/10 focus:bg-white/10 hover:bg-[color:var(--surface-tonal)] focus:bg-[color:var(--surface-tonal)] transition-colors",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2.5 flex size-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <GoogleIcon iconName="circle" fill={true} className="text-xs text-white" />
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
      className={cn("px-2.5 py-1.5 text-xs font-semibold text-white/50 uppercase tracking-wider data-[inset]:pl-8", className)}
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
      className={cn("-mx-1 my-1.5 h-px bg-white/10", className)}
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
      className={cn("ml-auto text-xs tracking-widest text-white/50 font-mono", className)}
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
      className={cn(
        "flex cursor-pointer items-center gap-2.5 h-[36px] px-2.5 rounded-xl text-sm font-medium outline-none select-none font-sans text-white hover:bg-white/10 focus:bg-white/10 hover:bg-[color:var(--surface-tonal)] focus:bg-[color:var(--surface-tonal)] data-[state=open]:bg-white/10 data-[state=open]:bg-[color:var(--surface-tonal)] transition-colors",
        "data-[inset]:pl-8",
        className
      )}
      {...props}
    >
      {children}
      <GoogleIcon iconName="chevron_right" className="ml-auto text-base text-white/50" />
    </DropdownMenuPrimitive.SubTrigger>
  );
});
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = React.forwardRef(function DropdownMenuSubContent(
  {
    className,
    variant = "normal",
    style,
    ...props
  },
  ref
) {
  const isListbox = variant === "listbox";
  const isGlass = variant === "glass";
  const isNormal = variant === "normal" || (!isListbox && !isGlass);
  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      data-slot="dropdown-menu-sub-content"
      data-variant={variant}
      style={style}
      className={cn(
        "z-50 w-52 min-w-[12rem] rounded-2xl origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden p-1.5 flex flex-col gap-0.5 font-sans antialiased text-white border border-white/10",
        isNormal
          ? "bg-[color:var(--ui-menu-background)]/30 backdrop-blur-2xl shadow-none"
          : isListbox
            ? "surface-listbox shadow-xl"
            : "surface-glass shadow-xl",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
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