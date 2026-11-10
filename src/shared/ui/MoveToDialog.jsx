"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { FolderGlyphIcon } from "@/shared/ui/FolderGlyphIcon";
import { cn } from "@/shared/lib/utils";
import { useProjectFolders } from "@/features/folders/api/queries/useProjectFolders";
import { useFolderMove, isFolderDescendant } from "@/features/folders/model/useFolderMove";
import { useCreateFolder } from "@/features/folders/api/mutations/useCreateFolder";
import { useProjects } from "@/features/projects/api/projectsApi";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { logger } from "@/shared/lib/logger";

const INDENT_CLASSES = [
  "pl-2",
  "pl-6",
  "pl-10",
  "pl-14",
  "pl-20",
  "pl-24",
];
const getIndentClass = (lvl) => INDENT_CLASSES[Math.min(lvl, INDENT_CLASSES.length - 1)];
const EMPTY_FOLDERS = [];

// Flatten raw folders
const getFlatFolders = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  return EMPTY_FOLDERS;
};

/**
 * MoveToDialog
 * Matches the requested structure 1:1:
 * - Header: Title "Move to", Close button
 * - Search bar: "Find folder.." with search icon
 * - Tree list:
 *     - Root destination: "Root of project"
 *     - Tree of folders with collapsible chevrons, FolderGlyphIcon with collection color,
 *       name, inline quick "+ New folder" subfolder button, and disabled state for current folder / subfolders.
 * - Footer: Cancel button + disabled/active Move button.
 */
export function MoveToDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle: propProjectTitle,
  itemType = "collection", // "collection" | "workflow"
  item = null, // the item being moved (e.g. folder or asset)
  onSuccess,
}) {
  const { data: rawFolders = EMPTY_FOLDERS } = useProjectFolders(projectId);
  const { data: projects = [] } = useProjects();
  const { data: projectData } = useProjectData(projectId);
  const { moveItem, isPending: isMoving } = useFolderMove(projectId);
  const { mutateAsync: createFolder, isPending: isCreating } = useCreateFolder();

  const currentProject = React.useMemo(() => {
    if (!Array.isArray(projects)) return null;
    return projects.find((p) => (p.project_id || p.id) === projectId);
  }, [projects, projectId]);

  const resolvedProjectTitle =
    propProjectTitle ||
    currentProject?.project_name ||
    currentProject?.name ||
    projectData?.projectName ||
    projectData?.name ||
    "Workspace Root";

  const rootDisplayTitle = resolvedProjectTitle.toLowerCase().includes("top level")
    ? resolvedProjectTitle
    : `${resolvedProjectTitle} (Top level)`;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTargetId, setSelectedTargetId] = React.useState(null); // null means root, or a folderId
  const [expandedFolderIds, setExpandedFolderIds] = React.useState(new Set());
  const [creatingInFolderId, setCreatingInFolderId] = React.useState(null);
  const [newSubfolderName, setNewSubfolderName] = React.useState("");

  const itemId = item?.id || item?.folderId || item?._id || null;
  const currentParentId =
    item?.parentId || item?.parent_id || item?.folder_id || item?.folderId || null;

  // Flatten raw folders
  const allFolders = React.useMemo(() => getFlatFolders(rawFolders), [rawFolders]);

  // Reset states when opening dialog
  React.useEffect(() => {
    if (open) {
      setSearchQuery("");
      setSelectedTargetId(undefined); // undefined means no selection yet
      setCreatingInFolderId(null);
      setNewSubfolderName("");
      // Expand root folders initially
      const initialExpanded = new Set();
      const currentFlat = getFlatFolders(rawFolders);
      currentFlat.forEach((f) => {
        if (!f.parentId && !f.parent_id) initialExpanded.add(f.id);
      });
      setExpandedFolderIds(initialExpanded);
    }
  }, [open]);

  const toggleExpand = (folderId, e) => {
    e?.stopPropagation?.();
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const isRootMatchingSearch = React.useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      rootDisplayTitle.toLowerCase().includes(q) ||
      resolvedProjectTitle.toLowerCase().includes(q) ||
      "workspace root (top level)".includes(q) ||
      "workspace".includes(q) ||
      "root".includes(q)
    );
  }, [searchQuery, rootDisplayTitle, resolvedProjectTitle]);

  // Build hierarchical folder tree
  const folderTree = React.useMemo(() => {
    const map = new Map();
    const roots = [];

    allFolders.forEach((f) => {
      map.set(f.id, { ...f, children: [] });
    });

    allFolders.forEach((f) => {
      const pId = f.parentId || f.parent_id;
      if (pId && map.has(pId)) {
        map.get(pId).children.push(map.get(f.id));
      } else {
        roots.push(map.get(f.id));
      }
    });

    return roots;
  }, [allFolders]);

  const handleCreateSubfolder = async (targetParentId) => {
    const trimmed = newSubfolderName.trim();
    if (!trimmed || !projectId) return;

    try {
      const created = await createFolder({
        projectId,
        name: trimmed,
        parentId: targetParentId,
      });
      setCreatingInFolderId(null);
      setNewSubfolderName("");
      if (targetParentId) {
        setExpandedFolderIds((prev) => new Set([...prev, targetParentId]));
      }
      if (created?.id) {
        setSelectedTargetId(created.id);
      }
    } catch (err) {
      logger.error("create_subfolder_inline_failed", { message: err?.message });
    }
  };

  const isMoveDisabled =
    selectedTargetId === undefined ||
    isMoving ||
    // Disallow moving to where it already is
    (selectedTargetId === null && !currentParentId) ||
    selectedTargetId === currentParentId ||
    // Disallow moving a collection into itself or subfolders
    (itemType === "collection" &&
      itemId &&
      selectedTargetId !== null &&
      isFolderDescendant(allFolders, itemId, selectedTargetId));

  const handleConfirmMove = async () => {
    if (isMoveDisabled || !projectId) return;

    try {
      await moveItem({
        itemType,
        itemId,
        targetFolderId: selectedTargetId,
        projectId,
      });
      onSuccess?.({ targetFolderId: selectedTargetId });
      onOpenChange?.(false);
    } catch (err) {
      logger.error("move_item_to_dialog_failed", { message: err?.message });
    }
  };

  const renderFolderRow = (node, depth = 0) => {
    const nodeName = node.name || node.folder_name || "Untitled";
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = expandedFolderIds.has(node.id);
    const isSelected = selectedTargetId === node.id;

    // Cycle prevention: if moving a collection, it cannot be moved into itself or its descendants
    const isSelfOrDescendant =
      itemType === "collection" && itemId && isFolderDescendant(allFolders, itemId, node.id);
    const isCurrentParent = currentParentId === node.id;
    const isDisabled = isSelfOrDescendant || isCurrentParent;

    const query = searchQuery.trim().toLowerCase();
    const isMatch = !query || nodeName.toLowerCase().includes(query);

    return (
      <div key={node.id} className="flex flex-col">
        {isMatch && (
          <div
            className={cn(
              "group relative flex h-9 min-w-0 items-center gap-1.5 rounded-lg py-1 pr-1.5 transition-colors select-none",
              getIndentClass(depth),
              isSelected
                ? "bg-white/10 text-on-surface"
                : isDisabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-white/5 text-on-surface-variant hover:text-on-surface cursor-pointer"
            )}
            onClick={() => {
              if (!isDisabled) setSelectedTargetId(node.id);
            }}
          >
            {/* Expand / Collapse Chevron */}
            {hasChildren ? (
              <Button
                type="button"
                variant="ghost"
                size="s"
                onClick={(e) => toggleExpand(node.id, e)}
                aria-label={isExpanded ? `Collapse ${nodeName}` : `Expand ${nodeName}`}
                className="size-6 p-0 shrink-0 text-on-surface-subtle hover:text-on-surface rounded"
              >
                <GoogleIcon
                  iconName={isExpanded ? "expand_more" : "chevron_right"}
                  className="text-base"
                />
              </Button>
            ) : (
              <span className="size-6 shrink-0" />
            )}

            {/* Folder Icon */}
            <FolderGlyphIcon color={node.color} size={18} className="shrink-0" />

            {/* Folder Title */}
            <span className="truncate flex-1 text-sm font-medium text-left">
              {nodeName}
            </span>

            {/* Disabled / Current Status Badge */}
            {isCurrentParent && (
              <span className="text-xxs px-1.5 py-0.5 rounded bg-white/5 text-on-surface-subtle shrink-0">
                Current
              </span>
            )}
            {isSelfOrDescendant && (
              <span className="text-xxs px-1.5 py-0.5 rounded bg-white/5 text-on-surface-subtle shrink-0">
                Cannot move here
              </span>
            )}

            {/* Quick Create Subfolder Trigger */}
            {!isDisabled && (
              <Button
                type="button"
                variant="ghost"
                size="s"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatingInFolderId(node.id);
                  setNewSubfolderName("");
                  setExpandedFolderIds((prev) => new Set([...prev, node.id]));
                }}
                title={`Create subfolder in ${nodeName}`}
                className="opacity-0 group-hover:opacity-100 size-6 p-0 text-on-surface-subtle hover:text-on-surface rounded shrink-0 ml-auto"
              >
                <GoogleIcon iconName="add" className="text-sm" />
              </Button>
            )}
          </div>
        )}

        {/* Inline Subfolder Creation Row */}
        {creatingInFolderId === node.id && (
          <div
            className={cn(
              "flex items-center gap-1.5 py-1 pr-2",
              getIndentClass(depth + 1)
            )}
          >
            <FolderGlyphIcon color={null} size={16} />
            <input
              type="text"
              autoFocus
              value={newSubfolderName}
              onChange={(e) => setNewSubfolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubfolder(node.id);
                if (e.key === "Escape") setCreatingInFolderId(null);
              }}
              placeholder="New folder name..."
              className="flex-1 bg-surface-elevated text-on-surface text-xs rounded px-2 py-1 outline-none border border-border focus:border-white/30"
            />
            <Button
              type="button"
              variant="secondary"
              size="s"
              disabled={!newSubfolderName.trim() || isCreating}
              onClick={() => handleCreateSubfolder(node.id)}
              className="text-xs px-2 h-7"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="s"
              onClick={() => setCreatingInFolderId(null)}
              className="size-7 p-0 text-on-surface-subtle"
            >
              <GoogleIcon iconName="close" className="text-sm" />
            </Button>
          </div>
        )}

        {/* Child Folders (Collapsible) */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child) => renderFolderRow(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="modal"
        showCloseButton={false}
        className="w-112 max-w-[calc(100vw-2rem)] h-128 flex flex-col select-none overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <DialogTitle className="text-base font-semibold text-on-surface">
            Move to
          </DialogTitle>
          <DialogDescription className="sr-only">
            Move item to selected destination folder
          </DialogDescription>
          <Button
            type="button"
            variant="ghost"
            size="s"
            onClick={() => onOpenChange?.(false)}
            className="size-7 rounded-full p-0 text-on-surface-subtle hover:text-on-surface"
            aria-label="Close"
          >
            <GoogleIcon iconName="close" className="text-lg" />
          </Button>
        </div>

        {/* Search Row */}
        <div className="px-5 pt-2 pb-2 flex items-center shrink-0">
          <div className="flex h-9 w-full items-center gap-2 rounded-xl border border-border/60 bg-surface-container-high px-2.5 min-w-0">
            <GoogleIcon iconName="search" className="text-on-surface-subtle text-base shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find folder.."
              className="min-w-0 flex-1 bg-transparent text-xs text-on-surface outline-none placeholder:text-on-surface-subtle"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="s"
                onClick={() => setSearchQuery("")}
                className="size-5 p-0 text-on-surface-subtle hover:text-on-surface"
              >
                <GoogleIcon iconName="close" className="text-xs" />
              </Button>
            )}
          </div>
        </div>

        {/* Tree List Workspace */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 flex flex-col gap-1 custom-scrollbar">
          {/* Root Level Destination Option (at top of tree) */}
          {isRootMatchingSearch && (
            <div
              onClick={() => {
                if (currentParentId) setSelectedTargetId(null);
              }}
              className={cn(
                "group relative flex h-9 min-w-0 items-center gap-1.5 rounded-lg py-1 pr-1.5 pl-2 transition-colors select-none",
                selectedTargetId === null
                  ? "bg-white/10 text-on-surface"
                  : !currentParentId
                  ? "opacity-50 cursor-not-allowed text-on-surface-subtle"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/5 cursor-pointer"
              )}
            >
              <span className="size-6 shrink-0" />
              <FolderGlyphIcon color={null} size={18} className="shrink-0" />
              <span className="truncate flex-1 text-sm font-medium text-left">
                {rootDisplayTitle}
              </span>
              {!currentParentId && (
                <span className="text-xxs px-1.5 py-0.5 rounded bg-white/5 text-on-surface-subtle shrink-0">
                  Current
                </span>
              )}
            </div>
          )}

          {/* Folder Hierarchy */}
          {folderTree.length > 0 ? (
            folderTree.map((rootNode) => renderFolderRow(rootNode, 0))
          ) : (
            <div className="py-8 text-center text-xs text-on-surface-subtle">
              No folders found
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="m"
            onClick={() => onOpenChange?.(false)}
            className="text-sm px-4 text-on-surface-subtle hover:text-on-surface"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="m"
            disabled={isMoveDisabled}
            onClick={handleConfirmMove}
            className="text-sm px-5 font-semibold min-w-[5rem]"
          >
            {isMoving ? "Moving..." : "Move"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
