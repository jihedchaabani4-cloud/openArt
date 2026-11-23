"use client";

import * as React from "react";
import { ContextMenu as ContextMenuPrimitive } from "radix-ui";
import {
  MENU_INDICATOR_SLOT_CLASS,
  MENU_LABEL_CLASS,
  MENU_PANEL_DEFAULT_WIDTH,
  MENU_SEPARATOR_CLASS,
  MENU_SHORTCUT_CLASS,
  MenuCheckIcon,
  MenuRadioDotIcon,
  MenuSubChevronIcon,
  menuItemClassName,
  menuPanelClassName,
} from "@/components/base/menu";
import { cn } from "@/shared/lib/utils";

const ContextMenuPositionContext = React.createContext(null);

function ContextMenu({ modal = false, ...props }) {
  const [positionKey, setPositionKey] = React.useState(0);
  const bumpPosition = React.useCallback(() => {
    setPositionKey((key) => key + 1);
  }, []);
  const positionContextValue = React.useMemo(
    () => ({ positionKey, bumpPosition }),
    [positionKey, bumpPosition]
  );

  return (
    <ContextMenuPositionContext.Provider value={positionContextValue}>
      <ContextMenuPrimitive.Root data-slot="context-menu" modal={modal} {...props} />
    </ContextMenuPositionContext.Provider>
  );
}

const ContextMenuTrigger = React.forwardRef(function ContextMenuTrigger(
  { onContextMenu, disabled, ...props },
  ref
) {
  const positionContext = React.useContext(ContextMenuPositionContext);

  const handleContextMenu = React.useCallback(
    (event) => {
      onContextMenu?.(event);
      if (!event.defaultPrevented && !disabled) {
        positionContext?.bumpPosition();
      }
    },
    [onContextMenu, disabled, positionContext]
  );

  return (
    <ContextMenuPrimitive.Trigger
      ref={ref}
      data-slot="context-menu-trigger"
      disabled={disabled}
      onContextMenu={handleContextMenu}
      {...props}
    />
  );
});
ContextMenuTrigger.displayName = "ContextMenuTrigger";

function ContextMenuGroup({ ...props }) {
  return <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />;
}

function ContextMenuPortal({ ...props }) {
  return <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />;
}

function ContextMenuSub({ ...props }) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />;
}

function ContextMenuRadioGroup({ ...props }) {
  return <ContextMenuPrimitive.RadioGroup data-slot="context-menu-radio-group" {...props} />;
}

const ContextMenuSubTrigger = React.forwardRef(function ContextMenuSubTrigger(
  {
    className,
    inset,
    variant = "default",
    children,
    ...props
  },
  ref
) {
  return (
    <ContextMenuPrimitive.SubTrigger
      ref={ref}
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      data-variant={variant}
      className={menuItemClassName({ inset, className })}
      {...props}
    >
      {children}
      <MenuSubChevronIcon />
    </ContextMenuPrimitive.SubTrigger>
  );
});
ContextMenuSubTrigger.displayName = "ContextMenuSubTrigger";

const ContextMenuSubContent = React.forwardRef(function ContextMenuSubContent(
  {
    className,
    variant = "glass",
    sideOffset = 6,
    style,
    ...props
  },
  ref
) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.SubContent
        ref={ref}
        data-slot="context-menu-sub-content"
        data-variant={variant}
        sideOffset={sideOffset}
        style={style}
        className={menuPanelClassName({
          variant,
          className: cn(
            "max-h-(--radix-context-menu-content-available-height) origin-(--radix-context-menu-content-transform-origin)",
            MENU_PANEL_DEFAULT_WIDTH,
            className
          ),
        })}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
});
ContextMenuSubContent.displayName = "ContextMenuSubContent";

const ContextMenuContent = React.forwardRef(function ContextMenuContent(
  {
    className,
    variant = "glass",
    style,
    ...props
  },
  ref
) {
  const positionContext = React.useContext(ContextMenuPositionContext);

  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        key={positionContext?.positionKey}
        ref={ref}
        data-slot="context-menu-content"
        data-variant={variant}
        style={style}
        className={menuPanelClassName({
          variant,
          className: cn(
            "max-h-(--radix-context-menu-content-available-height) origin-(--radix-context-menu-content-transform-origin)",
            MENU_PANEL_DEFAULT_WIDTH,
            className
          ),
        })}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
});
ContextMenuContent.displayName = "ContextMenuContent";

const ContextMenuItem = React.forwardRef(function ContextMenuItem(
  {
    className,
    inset,
    selected,
    variant = "default",
    ...props
  },
  ref
) {
  return (
    <ContextMenuPrimitive.Item
      ref={ref}
      data-slot="context-menu-item"
      data-inset={inset}
      data-selected={selected ? "true" : undefined}
      data-variant={variant}
      className={menuItemClassName({ inset, selected, className })}
      {...props}
    />
  );
});
ContextMenuItem.displayName = "ContextMenuItem";

const ContextMenuCheckboxItem = React.forwardRef(function ContextMenuCheckboxItem(
  {
    className,
    children,
    checked,
    ...props
  },
  ref
) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      ref={ref}
      data-slot="context-menu-checkbox-item"
      className={menuItemClassName({ hasIndicator: true, className })}
      checked={checked}
      {...props}
    >
      <span className={MENU_INDICATOR_SLOT_CLASS}>
        <ContextMenuPrimitive.ItemIndicator>
          <MenuCheckIcon />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
});
ContextMenuCheckboxItem.displayName = "ContextMenuCheckboxItem";

const ContextMenuRadioItem = React.forwardRef(function ContextMenuRadioItem(
  {
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <ContextMenuPrimitive.RadioItem
      ref={ref}
      data-slot="context-menu-radio-item"
      className={menuItemClassName({ hasIndicator: true, className })}
      {...props}
    >
      <span className={MENU_INDICATOR_SLOT_CLASS}>
        <ContextMenuPrimitive.ItemIndicator>
          <MenuRadioDotIcon />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
});
ContextMenuRadioItem.displayName = "ContextMenuRadioItem";

const ContextMenuLabel = React.forwardRef(function ContextMenuLabel(
  {
    className,
    inset,
    ...props
  },
  ref
) {
  return (
    <ContextMenuPrimitive.Label
      ref={ref}
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn(MENU_LABEL_CLASS, className)}
      {...props}
    />
  );
});
ContextMenuLabel.displayName = "ContextMenuLabel";

const ContextMenuSeparator = React.forwardRef(function ContextMenuSeparator(
  {
    className,
    ...props
  },
  ref
) {
  return (
    <ContextMenuPrimitive.Separator
      ref={ref}
      data-slot="context-menu-separator"
      className={cn(MENU_SEPARATOR_CLASS, className)}
      {...props}
    />
  );
});
ContextMenuSeparator.displayName = "ContextMenuSeparator";

function ContextMenuShortcut({ className, ...props }) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(MENU_SHORTCUT_CLASS, className)}
      {...props}
    />
  );
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuRadioGroup,
};
