"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { GoogleIcon } from "@/components/primitives/GoogleIcon";
import { cn } from "@/shared/lib/utils";

function renderIconNode(IconCandidate, props = {}) {
  if (!IconCandidate) return null;
  if (React.isValidElement(IconCandidate)) {
    return IconCandidate;
  }
  if (
    typeof IconCandidate === "function" ||
    (typeof IconCandidate === "object" && IconCandidate !== null && ("$$typeof" in IconCandidate || "render" in IconCandidate))
  ) {
    const Component = IconCandidate;
    return <Component {...props} />;
  }
  if (typeof IconCandidate === "string" || typeof IconCandidate === "number") {
    return IconCandidate;
  }
  return null;
}

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
          ? "ds-btn-outline inline-flex items-center justify-between w-auto h-[50px] px-3.5 text-sm"
          : isPill
            ? "ds-select-trigger h-[50px]"
            : "ds-select-trigger w-auto h-[50px] px-3.5 rounded-sm text-sm",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <GoogleIcon iconName="keyboard_arrow_down" className="text-base text-icon-secondary shrink-0 ml-2" />
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
  const isGlass = variant === "glass";
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        data-slot="select-content"
        data-variant={variant}
        className={cn(
          "relative z-50 flex flex-col overflow-y-auto select-none font-sans antialiased",
          "min-w-30 max-h-96 rounded-[var(--radius-3xl)] bg-ui-menu-background p-2 [--blur:40px] shadow-xl",
          isGlass ? "surface-glass" : "surface-listbox",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        side={side}
        sideOffset={sideOffset}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-0.5",
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
      className={cn("px-2.5 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider", className)}
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
      className={cn(
        "ds-menu-item group gap-2.5 cursor-pointer outline-none select-none focus:bg-ui-button-active data-[highlighted]:bg-ui-button-active",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="shrink-0 flex items-center justify-center text-lg text-text-body-muted">
          {renderIconNode(icon)}
        </span>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-1.5">
          <SelectPrimitive.ItemText>
            <span className="text-sm font-medium leading-5 capitalize truncate">
              {children}
            </span>
          </SelectPrimitive.ItemText>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {subtitle && (
          <span className="text-xs font-normal text-text-secondary truncate">
            {subtitle}
          </span>
        )}
      </div>

      <span className="shrink-0 flex size-4 items-center justify-center text-text-primary">
        <SelectPrimitive.ItemIndicator>
          <GoogleIcon iconName="check" className="text-sm font-bold" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef(function SelectSeparator({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1.5 h-px bg-border-weak", className)}
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
      <GoogleIcon iconName="keyboard_arrow_up" className="text-base" />
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
      <GoogleIcon iconName="keyboard_arrow_down" className="text-base" />
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