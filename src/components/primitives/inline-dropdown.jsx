"use client";

import * as React from "react";
import { Collapsible, CollapsibleContent } from "@/components/primitives/collapsible";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils";

/**
 * InlineDropdown — Inline-expanding sidebar switcher card variation.
 * Expands inside the sidebar flow (pushing items below smoothly) instead of floating over content,
 * with a nested active header pill and `unfold-more` / `unfold-less` indicator.
 */
export function InlineDropdown({
  open,
  onOpenChange,
  trigger,
  trailing,
  children,
  className,
  headerClassName,
  contentClassName,
  ...props
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isOpen = open !== undefined ? open : uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setOpen}
      data-slot="inline-dropdown"
      data-state={isOpen ? "open" : "closed"}
      className={cn(
        "w-full rounded-xl border border-border-menu-subtle bg-surface-card overflow-hidden transition-colors",
        className
      )}
      {...props}
    >
      <div
        data-slot="inline-dropdown-header"
        className={cn(
          "flex items-center justify-between gap-1.5 w-full min-h-[36px] px-2 py-1 transition-colors",
          isOpen
            ? "rounded-xl bg-surface-tonal hover:bg-surface-tonal-hover shadow-xs"
            : "hover:bg-surface-tonal-hover",
          headerClassName
        )}
      >
        {trigger({
          open: isOpen,
          toggle: () => setOpen(!isOpen),
          chevron: (
            <HugeIcon
              name={isOpen ? "unfold-less" : "unfold-more"}
              size="xs"
              className="text-icon-secondary shrink-0"
            />
          ),
        })}
        {trailing}
      </div>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div
          data-slot="inline-dropdown-content"
          className={cn(
            "flex flex-col gap-0.5 p-1 max-h-52 overflow-y-auto custom-scrollbar",
            contentClassName
          )}
        >
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const InlineDropdownItem = React.forwardRef(function InlineDropdownItem(
  {
    icon,
    children,
    active = false,
    className,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      data-slot="inline-dropdown-item"
      data-active={active ? "true" : undefined}
      className={cn(
        "flex items-center gap-2 w-full min-h-[32px] px-2 py-1.5 rounded-lg text-left cursor-pointer transition-colors",
        "font-sans ds-text-caption-l font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-heavy",
        active
          ? "bg-surface-tonal text-text-primary hover:bg-surface-tonal-hover"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-tonal-hover",
        className
      )}
      {...props}
    >
      {icon && (
        <span className="relative size-5 flex items-center justify-center shrink-0 text-icon-secondary">
          {typeof icon === "string" ? <HugeIcon name={icon} /> : icon}
        </span>
      )}
      <span className="truncate flex-1">{children}</span>
    </button>
  );
});
