import * as React from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/shared/ui/context-menu";
import { ActionBtn } from "./ActionBtn";

/**
 * Universal Dropdown Menu for Studio Media Items.
 * Accepts a list of items configured with labels, icons, onClick handlers, etc.
 */
export function StudioItemDropdownMenu({
  items = [],
  open,
  onOpenChange,
  trigger,
  align = "end",
  className = "w-64",
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <ActionBtn onClick={(e) => e.stopPropagation()} title="More options">
            <GoogleIcon iconName="more_vert" className="text-[13px] text-[#303031]" />
          </ActionBtn>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn("p-2", className)}>
        {items.map((m, i) => {
          if (m.key === "separator" || m.type === "separator") {
            return <DropdownMenuSeparator key={m.key || `sep-${i}`} className="my-1.5" />;
          }
          return (
            <DropdownMenuItem
              key={m.key || i}
              variant={m.variant}
              disabled={m.disabled}
              onClick={(e) => {
                e.stopPropagation();
                if (m.disabled) return;
                if (onOpenChange) onOpenChange(false);
                m.onClick?.(e);
              }}
              className="flex items-center gap-3 cursor-pointer mat-mdc-menu-item flow-internal-menu-item"
            >
              {m.icon && (
                <GoogleIcon
                  iconName={m.icon}
                  className={cn("text-[20px] shrink-0", m.iconClassName)}
                  fill={m.fill}
                />
              )}
              <span className="item-text min-w-0 flex-1 truncate">
                <span className="label font-medium">{m.label}</span>
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Universal Context Menu Content for Studio Media Items.
 * Renders the same items list inside a ContextMenu.
 */
export function StudioContextMenuContent({
  items = [],
  className = "w-64",
}) {
  return (
    <ContextMenuContent className={cn("p-2", className)}>
      {items.map((m, i) => {
        if (m.key === "separator" || m.type === "separator") {
          return <ContextMenuSeparator key={m.key || `ctx-sep-${i}`} className="my-1.5" />;
        }
        return (
          <ContextMenuItem
            key={m.key || i}
            variant={m.variant}
            disabled={m.disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (m.disabled) return;
              m.onClick?.(e);
            }}
            className="flex items-center gap-3 cursor-pointer mat-mdc-menu-item flow-internal-menu-item"
          >
            {m.icon && (
              <GoogleIcon
                iconName={m.icon}
                className={cn("text-[20px] shrink-0", m.iconClassName)}
                fill={m.fill}
              />
            )}
            <span className="item-text min-w-0 flex-1 truncate">
              <span className="label font-medium">{m.label}</span>
            </span>
          </ContextMenuItem>
        );
      })}
    </ContextMenuContent>
  );
}
