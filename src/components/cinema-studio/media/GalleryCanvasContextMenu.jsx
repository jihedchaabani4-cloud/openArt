"use client";

import * as React from "react";
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
import { Switch } from "@/components/base/switch";
import { Slider } from "@/components/primitives/slider";
import { CreateFolderDialog } from "@/components/cinema-studio/collections/CreateFolderDialog";
import { useUploadMedia } from "@/features/media/model/useUploadMedia";
import { useWorkflowUiStore } from "@/features/workflows/model/useWorkflowUiStore";
import {
  useStudioSelectionStore,
  makeSelectionKey,
} from "@/features/workflows/model/useStudioSelectionStore";
import { resolveStudioActions } from "@/features/workflows/lib/studioActionRules";
import { STUDIO_GRID_SIZE_STOPS } from "@/shared/lib/displayUtils";
import { logger } from "@/shared/lib/logger";

const EMPTY_LIST = [];

const BLOCKED_CANVAS_MENU_SELECTOR =
  '[data-gallery-card="true"], [data-slot="uploading-card"], [data-slot="processing-card"], [data-selection-key], [data-selection-bar="true"], [data-slot="context-menu-content"], [data-slot="dropdown-menu-content"], button, a, input, textarea, select, [role="checkbox"], [role="menu"], [role="dialog"]';

const ACTIVITY_OPTIONS = [
  { value: "all", label: "All", icon: "grid-view" },
  { value: "generated", label: "Generated", icon: "sparkles" },
  { value: "uploaded", label: "Uploaded", icon: "upload-04" },
  { value: "liked", label: "Liked", icon: "favourite" },
];

function resolveSelectableKeys(entries, workflows, showFolders) {
  const keys = [];

  if (Array.isArray(entries)) {
    for (const entry of entries) {
      if (!entry) continue;
      if (entry.type === "collection") {
        if (!showFolders) continue;
        const col = entry.data;
        const id = col?.id || col?.folder_id || col?.folderId;
        const key = makeSelectionKey("collection", id);
        if (key) keys.push(key);
        continue;
      }

      const wf = entry.type === "workflow" ? entry.data : entry;
      if (!resolveStudioActions({ workflow: wf }).can.select) continue;
      const id = wf?.id || wf?.name;
      const key = makeSelectionKey("workflow", id);
      if (key) keys.push(key);
    }
    return keys;
  }

  if (Array.isArray(workflows)) {
    for (const wf of workflows) {
      if (!resolveStudioActions({ workflow: wf }).can.select) continue;
      const id = wf?.id || wf?.name;
      const key = makeSelectionKey("workflow", id);
      if (key) keys.push(key);
    }
  }

  return keys;
}

function InternalMediaUploader({ inputRef, projectId, currentFolderId }) {
  const { uploadMedia } = useUploadMedia(projectId);

  const handleFileChange = React.useCallback(
    async (e) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;
      try {
        await uploadMedia(files, { collectionId: currentFolderId || null });
      } catch (err) {
        logger.error("gallery_canvas_upload_failed", { message: err?.message });
      } finally {
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [uploadMedia, currentFolderId, inputRef]
  );

  return (
    <input
      ref={inputRef}
      type="file"
      onChange={handleFileChange}
      className="hidden"
      multiple
      accept="image/*,video/mp4,video/webm"
    />
  );
}

function GalleryCanvasMenuBody({
  scope,
  projectId,
  entries,
  workflows,
  allowCreateFolder,
  allowUpload,
  primaryAction,
  hasSelection,
  onOpenCreateFolder,
  onTriggerUpload,
}) {
  const gridSize = useWorkflowUiStore((s) => s.gridSize);
  const setGridSize = useWorkflowUiStore((s) => s.setGridSize);
  const filters = useWorkflowUiStore((s) => s.filters);
  const setFilter = useWorkflowUiStore((s) => s.setFilter);
  const clearFilters = useWorkflowUiStore((s) => s.clearFilters);
  const splitByDate = useWorkflowUiStore((s) => s.splitByDate);
  const setSplitByDate = useWorkflowUiStore((s) => s.setSplitByDate);
  const storeShowFolders = useWorkflowUiStore((s) => s.showFolders);
  const setShowFolders = useWorkflowUiStore((s) => s.setShowFolders);

  const selectAll = useStudioSelectionStore((s) => s.selectAll);
  const clearSelection = useStudioSelectionStore((s) => s.clearSelection);

  const showFolders = storeShowFolders !== false;
  const isFolderScope = scope === "assets" || scope === "collection";
  const isEntityScope = scope === "elements" || scope === "characters";

  const selectableKeys = React.useMemo(
    () => resolveSelectableKeys(entries, workflows, isFolderScope ? showFolders : true),
    [entries, workflows, isFolderScope, showFolders]
  );

  const handleSelectAll = React.useCallback(() => {
    if (selectableKeys.length > 0) {
      selectAll(selectableKeys);
    }
  }, [selectableKeys, selectAll]);

  const resolvedIndex = STUDIO_GRID_SIZE_STOPS.indexOf(gridSize);
  const sliderValue = resolvedIndex >= 0 ? resolvedIndex + 1 : 3;

  const handleSliderChange = React.useCallback(
    ([nextVal]) => {
      const idx = Math.min(
        STUDIO_GRID_SIZE_STOPS.length - 1,
        Math.max(0, (Number(nextVal) || 1) - 1)
      );
      setGridSize(STUDIO_GRID_SIZE_STOPS[idx]);
    },
    [setGridSize]
  );

  const selectedTypes = filters?.types || EMPTY_LIST;
  const hideFailed = Boolean(filters?.hideFailed);
  const activeActivity = filters?.activity || (filters?.liked ? "liked" : "all");
  const isLikedOnly = Boolean(filters?.liked || filters?.activity === "liked");

  const hasActiveFilters =
    selectedTypes.length > 0 ||
    (filters?.models?.length || 0) > 0 ||
    (Boolean(filters?.dateRange) && filters.dateRange !== "all") ||
    hideFailed ||
    activeActivity !== "all" ||
    Boolean(filters?.liked);

  const toggleType = React.useCallback(
    (value) => {
      const next = selectedTypes.includes(value)
        ? selectedTypes.filter((v) => v !== value)
        : [...selectedTypes, value];
      setFilter("types", next);
    },
    [selectedTypes, setFilter]
  );

  const canCreateFolder = Boolean(allowCreateFolder && projectId);

  return (
    <>
      {canCreateFolder && (
        <ContextMenuItem onSelect={onOpenCreateFolder}>
          <MenuItemContent icon="folder-add">New folder</MenuItemContent>
        </ContextMenuItem>
      )}

      {allowUpload && (
        <ContextMenuItem onSelect={onTriggerUpload}>
          <MenuItemContent icon="upload-04">Upload media</MenuItemContent>
        </ContextMenuItem>
      )}

      {primaryAction?.label && (
        <ContextMenuItem
          disabled={primaryAction.disabled}
          onSelect={() => primaryAction.onClick?.()}
        >
          <MenuItemContent icon={primaryAction.icon || "add-01"}>
            {primaryAction.label}
          </MenuItemContent>
        </ContextMenuItem>
      )}

      <ContextMenuItem
        disabled={selectableKeys.length === 0}
        onSelect={handleSelectAll}
      >
        <MenuItemContent icon="select-01">Select all</MenuItemContent>
      </ContextMenuItem>

      {hasSelection && (
        <ContextMenuItem onSelect={clearSelection}>
          <MenuItemContent icon="cancel-01">Clear selection</MenuItemContent>
        </ContextMenuItem>
      )}

      <ContextMenuSeparator />

      <ContextMenuLabel>Card size</ContextMenuLabel>
      <div
        className="px-1 pb-1.5"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.stopPropagation();
          }
        }}
      >
        <Slider
          variant="stepped"
          min={0}
          max={STUDIO_GRID_SIZE_STOPS.length}
          minSelectable={1}
          step={1}
          value={[sliderValue]}
          onValueChange={handleSliderChange}
          aria-label="Card size"
        />
      </div>

      <ContextMenuSeparator />

      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <MenuItemContent icon="sorting-05">Sort</MenuItemContent>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem onSelect={() => setFilter("sort", "newest")}>
            <MenuItemContent checked={filters?.sort !== "oldest"}>
              Newest first
            </MenuItemContent>
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setFilter("sort", "oldest")}>
            <MenuItemContent checked={filters?.sort === "oldest"}>
              Oldest first
            </MenuItemContent>
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <MenuItemContent icon="filter-horizontal">Filter</MenuItemContent>
        </ContextMenuSubTrigger>
        <ContextMenuSubContent>
          {isEntityScope ? (
            <ContextMenuItem
              role="menuitemcheckbox"
              aria-checked={isLikedOnly}
              onSelect={(e) => {
                e.preventDefault();
                setFilter("liked", !isLikedOnly);
              }}
            >
              <MenuItemContent
                icon="favourite"
                trailing={
                  <Switch
                    checked={isLikedOnly}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="pointer-events-none"
                  />
                }
              >
                Liked only
              </MenuItemContent>
            </ContextMenuItem>
          ) : (
            <>
              <ContextMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setFilter("types", []);
                }}
              >
                <MenuItemContent checked={selectedTypes.length === 0}>
                  All types
                </MenuItemContent>
              </ContextMenuItem>
              <ContextMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  toggleType("image");
                }}
              >
                <MenuItemContent
                  icon="image-02"
                  checked={selectedTypes.includes("image")}
                >
                  Images
                </MenuItemContent>
              </ContextMenuItem>
              <ContextMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  toggleType("video");
                }}
              >
                <MenuItemContent
                  icon="video-01"
                  checked={selectedTypes.includes("video")}
                >
                  Videos
                </MenuItemContent>
              </ContextMenuItem>

              <ContextMenuSeparator />

              {ACTIVITY_OPTIONS.map((opt) => (
                <ContextMenuItem
                  key={opt.value}
                  onSelect={(e) => {
                    e.preventDefault();
                    setFilter("activity", opt.value);
                  }}
                >
                  <MenuItemContent
                    icon={opt.icon}
                    checked={activeActivity === opt.value}
                  >
                    {opt.label}
                  </MenuItemContent>
                </ContextMenuItem>
              ))}

              <ContextMenuSeparator />

              <ContextMenuItem
                role="menuitemcheckbox"
                aria-checked={hideFailed}
                onSelect={(e) => {
                  e.preventDefault();
                  setFilter("hideFailed", !hideFailed);
                }}
              >
                <MenuItemContent
                  icon="view-off-slash"
                  trailing={
                    <Switch
                      checked={hideFailed}
                      tabIndex={-1}
                      aria-hidden="true"
                      className="pointer-events-none"
                    />
                  }
                >
                  Hide failed
                </MenuItemContent>
              </ContextMenuItem>
            </>
          )}

          {hasActiveFilters && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  clearFilters();
                }}
              >
                <MenuItemContent icon="refresh">Reset filters</MenuItemContent>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuSubContent>
      </ContextMenuSub>

      <ContextMenuSeparator />

      <ContextMenuItem
        role="menuitemcheckbox"
        aria-checked={splitByDate}
        onSelect={(e) => {
          e.preventDefault();
          setSplitByDate(!splitByDate);
        }}
      >
        <MenuItemContent
          icon="calendar-03"
          trailing={
            <Switch
              checked={splitByDate}
              tabIndex={-1}
              aria-hidden="true"
              className="pointer-events-none"
            />
          }
        >
          Split by date
        </MenuItemContent>
      </ContextMenuItem>

      {isFolderScope && (
        <ContextMenuItem
          role="menuitemcheckbox"
          aria-checked={showFolders}
          onSelect={(e) => {
            e.preventDefault();
            setShowFolders(!showFolders);
          }}
        >
          <MenuItemContent
            icon="folder-01"
            trailing={
              <Switch
                checked={showFolders}
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none"
              />
            }
          >
            Show folders
          </MenuItemContent>
        </ContextMenuItem>
      )}
    </>
  );
}

export function GalleryCanvasContextMenu({
  scope = "assets",
  projectId = null,
  currentFolderId = null,
  entries = null,
  workflows = null,
  allowCreateFolder = false,
  allowUpload = false,
  onUploadClick = null,
  primaryAction = null,
  children,
}) {
  const hasSelection = useStudioSelectionStore((s) => s.selectedKeys.length > 0);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = React.useState(false);
  const internalFileInputRef = React.useRef(null);

  const handleCanvasContextMenu = React.useCallback((e) => {
    if (e.defaultPrevented) return;
    if (e.target instanceof Element && e.target.closest(BLOCKED_CANVAS_MENU_SELECTOR)) {
      e.preventDefault();
    }
  }, []);

  const handleOpenCreateFolder = React.useCallback(() => {
    setIsCreateFolderOpen(true);
  }, []);

  const handleTriggerUpload = React.useCallback(() => {
    if (onUploadClick) {
      onUploadClick();
      return;
    }
    internalFileInputRef.current?.click();
  }, [onUploadClick]);

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild onContextMenu={handleCanvasContextMenu}>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent>
          <GalleryCanvasMenuBody
            scope={scope}
            projectId={projectId}
            entries={entries}
            workflows={workflows}
            allowCreateFolder={allowCreateFolder}
            allowUpload={allowUpload}
            primaryAction={primaryAction}
            hasSelection={hasSelection}
            onOpenCreateFolder={handleOpenCreateFolder}
            onTriggerUpload={handleTriggerUpload}
          />
        </ContextMenuContent>
      </ContextMenu>

      {allowCreateFolder && projectId && (
        <CreateFolderDialog
          open={isCreateFolderOpen}
          onOpenChange={setIsCreateFolderOpen}
          projectId={projectId}
          parentId={currentFolderId || null}
        />
      )}

      {allowUpload && !onUploadClick && (
        <InternalMediaUploader
          inputRef={internalFileInputRef}
          projectId={projectId}
          currentFolderId={currentFolderId}
        />
      )}
    </>
  );
}

export default GalleryCanvasContextMenu;
