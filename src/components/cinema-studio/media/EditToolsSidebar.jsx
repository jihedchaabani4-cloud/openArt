"use client";

import * as React from "react";
import { Button } from "@/components/base/button";
import { Label } from "@/components/base/label";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/base/dropdown-menu";
import { MenuItemContent } from "@/components/base/menu";
import { EditableDisplayName } from "@/components/primitives/EditableDisplayName";
import { ConfirmDeleteDialog } from "@/components/primitives/ConfirmDeleteDialog";
import { getItemMetadata } from "@/shared/lib/generationUtils";
import { cn } from "@/shared/lib/utils";

export const IMAGE_EDIT_TOOLS = Object.freeze([
  Object.freeze({
    id: "remove-background",
    label: "Remove Background",
    icon: "layers-01",
  }),
  Object.freeze({
    id: "angles",
    label: "Angles",
    icon: "globe-02",
  }),
  Object.freeze({
    id: "relight",
    label: "Relight",
    icon: "flash",
  }),
]);

function getMediaId(item) {
  return item?.id || item?.media_id || item?.name || null;
}

/**
 * EditToolsSidebar
 * Full-height right-side inspector & tool launcher on the Asset Edit Page.
 * Includes top action bar (More menu + primary Download CTA), Edits / Info tabs,
 * horizontal version history thumbnails strip, and full-width ghost tool buttons.
 */
export function EditToolsSidebar({
  workflow,
  items = [],
  activeItem = null,
  primaryMediaId = null,
  displayTitle = "Untitled Workflow",
  canEditImage = true,
  isDownloading = false,
  tools = IMAGE_EDIT_TOOLS,
  onSelectTool,
  onSelectVersion,
  onDownload,
  onRenameWorkflow,
  onDeleteMedia,
  onDetachMedia,
  className,
}) {
  const [activeTab, setActiveTab] = React.useState("edits"); // "edits" | "info"
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const nameRef = React.useRef(null);

  const activeId = getMediaId(activeItem);
  const activeMeta = React.useMemo(
    () => (activeItem && workflow ? getItemMetadata(activeItem, workflow) : null),
    [activeItem, workflow]
  );

  const versionItems = React.useMemo(
    () => (Array.isArray(items) ? items : []),
    [items]
  );

  const canDetach = versionItems.length > 1 && Boolean(activeId) && typeof onDetachMedia === "function";

  const handleRenameClick = React.useCallback(() => {
    setActiveTab("info");
    setTimeout(() => {
      nameRef.current?.startEditing?.();
    }, 30);
  }, []);

  const promptText =
    activeMeta?.prompt ||
    activeItem?.generation_config?.user_prompt ||
    activeItem?.generation_config?.prompt ||
    activeItem?.generationConfig?.prompt ||
    "";
  const modelName =
    activeMeta?.model ||
    activeItem?.generation_config?.model ||
    activeItem?.generationConfig?.model ||
    null;
  const width = activeItem?.width || activeItem?.image?.dimensions?.width || null;
  const height = activeItem?.height || activeItem?.image?.dimensions?.height || null;

  return (
    <section
      aria-label="Edit sidebar"
      data-slot="edit-tools-sidebar"
      className={cn(
        "flex flex-col h-full w-full bg-omni-bg overflow-hidden",
        className
      )}
    >
      {/* Top Action Header: Secondary More Menu + Primary White Download CTA */}
      <header className="ds-edit-sidebar-header border-b border-border-subtle shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="tonal"
              className="flex-1 justify-center ds-edit-sidebar-action-btn"
            >
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {onRenameWorkflow && (
              <DropdownMenuItem onClick={handleRenameClick}>
                <MenuItemContent icon="pencil-edit-02">Rename</MenuItemContent>
              </DropdownMenuItem>
            )}
            {canDetach && (
              <DropdownMenuItem onClick={() => onDetachMedia?.(activeId)}>
                <MenuItemContent icon="scissor-01">Detach to new workflow</MenuItemContent>
              </DropdownMenuItem>
            )}
            {onDeleteMedia && activeId && (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setIsDeleteOpen(true)}
              >
                <MenuItemContent icon="delete-02">Delete version</MenuItemContent>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="primary"
          disabled={isDownloading || !activeMeta?.url}
          onClick={onDownload}
          className="flex-1 justify-center ds-edit-sidebar-action-btn"
        >
          {isDownloading ? "Downloading…" : "Download"}
        </Button>
      </header>

      {/* Tabs: Edits | Info */}
      <div
        role="tablist"
        aria-label="Inspector sections"
        className="ds-edit-sidebar-tabs shrink-0"
      >
        {[
          { id: "edits", label: "Edits" },
          { id: "info", label: "Info" },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "ds-edit-sidebar-tab ds-text-tab",
                isSelected
                  ? "bg-surface-tonal text-text-primary"
                  : "text-text-secondary hover:bg-surface-tonal hover:text-text-primary"
              )}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Tab Body */}
      {activeTab === "edits" ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {/* Version History Thumbnail Strip */}
          {versionItems.length > 0 && (
            <div className="px-4 py-2.5 border-b border-border-subtle shrink-0">
              <div
                className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-0.5"
                role="listbox"
                aria-label="Asset versions"
              >
                {versionItems.map((item, idx) => {
                  const id = getMediaId(item);
                  const meta = getItemMetadata(item, workflow);
                  const isActive = Boolean(id && id === activeId);
                  const isPrimary = Boolean(
                    item.is_primary || item.isPrimary || (primaryMediaId && id === primaryMediaId)
                  );
                  const isProcessing =
                    meta?.status === "processing" || meta?.status === "pending";
                  const rawUrl = meta?.url || null;
                  const isVideoItem =
                    Boolean(meta?.isVideo) ||
                    (typeof rawUrl === "string" && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(rawUrl));
                  const posterUrl =
                    meta?.thumbUrl && !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(meta.thumbUrl)
                      ? meta.thumbUrl
                      : null;
                  const imgSrc = posterUrl || (!isVideoItem ? rawUrl : null);

                  return (
                    <button
                      key={id || idx}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      aria-label={`Version ${idx + 1}${isPrimary ? " (current)" : ""}`}
                      onClick={() => onSelectVersion?.(item)}
                      className={cn(
                        "relative size-12 rounded-subtle overflow-hidden shrink-0 bg-surface-card border transition-all cursor-pointer focus-workspace",
                        isActive
                          ? "border-white ring-1 ring-white"
                          : "border-border-subtle opacity-75 hover:opacity-100"
                      )}
                    >
                      {imgSrc ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={imgSrc}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : isVideoItem && rawUrl ? (
                        <video
                          src={rawUrl}
                          muted
                          playsInline
                          preload="metadata"
                          className="size-full object-cover pointer-events-none"
                        />
                      ) : (
                        <span className="size-full flex items-center justify-center text-text-secondary">
                          <HugeIcon
                            name={isProcessing ? "loading-03" : isVideoItem ? "video-01" : "image-01"}
                            size="sm"
                            className={isProcessing ? "animate-spin" : undefined}
                          />
                        </span>
                      )}
                      {isVideoItem && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute bottom-0.5 right-0.5 flex size-4 items-center justify-center rounded-sharp bg-black/60 text-white"
                        >
                          <HugeIcon name="play" size="2xs" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Edit Tools List */}
          <nav
            aria-label="Edit tools"
            className="px-2 pt-2 pb-3 flex flex-col"
          >
            {canEditImage ? (
              tools.map((tool) => (
                <Button
                  key={tool.id}
                  type="button"
                  variant="ghost"
                  onClick={() => onSelectTool?.(tool.id)}
                  className="ds-edit-sidebar-tool-row"
                >
                  <span className="flex items-center gap-1 min-w-0">
                    <span className="size-6 flex items-center justify-center shrink-0">
                      <HugeIcon name={tool.icon} size="md" className="text-icon-primary" />
                    </span>
                    <span className="truncate ds-type-caption-label">
                      {tool.label}
                    </span>
                  </span>
                  <span className="size-4 flex items-center justify-center shrink-0">
                    <HugeIcon name="arrow-right-01" size="xs" className="text-icon-secondary" />
                  </span>
                </Button>
              ))
            ) : (
              <p className="px-2 py-3 ds-type-small text-text-secondary">
                Image editing tools are available for active image assets.
              </p>
            )}
          </nav>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 flex flex-col gap-3">
          {/* Editable Title */}
          <div className="flex flex-col gap-1">
            <Label as="span">Title</Label>
            <EditableDisplayName
              ref={nameRef}
              displayName={displayTitle}
              placeholder="Untitled Workflow"
              onSave={onRenameWorkflow}
              inputClassName="ds-type-small text-text-primary w-full"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
            {modelName && (
              <div className="flex items-center justify-between gap-2">
                <Label as="span">Model</Label>
                <span className="ds-type-small text-text-primary truncate">{modelName}</span>
              </div>
            )}
            {width && height && (
              <div className="flex items-center justify-between gap-2">
                <Label as="span">Dimensions</Label>
                <span className="ds-type-small text-text-primary tabular-nums">
                  {width} × {height}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <Label as="span">Versions</Label>
              <span className="ds-type-small text-text-primary tabular-nums">
                {versionItems.length}
              </span>
            </div>
            {activeMeta?.status && (
              <div className="flex items-center justify-between gap-2">
                <Label as="span">Status</Label>
                <span className="ds-type-small text-text-primary capitalize">
                  {activeMeta.status}
                </span>
              </div>
            )}
          </div>

          {promptText && (
            <div className="flex flex-col gap-1 pt-2 border-t border-border-subtle">
              <Label as="span">Prompt</Label>
              <p className="ds-type-small text-text-primary break-words">
                {promptText}
              </p>
            </div>
          )}
        </div>
      )}

      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        description="Are you sure you want to delete this version?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (activeId) onDeleteMedia?.(activeId);
        }}
      />
    </section>
  );
}

export default EditToolsSidebar;
