"use client";

import React, { createContext, useContext, useState, useCallback, forwardRef } from "react";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/primitives/collapsible";
import { Button } from "@/components/base/button";
import { ContextMenu, ContextMenuTrigger } from "@/components/primitives/context-menu";
import { cn } from "@/shared/lib/utils";

const TreeContext = createContext(null);

const useTree = () => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error("useTree must be used within a Tree or FileTree provider");
  }
  return context;
};

/**
 * FileTree / Tree component (shadcn.io/ui/file-tree)
 * Root container managing expansion and selection state.
 */
const Tree = forwardRef(function Tree(
  {
    className,
    children,
    size,
    initialSelectedId,
    selectedId: controlledSelectedId,
    onSelectChange,
    initialExpandedItems = [],
    indicator = true,
    dir = "ltr",
    openIcon,
    closeIcon,
    ...props
  },
  ref
) {
  const [uncontrolledSelectedId, setUncontrolledSelectedId] = useState(initialSelectedId || null);
  const [expandedItems, setExpandedItems] = useState(initialExpandedItems);

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : uncontrolledSelectedId;

  const handleSelect = useCallback(
    (id) => {
      setUncontrolledSelectedId(id);
      onSelectChange?.(id);
    },
    [onSelectChange]
  );

  const toggleExpanded = useCallback((id) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const expandItem = useCallback((id) => {
    setExpandedItems((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  return (
    <TreeContext.Provider
      value={{
        selectedId,
        handleSelect,
        expandedItems,
        setExpandedItems,
        toggleExpanded,
        expandItem,
        indicator,
        direction: dir,
        openIcon,
        closeIcon,
        size,
      }}
    >
      <div
        ref={ref}
        role="tree"
        className={cn("flex flex-col gap-0.5 select-none w-full", className)}
        {...props}
      >
        {children}
      </div>
    </TreeContext.Provider>
  );
});
Tree.displayName = "Tree";

/**
 * Folder component
 * Renders a collapsible folder item with expand/collapse chevron and folder icons.
 */
const Folder = forwardRef(function Folder(
  {
    className,
    element,
    value,
    isSelectable = true,
    variant,
    size,
    children,
    openIcon,
    closeIcon,
    icon,
    actions,
    contextMenu,
    ...props
  },
  ref
) {
  const {
    selectedId,
    handleSelect,
    expandedItems,
    toggleExpanded,
    expandItem,
    indicator,
    openIcon: treeOpenIcon,
    closeIcon: treeCloseIcon,
    size: treeSize,
  } = useTree();

  const isExpanded = expandedItems.includes(value);
  const isSelected = selectedId === value;

  const resolvedOpenIcon = openIcon || icon || treeOpenIcon || "folder-open";
  const resolvedCloseIcon = closeIcon || icon || treeCloseIcon || "folder-01";
  const resolvedVariant = variant || "nav";
  const resolvedSize = size || treeSize || undefined;
  const activeFolderIcon = isExpanded ? resolvedOpenIcon : resolvedCloseIcon;

  const onRowClick = () => {
    if (isSelectable) {
      handleSelect(value);
    }
    if (!isExpanded) {
      expandItem(value);
    }
  };

  const onToggleClick = (e) => {
    e.stopPropagation();
    toggleExpanded(value);
  };

  const rowButton = (
    <Button
      ref={ref}
      type="button"
      variant={resolvedVariant}
      size={resolvedSize}
      role="treeitem"
      data-active={isSelected ? "true" : undefined}
      aria-selected={isSelected}
      aria-expanded={isExpanded}
      onClick={onRowClick}
      className={cn("group", className)}
      {...props}
    >
      <span className="relative size-4 flex items-center justify-center shrink-0 text-icon-primary">
        <span className="flex items-center justify-center transition-opacity duration-150 group-hover:opacity-0">
          {React.isValidElement(activeFolderIcon) ? (
            activeFolderIcon
          ) : (
            <HugeIcon name={activeFolderIcon} />
          )}
        </span>
        <span
          role="button"
          tabIndex={-1}
          data-slot="folder-toggle"
          aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
          title={isExpanded ? "Collapse" : "Expand"}
          onClick={onToggleClick}
          className="absolute inset-0 -m-0.5 flex items-center justify-center rounded-sharp bg-surface-tonal hover:bg-surface-tonal-hover text-icon-secondary hover:text-text-primary opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150"
        >
          <HugeIcon
            name="arrow-right-01"
            size="xs"
            className={cn(
              "transition-transform duration-150",
              isExpanded && "rotate-90"
            )}
          />
        </span>
      </span>

      <span className="truncate flex-1 text-left">
        {element}
      </span>

      {actions && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-auto"
        >
          {actions}
        </div>
      )}
    </Button>
  );

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={() => toggleExpanded(value)}
      className="w-full"
    >
      {contextMenu ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {rowButton}
          </ContextMenuTrigger>
          {contextMenu}
        </ContextMenu>
      ) : (
        rowButton
      )}

      <CollapsibleContent
        className={cn(
          "overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
          indicator && "pl-4"
        )}
      >
        <div className="flex flex-col gap-0.5 pt-0.5">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
Folder.displayName = "Folder";

/**
 * File component
 * Renders a leaf item in the file tree.
 */
const File = forwardRef(function File(
  {
    className,
    element,
    value,
    isSelectable = true,
    variant,
    size,
    fileIcon = "file-02",
    icon,
    actions,
    contextMenu,
    onClick,
    ...props
  },
  ref
) {
  const { selectedId, handleSelect, size: treeSize } = useTree();
  const isSelected = selectedId === value;
  const resolvedVariant = variant || "nav";
  const resolvedSize = size || treeSize || undefined;
  const activeFileIcon = icon || fileIcon;

  const handleClick = (e) => {
    if (isSelectable) {
      handleSelect(value);
    }
    onClick?.(e);
  };

  const fileButton = (
    <Button
      ref={ref}
      type="button"
      variant={resolvedVariant}
      size={resolvedSize}
      role="treeitem"
      data-active={isSelected ? "true" : undefined}
      aria-selected={isSelected}
      onClick={handleClick}
      className={cn("group", className)}
      {...props}
    >
      <span className="relative size-4 flex items-center justify-center shrink-0 text-icon-primary">
        {React.isValidElement(activeFileIcon) ? (
          activeFileIcon
        ) : (
          <HugeIcon name={activeFileIcon} />
        )}
      </span>

      <span className="truncate flex-1 text-left">
        {element}
      </span>

      {actions && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center ml-auto"
        >
          {actions}
        </div>
      )}
    </Button>
  );

  if (contextMenu) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {fileButton}
        </ContextMenuTrigger>
        {contextMenu}
      </ContextMenu>
    );
  }

  return fileButton;
});
File.displayName = "File";

/**
 * CollapseButton component
 * Helper button to collapse all expanded folders.
 */
const CollapseButton = forwardRef(function CollapseButton(
  { className, elements = [], children, variant = "ghost", size, ...props },
  ref
) {
  const { setExpandedItems, expandedItems, size: treeSize } = useTree();
  const resolvedSize = size || treeSize || "s";

  const handleToggleAll = (e) => {
    e.stopPropagation();
    if (expandedItems.length > 0) {
      setExpandedItems([]);
    } else if (elements.length > 0) {
      setExpandedItems(elements);
    }
  };

  return (
    <Button
      ref={ref}
      type="button"
      variant={variant}
      size={resolvedSize}
      onClick={handleToggleAll}
      className={className}
      {...props}
    >
      {children || (expandedItems.length > 0 ? "Tout réduire" : "Tout développer")}
    </Button>
  );
});
CollapseButton.displayName = "CollapseButton";

// Export standard shadcn names and FileTree aliases
const FileTree = Tree;
const FileTreeFolder = Folder;
const FileTreeItem = File;

export {
  Tree,
  Folder,
  File,
  CollapseButton,
  FileTree,
  FileTreeFolder,
  FileTreeItem,
  useTree,
};
