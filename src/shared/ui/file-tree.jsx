"use client";

import React, { createContext, useContext, useState, useCallback, forwardRef } from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/shared/ui/collapsible";
import { Button } from "@/shared/ui/button";
import { ContextMenu, ContextMenuTrigger } from "@/shared/ui/context-menu";
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
    size = "m",
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

  return (
    <TreeContext.Provider
      value={{
        selectedId,
        handleSelect,
        expandedItems,
        setExpandedItems,
        toggleExpanded,
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
        className={cn("flex flex-col gap-0.5 select-none w-full text-sm", className)}
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
    indicator,
    openIcon: treeOpenIcon,
    closeIcon: treeCloseIcon,
    size: treeSize,
  } = useTree();

  const isExpanded = expandedItems.includes(value);
  const isSelected = selectedId === value;

  const resolvedOpenIcon = openIcon || icon || treeOpenIcon || "folder_open";
  const resolvedCloseIcon = closeIcon || icon || treeCloseIcon || "folder";
  const resolvedVariant = variant || (isSelected ? "secondary" : "ghost");
  const resolvedSize = size || treeSize || "m";
  const activeFolderIcon = isExpanded ? resolvedOpenIcon : resolvedCloseIcon;

  const onRowClick = (e) => {
    if (isSelectable) {
      handleSelect(value);
    }
    toggleExpanded(value);
  };

  const rowButton = (
    <Button
      ref={ref}
      type="button"
      variant={resolvedVariant}
      size={resolvedSize}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={isExpanded}
      onClick={onRowClick}
      className={cn("w-full justify-start", className)}
      {...props}
    >
      <span className="flex items-center justify-center size-5 shrink-0 mr-1.5 text-on-surface-variant group-hover:text-on-surface">
        {React.isValidElement(activeFolderIcon) ? (
          activeFolderIcon
        ) : (
          <GoogleIcon iconName={activeFolderIcon} className="text-base" />
        )}
      </span>

      <span className="truncate flex-1 text-left font-medium">
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
    fileIcon = "description",
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
  const resolvedVariant = variant || (isSelected ? "secondary" : "ghost");
  const resolvedSize = size || treeSize || "m";
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
      aria-selected={isSelected}
      onClick={handleClick}
      className={cn("w-full justify-start", className)}
      {...props}
    >
      <span className="flex items-center justify-center size-5 shrink-0 mr-1.5 text-on-surface-variant group-hover:text-on-surface">
        {React.isValidElement(activeFileIcon) ? (
          activeFileIcon
        ) : (
          <GoogleIcon iconName={activeFileIcon} className="text-base" />
        )}
      </span>

      <span className="truncate flex-1 text-left font-medium">
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
  const resolvedSize = size || treeSize || "m";

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
