"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import {
  MENU_LABEL_CLASS,
  MENU_SEPARATOR_CLASS,
  MenuCheckIcon,
  MenuItemContent,
  menuItemClassName,
  menuPanelClassName,
} from "@/components/base/menu";
import { cn } from "@/shared/lib/utils";

function Select({ ...props }) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({ ...props }) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({ ...props }) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

const SelectTrigger = React.forwardRef(function SelectTrigger(
  { className, size = "default", variant = "default", asChild = false, children, ...props },
  ref
) {
  const isOutline = variant === "outline";
  const isPill = variant === "pill";
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      data-slot="select-trigger"
      asChild={asChild}
      data-size={size}
      data-variant={variant}
      className={cn(
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-workspace",
        isOutline
          ? "ds-btn-outline inline-flex items-center justify-between w-auto h-7 px-2.5 ds-type-small"
          : isPill
            ? "ds-select-trigger"
            : "ds-select-trigger w-auto px-2.5 rounded-subtle",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <HugeIcon name="arrow-down-01" className="text-icon-secondary shrink-0 ml-2" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef(function SelectContent(
  {
    className,
    children,
    variant = "listbox",
    position = "popper",
    align = "center",
    side = "bottom",
    sideOffset = 4,
    ...props
  },
  ref
) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        data-slot="select-content"
        data-variant={variant}
        className={menuPanelClassName({
          variant,
          className: cn(
            "relative max-h-96 select-none",
            position === "popper" &&
              "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
            className
          ),
        })}
        position={position}
        align={align}
        side={side}
        sideOffset={sideOffset}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "flex flex-col gap-0.5 p-0.5",
            position === "popper" &&
              "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      data-slot="select-label"
      className={cn(MENU_LABEL_CLASS, className)}
      {...props}
    />
  );
});
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef(function SelectItem(
  { className, children, icon, subtitle, badge, ...props },
  ref
) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      data-slot="select-item"
      className={menuItemClassName({ className })}
      {...props}
    >
      <MenuItemContent
        icon={icon}
        subtitle={subtitle}
        badge={badge}
        labelWrapper={(node) => <SelectPrimitive.ItemText>{node}</SelectPrimitive.ItemText>}
        trailing={
          <span className="ml-auto shrink-0 flex size-4 items-center justify-center text-text-primary">
            <SelectPrimitive.ItemIndicator>
              <MenuCheckIcon />
            </SelectPrimitive.ItemIndicator>
          </span>
        }
      >
        {children}
      </MenuItemContent>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef(function SelectSeparator({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      data-slot="select-separator"
      className={cn(MENU_SEPARATOR_CLASS, className)}
      {...props}
    />
  );
});
SelectSeparator.displayName = "SelectSeparator";

const SelectScrollUpButton = React.forwardRef(function SelectScrollUpButton({ className, ...props }, ref) {
  return (
    <SelectPrimitive.ScrollUpButton
      ref={ref}
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1 text-icon-secondary", className)}
      {...props}
    >
      <HugeIcon name="arrow-up-01" size="sm" />
    </SelectPrimitive.ScrollUpButton>
  );
});
SelectScrollUpButton.displayName = "SelectScrollUpButton";

const SelectScrollDownButton = React.forwardRef(function SelectScrollDownButton({ className, ...props }, ref) {
  return (
    <SelectPrimitive.ScrollDownButton
      ref={ref}
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1 text-icon-secondary", className)}
      {...props}
    >
      <HugeIcon name="arrow-down-01" size="sm" />
    </SelectPrimitive.ScrollDownButton>
  );
});
SelectScrollDownButton.displayName = "SelectScrollDownButton";

function PillSelect({
  value,
  onValueChange,
  placeholder,
  children,
  className,
  ...props
}) {
  return (
    <Select value={value} onValueChange={onValueChange} {...props}>
      <SelectTrigger variant="pill" className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );
}

export {
  PillSelect,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
