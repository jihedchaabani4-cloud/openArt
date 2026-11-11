"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { FileTree, FileTreeFolder, FileTreeItem } from "@/shared/ui/file-tree";
import { FolderGlyphIcon } from "@/shared/ui/FolderGlyphIcon";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/shared/ui/context-menu";
import { CreateFolderDialog } from "@/shared/ui/CreateFolderDialog";
import { ConfirmDeleteDialog } from "@/shared/ui/ConfirmDeleteDialog";
import { MoveToDialog } from "@/shared/ui/MoveToDialog";
import { cn } from "@/shared/lib/utils";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { useCharacterWorkflows } from "@/features/characters";
import { useElementSheetWorkflows } from "@/features/elements";
import {
  useProjectFolders,
  useUpdateFolder,
  useDeleteFolder,
  useDownloadCollection,
  FOLDER_COLOR_OPTIONS,
  DEFAULT_FOLDER_GRADIENT,
} from "@/features/folders";

/**
 * LeftNavigationRail
 * Clean studio sidebar featuring:
 * - Top items: Générations (Generation Space), Éléments, Personnages
 * - Middle: Project Collections hierarchy with FileTree component (when expanded)
 * - Bottom: Prominent toggle button (PanelLeftClose / PanelLeftOpen) to open & close
 * - Borderless, clean animations, no hover-open
 */
export function LeftNavigationRail() {
  const selectedProjectId = useGenerationsStore((s) => s.selectedProjectId);
  const favoriteFolderIds = useGenerationsStore((s) => s.favoriteFolderIds || {});
  const toggleFavoriteFolder = useGenerationsStore((s) => s.toggleFavoriteFolder);
  const { downloadCollection, isDownloading } = useDownloadCollection();
  const pathname = usePathname();
  const router = useRouter();

  const { workflows: characters = [] } = useCharacterWorkflows(selectedProjectId);
  useElementSheetWorkflows(selectedProjectId);

  const { data: rawFolders = [] } = useProjectFolders(selectedProjectId);

  // Expands / collapses via toggle button or interactive drag resize
  const DEFAULT_EXPANDED_WIDTH = 239;
  const [isExpanded, setIsExpanded] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_EXPANDED_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const asideRef = React.useRef(null);
  const [optimisticTab, setOptimisticTab] = useState(null);

  const handleResizeStart = React.useCallback((clientX) => {
    setIsResizing(true);
    const asideRect = asideRef.current?.getBoundingClientRect();
    const left = asideRect?.left || 0;

    const onPointerMove = (e) => {
      const currentX = e.touches ? e.touches[0].clientX : e.clientX;
      const newWidth = currentX - left;
      if (newWidth < 100) {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
        const clamped = Math.max(170, Math.min(newWidth, 450));
        setSidebarWidth(clamped);
      }
    };

    const onPointerUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };

    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);
  }, []);

  const handleResizeMouseDown = React.useCallback((e) => {
    e.preventDefault();
    handleResizeStart(e.clientX);
  }, [handleResizeStart]);

  const handleResizeTouchStart = React.useCallback((e) => {
    if (e.touches && e.touches[0]) {
      handleResizeStart(e.touches[0].clientX);
    }
  }, [handleResizeStart]);

  const handleResizeDoubleClick = React.useCallback(() => {
    setIsExpanded((prev) => !prev);
    setSidebarWidth(DEFAULT_EXPANDED_WIDTH);
  }, []);

  useEffect(() => {
    setOptimisticTab(null);
  }, [pathname]);

  const rawFoldersList = useMemo(() => {
    if (Array.isArray(rawFolders)) return rawFolders;
    if (Array.isArray(rawFolders?.items)) return rawFolders.items;
    return [];
  }, [rawFolders]);

  const folderTree = useMemo(() => {
    const map = new Map();
    const roots = [];

    rawFoldersList.forEach((folder) => {
      map.set(folder.id, { ...folder, children: [] });
    });

    rawFoldersList.forEach((folder) => {
      const parentId = folder.parent_id || folder.parentId;
      if (parentId && map.has(parentId)) {
        map.get(parentId).children.push(map.get(folder.id));
      } else {
        roots.push(map.get(folder.id));
      }
    });

    return roots;
  }, [rawFoldersList]);

  const activeCollectionId = useMemo(() => {
    const match = pathname?.match(/\/collection\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const handleSelectCollection = (collectionId) => {
    if (collectionId) {
      router.push(`/cinema-studio/${selectedProjectId}/collection/${collectionId}`);
    }
  };

  const handleOpenCollectionInNewTab = (collectionId) => {
    if (collectionId && selectedProjectId && typeof window !== "undefined") {
      window.open(
        `/cinema-studio/${selectedProjectId}/collection/${collectionId}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const { mutateAsync: updateFolder } = useUpdateFolder();
  const { mutateAsync: deleteFolder } = useDeleteFolder();

  const [createSubfolderParentId, setCreateSubfolderParentId] = useState(null);
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [movingFolder, setMovingFolder] = useState(null);

  const handleSetColor = async (folderId, colorHex) => {
    if (!folderId || !selectedProjectId) return;
    try {
      await updateFolder({
        folderId,
        patch: { color: colorHex },
        projectId: selectedProjectId,
      });
    } catch {
      // Optimistic rollback handled
    }
  };

  const handleToggleLike = (folderId) => {
    if (folderId) toggleFavoriteFolder?.(folderId);
  };

  const handleDownload = (folder) => {
    if (folder?.id && selectedProjectId) {
      downloadCollection({
        collectionId: folder.id,
        collectionName: folder.name || folder.folder_name || "Collection",
        projectId: selectedProjectId,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingFolder || !selectedProjectId) return;
    const deletedId = deletingFolder.id;
    try {
      await deleteFolder({
        folderId: deletedId,
        projectId: selectedProjectId,
      });
      setDeletingFolder(null);
      if (activeCollectionId === deletedId) {
        router.push(`/cinema-studio/${selectedProjectId}`);
      }
    } catch {
      // ConfirmDeleteDialog retains state
    }
  };

  const isCharactersActive = pathname?.includes("/characters");
  const isElementsActive = pathname?.includes("/elements");
  const isTrashActive = pathname?.includes("/trash");
  const currentActiveTab = optimisticTab || (isCharactersActive ? "characters" : isElementsActive ? "elements" : isTrashActive ? "trash" : "assets");

  const handleToggleExpand = (e) => {
    e?.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  if (!selectedProjectId || isTrashActive) return null;

  const elementsHref = `/cinema-studio/${selectedProjectId}/elements`;

  const charactersHref = characters.length > 0
    ? `/cinema-studio/${selectedProjectId}/characters`
    : `/cinema-studio/${selectedProjectId}/characters/new`;

  const mainNavItems = [
    {
      id: "home",
      label: "Accueil",
      icon: "chevron_left",
      href: "/cinema-studio",
      isActive: false,
    },
    {
      id: "assets",
      label: "Assets",
      icon: "image",
      href: `/cinema-studio/${selectedProjectId}/assets`,
      isActive: currentActiveTab === "assets",
    },
    {
      id: "elements",
      label: "Éléments",
      icon: "alternate_email",
      href: elementsHref,
      isActive: currentActiveTab === "elements",
    },
    {
      id: "characters",
      label: "Personnages",
      icon: "accessibility_new",
      href: charactersHref,
      isActive: currentActiveTab === "characters",
    },
  ];

  const trashItem = {
    id: "trash",
    label: "Corbeille",
    icon: "delete",
    href: `/cinema-studio/${selectedProjectId}/trash`,
    isActive: currentActiveTab === "trash",
  };

  const renderNavItem = (item) => {
    if (item.id === "home") {
      return (
        <div key={item.id} className="flex h-12 shrink-0 items-center gap-2 px-2" bis_skin_checked="1">
          <Button
            asChild
            size="m"
            variant="ghost"
            data-tour="sidebar-back"
            className={cn(
              "w-full justify-start rounded-lg text-xs font-medium px-2 py-1.5 transition-all duration-150 group flex items-center text-white/70 hover:text-white hover:bg-white/5 border-none",
              "h-button-m"
            )}
            title={!isExpanded ? item.label : undefined}
          >
            <Link
              href={item.href}
              prefetch={true}
              onClick={() => setOptimisticTab(item.id)}
            >
              <span
                className={cn(
                  "flex items-center justify-center size-5 shrink-0 text-white/60 group-hover:text-white transition-colors",
                  isExpanded && "mr-1.5"
                )}
              >
                <GoogleIcon iconName={item.icon || "chevron_left"} className="text-base" />
              </span>
              <span
                className={cn(
                  "tracking-normal truncate flex-1 text-left font-medium whitespace-nowrap rail-label-transition",
                  isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              >
                {item.label}
              </span>
            </Link>
          </Button>
          <div aria-hidden="true" className={cn("size-7 shrink-0", !isExpanded && "hidden")} bis_skin_checked="1" />
        </div>
      );
    }

    return (
      <Button
        key={item.id}
        asChild
        size="m"
        variant="ghost"
        className={cn(
          "w-full justify-start p-0 gap-0 rounded-lg transition-colors duration-100 select-none outline-none overflow-hidden font-sans font-medium text-sm leading-5 antialiased",
          item.isActive
            ? "bg-surface-elevated text-on-surface shadow-none hover:bg-surface-elevated hover:text-on-surface"
            : "text-on-surface-variant hover:text-on-surface hover:bg-white/[0.06]"
        )}
        title={!isExpanded ? item.label : undefined}
      >
        <Link
          href={item.href}
          prefetch={true}
          onClick={() => setOptimisticTab(item.id)}
        >
          <span className="w-[48px] h-full shrink-0 flex items-center justify-center">
            <GoogleIcon
              iconName={item.icon}
              className={cn(
                "text-xl shrink-0",
                item.isActive ? "text-white" : "text-white/80"
              )}
            />
          </span>
          <span
            className={cn(
              "tracking-normal truncate flex-1 pr-2 whitespace-nowrap rail-label-transition",
              isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {item.label}
          </span>
        </Link>
      </Button>
    );
  };

  const renderFolderNode = (node) => {
    const folderName = node.name || node.folder_name || "Collection";
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const folderColor = node.color || null;
    const isNodeLiked = Boolean(favoriteFolderIds[node.id] ?? node.favorited ?? node.is_liked);

    const folderIconElement = (
      <FolderGlyphIcon color={folderColor} size={18} />
    );

    const labelElement = (
      <span className="truncate">{folderName}</span>
    );

    const folderContextMenu = (
      <ContextMenuContent className="w-52">
        <ContextMenuItem onClick={() => handleOpenCollectionInNewTab(node.id)}>
          <GoogleIcon iconName="open_in_new" className="text-base" />
          <span>Ouvrir dans un nouvel onglet</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setCreateSubfolderParentId(node.id)}>
          <GoogleIcon iconName="create_new_folder" className="text-base" />
          <span>Nouveau sous-dossier</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setEditingFolder(node)}>
          <GoogleIcon iconName="edit" className="text-base" />
          <span>Edit</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setMovingFolder(node)}>
          <GoogleIcon iconName="drive_file_move" className="text-base" />
          <span>Déplacer vers...</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleToggleLike(node.id)}>
          <GoogleIcon
            iconName="favorite"
            fill={isNodeLiked}
            className={cn("text-base", isNodeLiked && "text-red-400 fill-red-400")}
          />
          <span>{isNodeLiked ? "Unlike collection" : "Like collection"}</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleDownload(node)} disabled={isDownloading}>
          <GoogleIcon iconName="download" className="text-base" />
          <span>{isDownloading ? "Downloading..." : "Download collection"}</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <GoogleIcon iconName="palette" className="text-base" />
            <span>Couleur</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44 p-1">
            {FOLDER_COLOR_OPTIONS.map((c) => (
              <ContextMenuItem
                key={c.id}
                onClick={() => handleSetColor(node.id, c.hex)}
                className="flex items-center gap-2"
              >
                <span className={cn("size-3 rounded-full shrink-0", c.bgClass)} />
                <span className="truncate">{c.label}</span>
                {node.color?.toLowerCase() === c.hex.toLowerCase() && (
                  <GoogleIcon iconName="check" className="text-xs ml-auto text-on-surface" />
                )}
              </ContextMenuItem>
            ))}
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => handleSetColor(node.id, null)}
              className="flex items-center gap-2"
            >
              <span className="size-3 rounded-full shrink-0 border border-border folder-swatch-white" />
              <span>Blanc (Défaut)</span>
              {(!node.color || node.color.toLowerCase() === DEFAULT_FOLDER_GRADIENT.hex.toLowerCase()) && (
                <GoogleIcon iconName="check" className="text-xs ml-auto text-on-surface" />
              )}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => setDeletingFolder(node)}
        >
          <GoogleIcon iconName="delete" className="text-base" />
          <span>Supprimer</span>
        </ContextMenuItem>
      </ContextMenuContent>
    );

    if (hasChildren) {
      return (
        <FileTreeFolder
          key={node.id}
          value={node.id}
          element={labelElement}
          icon={folderIconElement}
          contextMenu={folderContextMenu}
          isSelectable
        >
          {node.children.map(renderFolderNode)}
        </FileTreeFolder>
      );
    }

    return (
      <FileTreeItem
        key={node.id}
        value={node.id}
        element={labelElement}
        icon={folderIconElement}
        contextMenu={folderContextMenu}
        isSelectable
      />
    );
  };

  return (
    <aside
      ref={asideRef}
      aria-label="Navigation Studio"
      style={{
        width: isExpanded ? `${sidebarWidth}px` : "var(--studio-sidebar-width, 52px)",
      }}
      className={cn(
        "h-full shrink-0 relative z-40 bg-transparent flex flex-col select-none pt-0 pb-3 px-0 rounded-2xl border border-border",
        isResizing ? "transition-none select-none" : "rail-smooth-transition"
      )}
    >
      {/* ── Fixed Top Spacer (independent of scroll) ── */}
      <div className="w-full shrink-0 h-4" />

      {/* ── Top Navigation Items: Générations, Éléments, Personnages ── */}
      <div className="w-full shrink-0 px-0.5">
        <nav className="flex flex-col gap-1.5 w-full">
          {mainNavItems.map(renderNavItem)}
        </nav>
      </div>

      {/* ── Collections Tree Section (when expanded) ── */}
      {isExpanded ? (
        <div className="flex flex-col flex-1 min-h-0 mt-3 pt-3 border-t border-border/40 px-2 overflow-hidden">
          <div className="flex items-center justify-between px-2 pb-1.5 shrink-0">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Collections
            </span>
            {rawFoldersList.length > 0 && (
              <span className="text-xs text-on-surface-variant/70 font-normal">
                {rawFoldersList.length}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-1 rail-smooth-transition">
            {folderTree.length > 0 ? (
              <FileTree
                selectedId={activeCollectionId}
                onSelectChange={handleSelectCollection}
                size="m"
                className="w-full"
              >
                {folderTree.map(renderFolderNode)}
              </FileTree>
            ) : (
              <div className="px-2 py-3 text-xs text-on-surface-variant/60 italic text-left">
                Aucune collection
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Flexible Space (pushes bottom section to bottom) ── */
        <div className="flex-1 min-h-[20px]" />
      )}

      {/* ── Dedicated Bottom Actions: Corbeille (Trash) & Toggle Button ── */}
      <div className="mt-auto flex flex-col gap-1.5 pt-2 pb-2 mb-[30px] w-full shrink-0 px-0.5">
        {renderNavItem(trashItem)}

        <Button
          type="button"
          variant="ghost"
          size="m"
          onClick={handleToggleExpand}
          className="w-full p-0 gap-0 justify-start overflow-hidden font-medium text-sm leading-5 rounded-lg text-on-surface-variant hover:text-on-surface"
          title={isExpanded ? "Réduire la barre" : "Développer la barre"}
          aria-label={isExpanded ? "Réduire la barre" : "Développer la barre"}
        >
          <span className="w-[48px] h-full shrink-0 flex items-center justify-center">
            {isExpanded ? (
              <GoogleIcon iconName="left_panel_close" className="text-xl text-white/80 shrink-0" />
            ) : (
              <GoogleIcon iconName="left_panel_open" className="text-xl text-white/80 shrink-0" />
            )}
          </span>
          <span
            className={cn(
              "tracking-normal truncate flex-1 text-left pr-2 whitespace-nowrap rail-label-transition",
              isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            Réduire
          </span>
        </Button>
      </div>

      {createSubfolderParentId && (
        <CreateFolderDialog
          open={Boolean(createSubfolderParentId)}
          onOpenChange={(open) => {
            if (!open) setCreateSubfolderParentId(null);
          }}
          parentId={createSubfolderParentId}
          projectId={selectedProjectId}
          title="Nouveau sous-dossier"
        />
      )}

      {editingFolder && (
        <CreateFolderDialog
          open={Boolean(editingFolder)}
          onOpenChange={(open) => {
            if (!open) setEditingFolder(null);
          }}
          folder={editingFolder}
          projectId={selectedProjectId}
          title="Edit folder"
        />
      )}

      {movingFolder && (
        <MoveToDialog
          open={Boolean(movingFolder)}
          onOpenChange={(open) => {
            if (!open) setMovingFolder(null);
          }}
          projectId={selectedProjectId}
          itemType="collection"
          item={movingFolder}
        />
      )}

      {deletingFolder && (
        <ConfirmDeleteDialog
          open={Boolean(deletingFolder)}
          onOpenChange={(open) => {
            if (!open) setDeletingFolder(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Supprimer la collection"
          description={`Êtes-vous sûr de vouloir supprimer "${deletingFolder.name || deletingFolder.folder_name || "cette collection"}" ?`}
        />
      )}

      {/* ── Vertical Resize Handle (Draggable Splitter) ── */}
      <div
        data-vertical-resize-handle="true"
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionner la barre latérale"
        tabIndex={0}
        onMouseDown={handleResizeMouseDown}
        onTouchStart={handleResizeTouchStart}
        onDoubleClick={handleResizeDoubleClick}
        className="group/resize pointer-events-auto absolute inset-y-0 z-100 w-3 touch-none select-none -right-1.5 cursor-ew-resize flex items-center justify-center"
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.2)_18%,rgba(255,255,255,0.2)_82%,transparent_100%)] transition-opacity duration-150 group-hover/resize:opacity-100",
            isResizing ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </aside>
  );
}
