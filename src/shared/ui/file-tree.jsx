"use client";

import React, { createContext, useContext, useState, useCallback, forwardRef } from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/shared/ui/collapsible";
import { Button } from "@/shared/ui/button";
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
    children,
    openIcon,
    closeIcon,
    actions,
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
  } = useTree();

  const isExpanded = expandedItems.includes(value);
  const isSelected = selectedId === value;

  const resolvedOpenIcon = openIcon || treeOpenIcon || "folder_open";
  const resolvedCloseIcon = closeIcon || treeCloseIcon || "folder";

  const onRowClick = (e) => {
    if (isSelectable) {
      handleSelect(value);
    }
    toggleExpanded(value);
  };

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={() => toggleExpanded(value)}
      className="w-full"
    >
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={isExpanded}
        onClick={onRowClick}
        className={cn(
          "w-full justify-start h-8 px-2 rounded-md font-sans text-sm font-medium transition-colors duration-150 select-none",
          isSelected
            ? "bg-surface-elevated text-on-surface"
            : "text-on-surface-variant hover:text-on-surface hover:bg-white/[0.06]",
          className
        )}
        {...props}
      >
        <span className="flex items-center justify-center size-5 shrink-0 mr-1.5 text-on-surface-variant group-hover:text-on-surface">
          <GoogleIcon
            iconName={openIcon ? (isExpanded ? resolvedOpenIcon : resolvedCloseIcon) : (closeIcon || "folder")}
            className="text-base"
          />
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
    fileIcon = "description",
    actions,
    onClick,
    ...props
  },
  ref
) {
  const { selectedId, handleSelect } = useTree();
  const isSelected = selectedId === value;

  const handleClick = (e) => {
    if (isSelectable) {
      handleSelect(value);
    }
    onClick?.(e);
  };

  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      role="treeitem"
      aria-selected={isSelected}
      onClick={handleClick}
      className={cn(
        "w-full justify-start h-8 px-2 rounded-md font-sans text-sm font-medium transition-colors duration-150 select-none",
        isSelected
          ? "bg-surface-elevated text-on-surface"
          : "text-on-surface-variant hover:text-on-surface hover:bg-white/[0.06]",
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center size-5 shrink-0 mr-1.5 text-on-surface-variant group-hover:text-on-surface">
        <GoogleIcon iconName={fileIcon} className="text-base" />
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
});
File.displayName = "File";

/**
 * CollapseButton component
 * Helper button to collapse all expanded folders.
 */
const CollapseButton = forwardRef(function CollapseButton(
  { className, elements = [], children, ...props },
  ref
) {
  const { setExpandedItems, expandedItems } = useTree();

  const handleToggleAll = (e) => {
    e.stopPropagation();
    if (expandedItems.length > 0) {
      setExpandedItems([]);
    } else if (elements.length > 0) {
      setExpandedItems(elements);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleToggleAll}
      className={cn(
        "text-xs text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1",
        className
      )}
      {...props}
    >
      {children || (expandedItems.length > 0 ? "Tout réduire" : "Tout développer")}
    </button>
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
