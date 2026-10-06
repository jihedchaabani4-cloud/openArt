"use client";

import React, { useState } from "react";
import { Play, ImageIcon, Scissors, Trash2 } from "lucide-react";
import { useDeleteMedia, useDetachMedia } from "../api/workflowsApi";
import { ActionBtn } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn";
import { ButtonGroup } from "@/shared/ui/button-group";
import { ContextMenu, ContextMenuTrigger } from "@/shared/ui/context-menu";
import { StudioContextMenuContent } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem/StudioItemMenu";
import { cn } from "@/shared/lib/utils";
import { getItemMetadata } from "@/shared/lib/generationUtils";
import { CoreMediaItemView } from "@/widgets/CoreMediaItemView";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";

function tokenizePrompt(prompt = "") {
  const tokens = [];
  const regex = /<Trait:\s*([^>]+)>|<MediaAsset:\s*[^>]+>/gi;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(prompt)) !== null) {
    if (match.index > lastIndex) {
      const text = prompt.slice(lastIndex, match.index).trim();
      if (text) tokens.push({ type: "text", value: text });
    }

    if (match[1]) {
      tokens.push({ type: "trait", value: match[1].trim() });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < prompt.length) {
    const text = prompt.slice(lastIndex).trim();
    if (text) tokens.push({ type: "text", value: text });
  }

  return tokens;
}

/**
 * WorkflowMediaGalleryCard
 * Dedicated card component for each media item in the workflow gallery sidebar.
 * Integrates CoreMediaItemView with hover action buttons and right-click ContextMenu.
 */
function WorkflowMediaGalleryCard({
  item,
  activeItem,
  primaryMediaId,
  isSelectable,
  onSelect,
  onDetach,
  onDelete,
  isExpanded,
  onToggleExpand,
}) {
  const [detachOpen, setDetachOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const meta = getItemMetadata(item);
  const itemId = item.id || item.name;
  const isActive = activeItem && (itemId === activeItem.id || itemId === activeItem.name);
  const isPrimary = primaryMediaId && (itemId === primaryMediaId);

  const iUrl = meta.url;
  const iVideo = meta.isVideo;
  const prompt = meta.prompt || item.prompt || "";
  const promptTokens = tokenizePrompt(prompt);

  const referenceImages = 
    item.generationConfig?.references || 
    item.mediaMetadata?.requestData?.references || 
    item.mediaMetadata?.requestData?.referenceImages || 
    [];

  const firstRefUrl = referenceImages[0]?.url || referenceImages[0]?.file_url;
  const displayUrl = iUrl || ((meta.status === 'processing' || meta.status === 'uploading') ? firstRefUrl : null);

  const isPortrait = Boolean(
    meta?.aspect &&
    (meta.aspect === "9/16" ||
     meta.aspect === "2/3" ||
     meta.aspect === "3/4" ||
     meta.aspect === "4/5" ||
     (typeof meta.aspect === "string" && meta.aspect.includes("/") && Number(meta.aspect.split("/")[0]) < Number(meta.aspect.split("/")[1])))
  );
  const cardWidth = (meta.status === "processing" || meta.status === "uploading" || !meta.url) 
    ? "100%" 
    : (isPortrait ? "auto" : "100%");
  const cardHeight = isPortrait ? "200px" : "auto";

  // Menu items for right-click context menu
  const menuItems = [
    {
      key: "detach",
      icon: "content_cut",
      label: "Détacher vers un nouveau workflow",
      onClick: () => setDetachOpen(true),
    },
    {
      key: "delete",
      icon: "delete",
      label: "Supprimer le média",
      variant: "destructive",
      onClick: () => setDeleteOpen(true),
    },
  ];

  return (
    <div className="flex flex-col gap-3 group/item">
      {/* Right-click Context Menu */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <CoreMediaItemView
            item={item}
            src={displayUrl}
            isVideo={iVideo}
            status={meta.status || "completed"}
            aspect={meta.aspect && meta.aspect !== "auto" ? meta.aspect : "16/9"}
            fit="cover"
            playOnHover={true}
            showHoverOverlay={false}
            onClick={(e) => {
              e?.stopPropagation?.();
              if (!isSelectable) return;
              onSelect(item);
            }}
            className={cn(
              "transition-all duration-300 self-start group",
              isSelectable ? "cursor-pointer" : "opacity-50 pointer-events-none",
              isPrimary 
                ? "border-white border-2" 
                : "border-white/5 opacity-80"
            )}
            style={{ 
              maxWidth: "300px",
              maxHeight: "200px",
              width: cardWidth,
              height: cardHeight,
              aspectRatio: meta.aspect && meta.aspect !== "auto" ? meta.aspect : "16/9"
            }}
            topLeft={
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ButtonGroup 
                  className="bg-white/60 backdrop-blur-md rounded-lg scale-90 origin-top-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ActionBtn 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetachOpen(true);
                    }}
                    title="Détacher vers un nouveau workflow"
                  >
                    <Scissors className="size-3.5" />
                  </ActionBtn>
                  
                  <ActionBtn 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteOpen(true);
                    }}
                    title="Supprimer le média"
                  >
                    <Trash2 className="size-3.5" />
                  </ActionBtn>
                </ButtonGroup>
              </div>
            }
            topRight={
              iVideo ? (
                <div className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                  <Play className="size-3 fill-white text-white" />
                </div>
              ) : null
            }
            overlay={
              isActive ? (
                <div className="absolute inset-0 bg-white/5 pointer-events-none" />
              ) : null
            }
          />
        </ContextMenuTrigger>

        {/* Right-click Context Menu Content */}
        <StudioContextMenuContent items={menuItems} />
      </ContextMenu>

      {/* Confirmation Dialogs */}
      <ConfirmDeleteDialog
        open={detachOpen}
        onOpenChange={setDetachOpen}
        onConfirm={() => onDetach(itemId)}
        title="Détacher le média"
        description="Voulez-vous détacher ce média vers un nouveau workflow ?"
        confirmLabel="Détacher"
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => onDelete(itemId)}
        title="Supprimer le média"
        description="Cette action est irréversible. Le média sera définitivement supprimé."
        confirmLabel="Supprimer"
      />

      {/* Reference Images Row (if any) */}
      {referenceImages.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {referenceImages.map((ref, idx) => {
            const refUrl = ref.url || ref.file_url;
            if (!refUrl) return null;
            return (
              <div 
                key={idx}
                className="relative w-10 h-10 flex items-center justify-center rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0"
              >
                <ImageIcon className="absolute size-4 text-white/20" />
                <img 
                  src={refUrl} 
                  className="absolute inset-0 w-full h-full object-cover z-10" 
                  alt="Reference" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Prompt Text */}
      {promptTokens.length > 0 && (
        <div
          onClick={() => onToggleExpand(itemId)}
          className={cn(
            "px-1 text-[11px] text-white font-medium transition-all duration-200 cursor-pointer select-none overflow-hidden",
            isExpanded ? "" : "max-h-[36px]"
          )}
          title={isExpanded ? "" : prompt}
        >
          <div className="flex flex-wrap gap-1.5">
            {promptTokens.map((token, index) =>
              token.type === "trait" ? (
                <span
                  key={`${itemId}-trait-${index}`}
                  className="inline-flex items-center rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] leading-none text-white/85"
                >
                  {token.value}
                </span>
              ) : (
                <span
                  key={`${itemId}-text-${index}`}
                  className="text-[11px] leading-5 text-white/75"
                >
                  {token.value}
                </span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * WorkflowMediaGallery
 * A dedicated gallery component for the Workflow Edit Page sidebar.
 * Displays media thumbnails with original aspect ratios and a 200px max height.
 * 
 * @param {Array} items - List of workflow media items
 * @param {Object} activeItem - Currently selected media item
 * @param {Function} onSelect - Selection callback
 * @param {String} className - Additional CSS classes
 */
export function WorkflowMediaGallery({
  items = [],
  activeItem = null,
  primaryMediaId = null,
  projectId = null,
  sessionId = null,
  onSelect = () => {},
  blockSelectWhenNotCompleted = false,
  className,
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const deleteMediaMutation = useDeleteMedia();
  const detachMediaMutation = useDetachMedia();

  const handleDetach = (mediaId) => {
    detachMediaMutation.mutate({ mediaId, projectId, sessionId });
  };

  const handleDelete = (mediaId) => {
    deleteMediaMutation.mutate({ mediaId });
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (!items || items.length === 0) return null;

  return (
    <div className={cn(
      "flex flex-col h-full p-4",
      className
    )}>
      {/* Gallery List - Vertical Stack */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="flex flex-col gap-8">
          {items.map((item) => {
            const meta = getItemMetadata(item);
            const isSelectable = !blockSelectWhenNotCompleted || (meta?.status === "completed" || meta?.status === "processing");
            const itemId = item.id || item.name;

            return (
              <WorkflowMediaGalleryCard
                key={itemId}
                item={item}
                activeItem={activeItem}
                primaryMediaId={primaryMediaId}
                isSelectable={isSelectable}
                onSelect={onSelect}
                onDetach={handleDetach}
                onDelete={handleDelete}
                isExpanded={expandedIds.has(itemId)}
                onToggleExpand={toggleExpand}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WorkflowMediaGallery;
