"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
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
        "flex items-center justify-between text-white transition-colors outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        variant === "pill"
          ? "h-9.5 w-[200px] rounded-full bg-white/10 pl-5 pr-4 text-base font-medium hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70"
          : "h-9.5 px-3.5 rounded-sm bg-white/10 text-sm font-medium hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/70",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <GoogleIcon iconName="keyboard_arrow_down" className="text-base text-white/50 shrink-0 ml-2" />
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
          "relative z-50 flex flex-col overflow-y-auto select-none font-sans antialiased",
          "min-w-30 max-h-96 rounded-2xl p-1.5",
          "bg-[#242426]/95 backdrop-blur-2xl border border-white/10 text-white shadow-xl",
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
}

function SelectLabel({ className, ...props }) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-2.5 py-1.5 text-xs font-semibold text-white/50 uppercase tracking-wider", className)}
      {...props}
    />
  );
}

function SelectItem({ className, children, icon, subtitle, badge, ...props }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "group flex cursor-pointer items-center gap-2.5 h-[36px] px-2.5 rounded-xl outline-none select-none font-sans antialiased transition-colors text-white hover:bg-white/20 focus:bg-white/20 data-[highlighted]:bg-white/20",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="shrink-0 flex items-center justify-center text-lg text-white/70">
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
          <span className="text-xs font-normal text-white/50 truncate">
            {subtitle}
          </span>
        )}
      </div>

      <span className="shrink-0 flex size-4 items-center justify-center text-white">
        <SelectPrimitive.ItemIndicator>
          <GoogleIcon iconName="check" className="text-sm font-bold" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({ className, ...props }) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1.5 h-px bg-white/10", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1 text-white/50", className)}
      {...props}
    >
      <GoogleIcon iconName="keyboard_arrow_up" className="text-base" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1 text-white/50", className)}
      {...props}
    >
      <GoogleIcon iconName="keyboard_arrow_down" className="text-base" />
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