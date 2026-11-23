"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import { Input } from "@/components/base/input";
import { FileTree, FileTreeFolder, FileTreeItem } from "@/components/primitives/file-tree";
import { FolderGlyphIcon } from "@/components/primitives/FolderGlyphIcon";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/base/dropdown-menu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/primitives/context-menu";
import { MenuItemContent } from "@/components/base/menu";
import { CreateFolderDialog } from "@/components/cinema-studio/collections/CreateFolderDialog";
import { ConfirmDeleteDialog } from "@/components/primitives/ConfirmDeleteDialog";
import { MoveToDialog } from "@/components/cinema-studio/collections/MoveToDialog";
import { UserDropdown } from "@/components/layout/UserDropdown";
import { InlineDropdown, InlineDropdownItem } from "@/components/primitives/inline-dropdown";
import { cn } from "@/shared/lib/utils";
import { buildCollectionDirectCountById } from "@/shared/lib/displayUtils";
import {
  useWorkflowsStore as useGenerationsStore,
  useProjectData,
  selectStudioWorkflows,
} from "@/features/workflows";
import { useCharacterWorkflows } from "@/features/characters";
import { useElementSheetWorkflows } from "@/features/elements";
import {
  useProjects,
  useUpdateProject,
  useDeleteProject,
} from "@/features/projects/api/projectsApi";
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

  const { data: projects = [] } = useProjects();
  const { mutateAsync: updateProject } = useUpdateProject();
  const { mutateAsync: deleteProject } = useDeleteProject();
  const { data: rawFolders = [] } = useProjectFolders(selectedProjectId);
  const { data: projectData } = useProjectData(selectedProjectId);

  const projectList = useMemo(
    () => (Array.isArray(projects) ? projects : []),
    [projects]
  );

  const folderDirectCountById = useMemo(
    () => buildCollectionDirectCountById(projectData?.projectContents?.workflows ?? []),
    [projectData?.projectContents?.workflows]
  );

  const trashCount = useMemo(
    () => selectStudioWorkflows(projectData?.projectContents, { lifecycle: "trash" }).length,
    [projectData?.projectContents]
  );

  const activeProject = useMemo(
    () =>
      projectList.find(
        (p) => String(p.project_id ?? p.id) === String(selectedProjectId)
      ) || null,
    [projectList, selectedProjectId]
  );
  const activeProjectName =
    activeProject?.project_name || activeProject?.name || "Project";

  // Expands / collapses via toggle button or interactive drag resize
  const DEFAULT_EXPANDED_WIDTH = 224;
  const MAX_EXPANDED_WIDTH = 320;
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
        const clamped = Math.max(170, Math.min(newWidth, MAX_EXPANDED_WIDTH));
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

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [createSubfolderParentId, setCreateSubfolderParentId] = useState(null);
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [movingFolder, setMovingFolder] = useState(null);
  const [isRenamingProject, setIsRenamingProject] = useState(false);
  const [isProjectSwitcherOpen, setIsProjectSwitcherOpen] = useState(false);
  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [deletingProject, setDeletingProject] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const projectNameInputRef = React.useRef(null);
  const pendingRenameFocusRef = React.useRef(false);

  useEffect(() => {
    const handlePointerHover = (e) => {
      const detail = e.detail;
      if (detail?.target === "add-to-collection" && detail.collectionId) {
        setDragOverTarget((prev) =>
          prev?.type === "add-to-collection" && prev.collectionId === detail.collectionId
            ? prev
            : { type: "add-to-collection", collectionId: detail.collectionId }
        );
      } else if (detail?.target === "move-to-root") {
        setDragOverTarget((prev) =>
          prev?.type === "move-to-root" ? prev : { type: "move-to-root", collectionId: null }
        );
      } else if (detail?.target === "move-to-trash") {
        setDragOverTarget((prev) =>
          prev?.type === "move-to-trash" ? prev : { type: "move-to-trash", collectionId: null }
        );
      } else {
        setDragOverTarget((prev) => (prev === null ? prev : null));
      }
    };
    window.addEventListener("studio:pointer-hover-target", handlePointerHover);
    return () => {
      window.removeEventListener("studio:pointer-hover-target", handlePointerHover);
    };
  }, []);

  useEffect(() => {
    if (isRenamingProject && projectNameInputRef.current) {
      projectNameInputRef.current.focus();
      projectNameInputRef.current.select();
    }
  }, [isRenamingProject]);

  const handleOpenProjectInNewTab = (targetProjectId = selectedProjectId) => {
    if (targetProjectId && typeof window !== "undefined") {
      window.open(
        `/cinema-studio/${targetProjectId}/assets`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleStartRenameProject = () => {
    setIsProjectSwitcherOpen(false);
    pendingRenameFocusRef.current = true;
    setProjectNameDraft(activeProjectName);
    setIsRenamingProject(true);
  };

  const handleSaveProjectName = async () => {
    const trimmed = projectNameDraft.trim();
    setIsRenamingProject(false);
    if (!trimmed || trimmed === activeProjectName.trim() || !selectedProjectId) return;
    try {
      await updateProject({
        projectId: selectedProjectId,
        projectData: { project_name: trimmed },
      });
    } catch {
      // Optimistic rollback handled by useUpdateProject
    }
  };

  const handleProjectMenuCloseAutoFocus = (e) => {
    if (pendingRenameFocusRef.current) {
      e.preventDefault();
      pendingRenameFocusRef.current = false;
      projectNameInputRef.current?.focus();
      projectNameInputRef.current?.select();
    }
  };

  const renderProjectMenuItems = ({ Label, Item, Separator }) => (
    <>
      <Label>Actions</Label>
      <Item onSelect={() => handleOpenProjectInNewTab(selectedProjectId)}>
        <MenuItemContent icon="link-square-02">Open in new tab</MenuItemContent>
      </Item>
      <Item onSelect={handleStartRenameProject}>
        <MenuItemContent icon="pencil-edit-02">Rename</MenuItemContent>
      </Item>
      <Item onSelect={() => setIsCreateFolderOpen(true)}>
        <MenuItemContent icon="folder-add">Add folder</MenuItemContent>
      </Item>
      <Separator />
      <Item
        variant="destructive"
        onSelect={() => setDeletingProject({ id: String(selectedProjectId), name: activeProjectName })}
      >
        <MenuItemContent icon="delete-02">Delete</MenuItemContent>
      </Item>
    </>
  );

  const handleConfirmDeleteProject = async () => {
    const targetId = deletingProject?.id;
    if (!targetId) return;
    const isCurrent = String(targetId) === String(selectedProjectId);
    setDeletingProject(null);
    if (isCurrent) {
      router.push("/cinema-studio");
    }
    try {
      await deleteProject(targetId);
    } catch {
      // Optimistic rollback handled by useDeleteProject
    }
  };

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
  const isCollectionActive = Boolean(activeCollectionId);
  const currentActiveTab =
    optimisticTab ||
    (isCharactersActive
      ? "characters"
      : isElementsActive
        ? "elements"
        : isTrashActive
          ? "trash"
          : isCollectionActive
            ? null
            : "assets");

  const handleToggleExpand = (e) => {
    e?.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  if (!selectedProjectId) return null;

  const elementsHref = `/cinema-studio/${selectedProjectId}/elements`;

  const charactersHref = characters.length > 0
    ? `/cinema-studio/${selectedProjectId}/characters`
    : `/cinema-studio/${selectedProjectId}/characters/new`;

  const homeNavItem = {
    id: "home",
    label: "Accueil",
    icon: "home-03",
    href: "/cinema-studio",
    isActive: false,
  };

  const mainNavItems = [
    {
      id: "elements",
      label: "Éléments",
      icon: "at",
      href: elementsHref,
      isActive: currentActiveTab === "elements",
    },
    {
      id: "characters",
      label: "Personnages",
      icon: "user",
      href: charactersHref,
      isActive: currentActiveTab === "characters",
    },
  ];

  const allAssetsItem = {
    id: "assets",
    label: "All assets",
    icon: "image-02",
    href: `/cinema-studio/${selectedProjectId}/assets`,
    isActive: currentActiveTab === "assets",
  };

  const trashItem = {
    id: "trash",
    label: "Corbeille",
    icon: "delete-02",
    href: `/cinema-studio/${selectedProjectId}/trash`,
    isActive: currentActiveTab === "trash",
    count: trashCount,
  };

  const renderNavItem = (item, extraClassName, extraProps = {}) => (
    <Button
      key={item.id}
      asChild
      variant="nav"
      data-active={item.isActive ? "true" : undefined}
      data-tour={item.id === "home" ? "sidebar-back" : undefined}
      className={cn("group overflow-hidden", extraClassName)}
      title={!isExpanded ? item.label : undefined}
      {...extraProps}
    >
      <Link
        href={item.href}
        prefetch={true}
        aria-current={item.isActive ? "page" : undefined}
        onClick={() => setOptimisticTab(item.id)}
      >
        <span className="relative size-5 flex items-center justify-center shrink-0 text-icon-primary">
          <HugeIcon name={item.icon} />
        </span>
        <span
          className={cn(
            "truncate flex-1 text-left",
            !isExpanded && "sr-only"
          )}
        >
          {item.label}
        </span>
        {isExpanded && item.count > 0 && (
          <span
            aria-hidden="true"
            data-testid={`sidebar-count-${item.id}`}
            className="ds-text-caption-s text-text-tertiary tabular-nums shrink-0"
          >
            {item.count}
          </span>
        )}
      </Link>
    </Button>
  );

  const renderFolderNode = (node) => {
    const folderName = node.name || node.folder_name || "Collection";
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const folderColor = node.color || null;
    const isNodeLiked = Boolean(favoriteFolderIds[node.id] ?? node.favorited ?? node.is_liked);
    const directCount = folderDirectCountById.get(String(node.id)) || 0;

    const folderIconElement = (
      <FolderGlyphIcon color={folderColor} size={20} />
    );

    const labelElement = (
      <span className="flex items-center justify-between gap-1.5 min-w-0 w-full">
        <span className="truncate">{folderName}</span>
        {directCount > 0 && (
          <span
            aria-hidden="true"
            data-testid={`sidebar-folder-count-${node.id}`}
            className="ds-text-caption-s text-text-tertiary tabular-nums shrink-0"
          >
            {directCount}
          </span>
        )}
      </span>
    );

    const folderContextMenu = (
      <ContextMenuContent>
        <ContextMenuItem onClick={() => handleOpenCollectionInNewTab(node.id)}>
          <MenuItemContent icon="link-square-02">Ouvrir dans un nouvel onglet</MenuItemContent>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setCreateSubfolderParentId(node.id)}>
          <MenuItemContent icon="folder-add">Nouveau sous-dossier</MenuItemContent>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setEditingFolder(node)}>
          <MenuItemContent icon="pencil-edit-02">Edit</MenuItemContent>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setMovingFolder(node)}>
          <MenuItemContent icon="folder-transfer">Déplacer vers...</MenuItemContent>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleToggleLike(node.id)}>
          <MenuItemContent
            icon="favourite"
            iconClassName={isNodeLiked ? "text-error" : undefined}
          >
            {isNodeLiked ? "Unlike collection" : "Like collection"}
          </MenuItemContent>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleDownload(node)} disabled={isDownloading}>
          <MenuItemContent icon="download-04">
            {isDownloading ? "Downloading..." : "Download collection"}
          </MenuItemContent>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <MenuItemContent icon="paint-board">Couleur</MenuItemContent>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {FOLDER_COLOR_OPTIONS.map((c) => (
              <ContextMenuItem
                key={c.id}
                onClick={() => handleSetColor(node.id, c.hex)}
              >
                <MenuItemContent
                  swatchClassName={c.bgClass}
                  checked={node.color?.toLowerCase() === c.hex.toLowerCase()}
                >
                  {c.label}
                </MenuItemContent>
              </ContextMenuItem>
            ))}
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => handleSetColor(node.id, null)}
            >
              <MenuItemContent
                swatchClassName="border border-border folder-swatch-white"
                checked={
                  !node.color ||
                  node.color.toLowerCase() === DEFAULT_FOLDER_GRADIENT.hex.toLowerCase()
                }
              >
                Blanc (Défaut)
              </MenuItemContent>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => setDeletingFolder(node)}
        >
          <MenuItemContent icon="delete-02">Supprimer</MenuItemContent>
        </ContextMenuItem>
      </ContextMenuContent>
    );

    const isFolderDragOver =
      dragOverTarget?.type === "add-to-collection" && dragOverTarget.collectionId === node.id;
    const dragHighlightClass = isFolderDragOver
      ? "bg-surface-tonal-hover ring-1 ring-text-primary/70"
      : undefined;

    if (hasChildren) {
      return (
        <FileTreeFolder
          key={node.id}
          value={node.id}
          element={labelElement}
          icon={folderIconElement}
          contextMenu={folderContextMenu}
          data-collection-drop-id={node.id}
          data-drag-over={isFolderDragOver ? "true" : undefined}
          className={dragHighlightClass}
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
        data-collection-drop-id={node.id}
        data-drag-over={isFolderDragOver ? "true" : undefined}
        className={dragHighlightClass}
        isSelectable
      />
    );
  };

  return (
    <aside
      ref={asideRef}
      aria-label="Navigation Studio"
      style={{
        width: isExpanded ? `${sidebarWidth}px` : "var(--studio-sidebar-width, 56px)",
        maxWidth: `${MAX_EXPANDED_WIDTH}px`,
      }}
      className={cn(
        "h-full shrink-0 relative z-40 bg-transparent flex flex-col gap-y-4 select-none px-2 py-3 rounded-2xl border border-border-subtle",
        isResizing ? "transition-none" : "transition-[width] duration-200 ease-out"
      )}
    >
      {/* ── Primary Navigation & Collections Sections ── */}
      <div className="flex w-full flex-1 flex-col gap-y-4 min-h-0">
        <nav
          aria-label="Navigation principale"
          className="flex flex-col gap-0.5 items-start w-full shrink-0"
        >
          <div
            className={cn(
              "flex w-full",
              isExpanded ? "flex-row items-center justify-between gap-1.5" : "flex-col-reverse items-start gap-1"
            )}
          >
            {renderNavItem(homeNavItem, isExpanded ? "w-auto flex-1 shrink min-w-0" : undefined)}
            <IconButton
              type="button"
              variant="tonal"
              onClick={handleToggleExpand}
              className={cn("shrink-0 rounded-lg", !isExpanded && "ml-1")}
              title={isExpanded ? "Réduire la barre" : "Développer la barre"}
              aria-label={isExpanded ? "Réduire la barre" : "Développer la barre"}
            >
              <HugeIcon
                name="sidebar-left-01"
                className={cn(
                  "transition-transform duration-200",
                  !isExpanded && "rotate-180"
                )}
              />
            </IconButton>
          </div>

          {isExpanded && (
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div data-testid="sidebar-project-row" className="w-full my-3">
                  <InlineDropdown
                    open={isProjectSwitcherOpen && !isRenamingProject}
                    onOpenChange={(next) => {
                      if (!isRenamingProject) setIsProjectSwitcherOpen(next);
                    }}
                    trigger={({ open: switcherOpen, toggle, chevron }) =>
                      isRenamingProject ? (
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="relative size-5 flex items-center justify-center shrink-0 text-icon-primary">
                            <HugeIcon name="film-02" />
                          </span>
                          <Input
                            ref={projectNameInputRef}
                            type="text"
                            value={projectNameDraft}
                            onChange={(e) => setProjectNameDraft(e.target.value.slice(0, 120))}
                            onBlur={handleSaveProjectName}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.currentTarget.blur();
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                setIsRenamingProject(false);
                              }
                            }}
                            aria-label="Nom du projet"
                            className="h-7 px-1.5 py-0 ds-text-caption-l flex-1 min-w-0 rounded-md"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={toggle}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            handleStartRenameProject();
                          }}
                          title={activeProjectName}
                          aria-label="Switch project"
                          aria-expanded={switcherOpen}
                          data-testid="sidebar-project-switcher"
                          className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer focus-visible:outline-none"
                        >
                          <span className="relative size-5 flex items-center justify-center shrink-0 text-icon-primary">
                            <HugeIcon name="film-02" />
                          </span>
                          <span className="truncate flex-1 font-sans ds-text-caption-l font-medium text-text-primary">
                            {activeProjectName}
                          </span>
                          {chevron}
                        </button>
                      )
                    }
                    trailing={
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <IconButton
                            type="button"
                            variant="ghost"
                            size="xs"
                            aria-label="Actions du projet"
                            title="Actions du projet"
                            className="shrink-0 rounded-md text-muted-foreground hover:text-text-primary"
                          >
                            <HugeIcon name="more-vertical" />
                          </IconButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          onCloseAutoFocus={handleProjectMenuCloseAutoFocus}
                        >
                          {renderProjectMenuItems({
                            Label: DropdownMenuLabel,
                            Item: DropdownMenuItem,
                            Separator: DropdownMenuSeparator,
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    }
                  >
                    {projectList
                      .filter((proj) => String(proj.project_id ?? proj.id ?? "") !== String(selectedProjectId))
                      .map((proj) => {
                        const projId = String(proj.project_id ?? proj.id ?? "");
                        const projName = proj.project_name || proj.name || "Project";
                        return (
                          <ContextMenu key={projId}>
                            <ContextMenuTrigger asChild>
                              <InlineDropdownItem
                                icon="film-02"
                                onClick={() => {
                                  setIsProjectSwitcherOpen(false);
                                  if (projId) router.push(`/cinema-studio/${projId}/assets`);
                                }}
                              >
                                {projName}
                              </InlineDropdownItem>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuLabel>Actions</ContextMenuLabel>
                              <ContextMenuItem
                                onSelect={() => {
                                  setIsProjectSwitcherOpen(false);
                                  if (projId) router.push(`/cinema-studio/${projId}/assets`);
                                }}
                              >
                                <MenuItemContent icon="arrow-right-01">Open</MenuItemContent>
                              </ContextMenuItem>
                              <ContextMenuItem
                                onSelect={() => handleOpenProjectInNewTab(projId)}
                              >
                                <MenuItemContent icon="link-square-02">Open in new tab</MenuItemContent>
                              </ContextMenuItem>
                              <ContextMenuSeparator />
                              <ContextMenuItem
                                variant="destructive"
                                onSelect={() => setDeletingProject({ id: projId, name: projName })}
                              >
                                <MenuItemContent icon="delete-02">Delete</MenuItemContent>
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        );
                      })}
                    {projectList.filter((proj) => String(proj.project_id ?? proj.id ?? "") !== String(selectedProjectId)).length === 0 && (
                      <InlineDropdownItem
                        icon="home-03"
                        onClick={() => {
                          setIsProjectSwitcherOpen(false);
                          router.push("/cinema-studio");
                        }}
                      >
                        All projects
                      </InlineDropdownItem>
                    )}
                  </InlineDropdown>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent onCloseAutoFocus={handleProjectMenuCloseAutoFocus}>
                {renderProjectMenuItems({
                  Label: ContextMenuLabel,
                  Item: ContextMenuItem,
                  Separator: ContextMenuSeparator,
                })}
              </ContextMenuContent>
            </ContextMenu>
          )}

          {mainNavItems.map((item) => renderNavItem(item))}
        </nav>

        {/* ── All Assets & Folders Tree Section ── */}
        <section
          aria-label="Folders"
          className="flex flex-col gap-1.5 items-start w-full flex-1 min-h-0 overflow-hidden"
        >
          {isExpanded && (
            <div className="flex items-center justify-between w-full px-2 shrink-0">
              <p className="font-sans text-sm font-normal text-muted-foreground">
                Folders
              </p>
            </div>
          )}

          <div className="flex-1 w-full overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar flex flex-col gap-0.5">
            <Button
              asChild
              variant="nav"
              data-active={allAssetsItem.isActive ? "true" : undefined}
              data-drop-project-root="true"
              data-drag-over={dragOverTarget?.type === "move-to-root" ? "true" : undefined}
              className={cn(
                "group overflow-hidden shrink-0",
                dragOverTarget?.type === "move-to-root" &&
                  "bg-surface-tonal-hover ring-1 ring-text-primary/70"
              )}
              title={!isExpanded ? allAssetsItem.label : undefined}
            >
              <Link
                href={allAssetsItem.href}
                prefetch={true}
                aria-current={allAssetsItem.isActive ? "page" : undefined}
                onClick={() => setOptimisticTab("assets")}
              >
                <span className="relative size-5 flex items-center justify-center shrink-0 text-icon-primary">
                  <HugeIcon name={allAssetsItem.icon} />
                </span>
                <span
                  className={cn(
                    "truncate flex-1 text-left",
                    !isExpanded && "sr-only"
                  )}
                >
                  {allAssetsItem.label}
                </span>
              </Link>
            </Button>

            {isExpanded && (
              <div className="flex flex-col gap-0.5 pl-4 w-full">
                <Button
                  type="button"
                  variant="nav"
                  onClick={() => setIsCreateFolderOpen(true)}
                  className="group overflow-hidden text-muted-foreground hover:text-text-primary"
                >
                  <span className="relative size-5 flex items-center justify-center shrink-0">
                    <HugeIcon name="folder-add" />
                  </span>
                  <span className="truncate flex-1 text-left">
                    Add folder
                  </span>
                </Button>

                {folderTree.length > 0 && (
                  <FileTree
                    selectedId={activeCollectionId}
                    onSelectChange={handleSelectCollection}
                    className="w-full"
                  >
                    {folderTree.map(renderFolderNode)}
                  </FileTree>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Dedicated Bottom Actions: Corbeille (Trash) + User ── */}
      <div className="mt-auto flex flex-col gap-0.5 items-start w-full shrink-0">
        {renderNavItem(
          trashItem,
          dragOverTarget?.type === "move-to-trash"
            ? "bg-error/15 ring-1 ring-error/70 text-error"
            : undefined,
          {
            "data-drop-trash": "true",
            "data-drag-over": dragOverTarget?.type === "move-to-trash" ? "true" : undefined,
          }
        )}
        <UserDropdown variant="sidebar" expanded={isExpanded} />
      </div>

      {isCreateFolderOpen && (
        <CreateFolderDialog
          open={isCreateFolderOpen}
          onOpenChange={setIsCreateFolderOpen}
          parentId={null}
          projectId={selectedProjectId}
        />
      )}

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

      {deletingProject && (
        <ConfirmDeleteDialog
          open={Boolean(deletingProject)}
          onOpenChange={(open) => {
            if (!open) setDeletingProject(null);
          }}
          onConfirm={handleConfirmDeleteProject}
          title="Supprimer le projet"
          description={`Êtes-vous sûr de vouloir supprimer "${deletingProject.name || activeProjectName}" ?`}
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
