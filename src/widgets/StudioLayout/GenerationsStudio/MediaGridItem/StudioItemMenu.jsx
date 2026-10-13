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
  className = "w-52",
}) {
  if (!items || items.length === 0) {
    return (
      trigger || (
        <ActionBtn onClick={(e) => e.stopPropagation()} title="More options">
          <GoogleIcon iconName="more_vert" className="text-[13px] text-[#303031]" />
        </ActionBtn>
      )
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <ActionBtn onClick={(e) => e.stopPropagation()} title="More options">
            <GoogleIcon iconName="more_vert" className="text-[13px] text-[#303031]" />
          </ActionBtn>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn("p-1.5 min-w-[12rem] w-52 flow-menu-panel mat-mdc-menu-panel", className)}>
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
              className={cn(
                "cursor-pointer mat-mdc-menu-item flow-internal-menu-item",
                m.variant === "destructive" && "delete-button"
              )}
            >
              <span className="mat-mdc-menu-item-text">
                <span className="left-content">
                  {m.icon && (
                    typeof m.icon === "string" ? (
                      <GoogleIcon
                        iconName={m.icon}
                        className={cn("text-[20px] shrink-0 mat-icon google-symbols", m.iconClassName)}
                        fill={m.fill}
                      />
                    ) : (
                      m.icon
                    )
                  )}
                  <span className="item-text min-w-0 flex-1 truncate">
                    <span className="label font-medium">{m.label}</span>
                  </span>
                </span>
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
  className = "w-52",
}) {
  return (
    <ContextMenuContent className={cn("p-1.5 min-w-[12rem] w-52 flow-menu-panel mat-mdc-menu-panel", className)}>
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
            className={cn(
              "cursor-pointer mat-mdc-menu-item flow-internal-menu-item",
              m.variant === "destructive" && "delete-button"
            )}
          >
            <span className="mat-mdc-menu-item-text">
              <span className="left-content">
                {m.icon && (
                  typeof m.icon === "string" ? (
                    <GoogleIcon
                      iconName={m.icon}
                      className={cn("text-[20px] shrink-0 mat-icon google-symbols", m.iconClassName)}
                      fill={m.fill}
                    />
                  ) : (
                    m.icon
                  )
                )}
                <span className="item-text min-w-0 flex-1 truncate">
                  <span className="label font-medium">{m.label}</span>
                </span>
              </span>
            </span>
          </ContextMenuItem>
        );
      })}
    </ContextMenuContent>
  );
}
