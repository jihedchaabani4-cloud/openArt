"use client";

import * as React from "react";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils";

export const MENU_ANIMATION_CLASS =
  "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";

export const MENU_LABEL_CLASS =
  "px-2 py-1 ds-text-caption-s font-medium text-text-secondary data-[inset]:pl-8";

export const MENU_PANEL_DEFAULT_WIDTH = "w-56";

export const MENU_SEPARATOR_CLASS =
  "pointer-events-none m-0 h-px w-full shrink-0 bg-border-menu-subtle";

export const MENU_SHORTCUT_CLASS =
  "ml-auto ds-text-caption-s tracking-widest text-text-secondary font-mono";

export const MENU_INDICATOR_SLOT_CLASS =
  "pointer-events-none absolute left-2 flex size-4 items-center justify-center text-text-primary";

export function menuPanelClassName({ variant = "glass", className } = {}) {
  const surfaceClass =
    variant === "listbox" ? "surface-listbox" : "surface-glass";

  return cn(
    "z-50 min-w-48 rounded-xl overflow-x-hidden overflow-y-auto bg-surface-menu-glass p-1.5 flex flex-col gap-0.5 font-sans antialiased text-text-primary outline-none",
    surfaceClass,
    MENU_ANIMATION_CLASS,
    className
  );
}

export function menuItemClassName({
  inset,
  selected,
  hasIndicator,
  className,
} = {}) {
  return cn(
    "ds-menu-item ds-text-caption-m font-normal group relative flex cursor-pointer items-center gap-2 rounded-lg text-text-primary font-sans antialiased outline-none select-none transition-colors",
    "hover:bg-surface-tonal-hover focus:bg-surface-tonal-hover data-[highlighted]:bg-surface-tonal-hover data-[state=open]:bg-surface-tonal-hover",
    "data-[selected=true]:bg-surface-tonal-hover-strong aria-selected:bg-surface-tonal-hover-strong",
    selected && "bg-surface-tonal-hover-strong",
    "[&_svg:not([class*='text-'])]:text-icon-primary [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_.huge-icon:not([class*='text-'])]:text-icon-primary",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[inset]:pl-8",
    inset && "pl-8",
    hasIndicator && "pl-8",
    "data-[variant=destructive]:!text-error data-[variant=destructive]:hover:!text-error data-[variant=destructive]:focus:!text-error data-[variant=destructive]:hover:bg-surface-tonal-hover data-[variant=destructive]:focus:bg-surface-tonal-hover data-[variant=destructive]:data-[highlighted]:bg-surface-tonal-hover data-[variant=destructive]:[&_svg]:!text-error data-[variant=destructive]:[&_.huge-icon]:!text-error",
    className
  );
}

export function renderMenuIcon(icon, { iconClassName } = {}) {
  if (!icon) return null;
  if (typeof icon === "string") {
    return (
      <HugeIcon
        name={icon}
        className={cn("shrink-0", iconClassName)}
      />
    );
  }
  if (React.isValidElement(icon)) {
    return icon;
  }
  if (
    typeof icon === "function" ||
    (typeof icon === "object" &&
      icon !== null &&
      ("$$typeof" in icon || "render" in icon))
  ) {
    const IconComponent = icon;
    return <IconComponent className={cn("size-4 shrink-0", iconClassName)} />;
  }
  return null;
}

export function MenuCheckIcon({ className }) {
  return (
    <HugeIcon
      name="tick-02"
      size="sm"
      className={cn("font-bold text-icon-primary", className)}
    />
  );
}

export function MenuRadioDotIcon({ className }) {
  return (
    <HugeIcon
      name="circle"
      size="xs"
      className={cn("text-icon-primary", className)}
    />
  );
}

export function MenuSubChevronIcon({ className }) {
  return (
    <HugeIcon
      name="arrow-right-01"
      size="sm"
      className={cn("ml-auto text-icon-primary shrink-0", className)}
    />
  );
}

export function MenuItemContent({
  icon,
  iconClassName,
  fill,
  swatchClassName,
  children,
  subtitle,
  badge,
  shortcut,
  checked,
  trailing,
  labelWrapper,
}) {
  const labelNode = <span className="truncate">{children}</span>;

  return (
    <>
      {swatchClassName && (
        <span className={cn("size-3 rounded-full shrink-0", swatchClassName)} />
      )}
      {icon && (
        <span className="shrink-0 flex size-4 items-center justify-center">
          {renderMenuIcon(icon, { iconClassName, fill })}
        </span>
      )}
      <span className="min-w-0 flex-1 flex flex-col overflow-hidden">
        <span className="flex items-center gap-1.5 min-w-0">
          {labelWrapper ? labelWrapper(labelNode) : labelNode}
          {badge && <span className="shrink-0">{badge}</span>}
        </span>
        {subtitle && (
          <span className="ds-text-caption-s font-normal text-text-secondary truncate">
            {subtitle}
          </span>
        )}
      </span>
      {shortcut && <span className={MENU_SHORTCUT_CLASS}>{shortcut}</span>}
      {trailing !== undefined ? (
        trailing != null && trailing !== false ? (
          <span className="ml-auto shrink-0 flex items-center">{trailing}</span>
        ) : null
      ) : checked ? (
        <span className="ml-auto shrink-0 flex size-4 items-center justify-center text-text-primary">
          <MenuCheckIcon />
        </span>
      ) : null}
    </>
  );
}

export function isSeparatorItem(item) {
  return Boolean(
    item &&
      (item.type === "separator" ||
        item.key === "separator" ||
        item.key?.startsWith("sep-"))
  );
}

export function filterActiveMenuItems(items = []) {
  if (!items || !items.length) return [];
  const filtered = items.filter(
    (m) => m && (isSeparatorItem(m) || !m.disabled)
  );
  const result = [];
  for (let i = 0; i < filtered.length; i++) {
    const curr = filtered[i];
    if (isSeparatorItem(curr)) {
      if (result.length === 0) continue;
      const prev = result[result.length - 1];
      if (isSeparatorItem(prev)) continue;
    }
    result.push(curr);
  }
  if (result.length > 0 && isSeparatorItem(result[result.length - 1])) {
    result.pop();
  }
  return result;
}

export function MenuItemsList({ items = [], components, onClose }) {
  const { Item, Separator, Sub, SubTrigger, SubContent } = components;

  return items.map((m, i) => {
    if (isSeparatorItem(m)) {
      return <Separator key={m.key || `sep-${i}`} />;
    }

    if (m.subItems && m.subItems.length > 0) {
      return (
        <Sub key={m.key || m.id || i}>
          <SubTrigger variant={m.variant}>
            <MenuItemContent
              icon={m.icon}
              iconClassName={m.iconClassName}
              fill={m.fill}
            >
              {m.label}
            </MenuItemContent>
          </SubTrigger>
          <SubContent>
            {m.subItems.map((sub, j) => {
              if (isSeparatorItem(sub)) {
                return <Separator key={sub.key || `sub-sep-${j}`} />;
              }
              return (
                <Item
                  key={sub.key || sub.id || j}
                  variant={sub.variant}
                  disabled={sub.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (sub.disabled) return;
                    onClose?.();
                    sub.onClick?.(e);
                  }}
                >
                  <MenuItemContent
                    swatchClassName={sub.bgClass}
                    icon={sub.icon}
                    iconClassName={sub.iconClassName}
                    fill={sub.fill}
                    checked={sub.checked}
                  >
                    {sub.label}
                  </MenuItemContent>
                </Item>
              );
            })}
          </SubContent>
        </Sub>
      );
    }

    return (
      <Item
        key={m.key || m.id || i}
        variant={m.variant}
        disabled={m.disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (m.disabled) return;
          onClose?.();
          m.onClick?.(e);
        }}
      >
        <MenuItemContent
          icon={m.icon}
          iconClassName={m.iconClassName}
          fill={m.fill}
          checked={m.checked}
        >
          {m.label}
        </MenuItemContent>
      </Item>
    );
  });
}
