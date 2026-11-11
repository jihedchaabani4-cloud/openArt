"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Icon } from "@/shared/ui/Icon";
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

function SelectTrigger({ className, size = "default", variant = "default", asChild = false, children, ...props }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      asChild={asChild}
      data-size={size}
      data-variant={variant}
      className={cn(
        "flex items-center justify-between rounded-[var(--r-sm)] font-medium text-sm transition-colors outline-none cursor-pointer select-none",
        variant === "blur"
          ? "w-full h-9 px-3 bg-[var(--bg-surface-2)] text-[var(--text-primary)] border border-[var(--border-default)] hover:border-[var(--border-subtle)] focus:border-[var(--brand)]"
          : "w-auto max-w-fit px-3 py-2 bg-[var(--bg-surface-2)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--overlay-5)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <Icon name="keyboard_arrow_down" size={16} className="text-[var(--text-tertiary)] shrink-0 ml-2" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  side = "bottom",
  sideOffset = 4,
  ...props
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-[100] flex flex-col overflow-y-auto select-none font-sans antialiased min-w-[140px] max-h-96",
          "rounded-[var(--r-lg)] p-1 bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)]",
          "shadow-[0_16px_32px_rgba(0,0,0,0.40),0_4px_8px_rgba(0,0,0,0.24)]",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
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
        <SelectPrimitive.Viewport className="p-0.5">
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-[10px] py-1.5 text-[12px] leading-[16px] font-medium text-[var(--text-tertiary)]",
        className
      )}
      {...props}
    />
  );
}

function SelectItem({ className, children, icon, subtitle, badge, iconVariant = "standard", ...props }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "group flex cursor-pointer items-center gap-2 h-[36px] px-[10px] rounded-[var(--r-sm)] outline-none select-none font-sans antialiased transition-colors duration-150",
        "text-[var(--text-primary)] hover:bg-[var(--overlay-5)] focus:bg-[var(--overlay-5)] data-[highlighted]:bg-[var(--overlay-5)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="shrink-0 flex items-center justify-center text-base text-[var(--text-secondary)]">
          {renderIconNode(icon)}
        </span>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-1.5">
          <SelectPrimitive.ItemText>
            <span className="text-[14px] leading-[20px] font-medium truncate">
              {children}
            </span>
          </SelectPrimitive.ItemText>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {subtitle && (
          <span className="text-[12px] leading-[16px] text-[var(--text-tertiary)] truncate">
            {subtitle}
          </span>
        )}
      </div>

      <span className="shrink-0 flex size-4 items-center justify-center text-[var(--brand)]">
        <SelectPrimitive.ItemIndicator>
          <Icon name="check" size={14} className="font-bold text-[var(--brand)]" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-[var(--border-subtle)]", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1 text-[var(--text-tertiary)]", className)}
      {...props}
    >
      <Icon name="keyboard_arrow_up" size={16} />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1 text-[var(--text-tertiary)]", className)}
      {...props}
    >
      <Icon name="keyboard_arrow_down" size={16} />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
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
export default Select;