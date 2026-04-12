"use client";

import React, { useState } from "react";
import { Play, ImageIcon, Film, LayoutGrid, Trash2, Scissors } from "lucide-react";
import { useDeleteMedia, useDetachMedia } from "../api/workflowsApi";
import { ActionBtn } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem/ActionBtn";
import { ButtonGroup } from "@/shared/ui/button-group";
import { cn } from "@/shared/lib/utils";
import { getItemMetadata } from "@/shared/lib/generationUtils";
import { ImageStatusView } from "./ImageStatusView";

/**
 * WorkflowMediaGallery
 * A dedicated gallery component for the Workflow Edit Page.
 * Displays media thumbnails with original aspect ratios and a 100px height limit.
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

  const handleDetach = (e, mediaId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to detach this media to a new workflow?")) return;
    detachMediaMutation.mutate({ mediaId, projectId, sessionId });
  };

  const handleDelete = (e, mediaId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this media? This cannot be undone.")) return;
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
      "flex flex-col  h-full p-4",
      className
    )}>


      {/* Gallery List - Vertical Stack */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="flex flex-col gap-8">
          {items.map((item) => {
            const meta = getItemMetadata(item);
            const itemId = item.id || item.name;
            const isActive = activeItem && (itemId === activeItem.id || itemId === activeItem.name);
            const isPrimary = primaryMediaId && (itemId === primaryMediaId);
            const isSelectable = !blockSelectWhenNotCompleted || (meta?.status === "completed" || meta?.status === "processing");
            
            const iUrl = meta.url;
            const iVideo = meta.isVideo;
            const prompt = meta.prompt || item.prompt || "";
            
            // Get reference images from the correct paths (item.generationConfig.references or item.mediaMetadata.requestData.references)
            const referenceImages = 
              item.generationConfig?.references || 
              item.mediaMetadata?.requestData?.references || 
              item.mediaMetadata?.requestData?.referenceImages || 
              [];
              
            const firstRefUrl = referenceImages[0]?.url || referenceImages[0]?.file_url;
            const displayUrl = iUrl || ((meta.status === 'processing' || meta.status === 'uploading') ? firstRefUrl : null);
            
            return (
              <div 
                key={item.id || item.name}
                className="flex flex-col gap-3 group/item"
              >
                {/* Main Media Card */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSelectable) return;
                    onSelect(item);
                  }}
                  className={cn(
                    "relative rounded-2xl overflow-hidden border transition-all duration-300",
                    "group transform  self-start",
                    isSelectable ? "cursor-pointer" : "opacity-50 pointer-events-none",
                    isPrimary 
                      ? "border-white border-2 " 
                      : "border-white/5 opacity-80"
                  )}
                  style={{ 
                    maxWidth: "300px",
                    maxHeight: "200px",
                    width: (meta.status === "processing" || meta.status === "uploading" || !meta.url) ? "100%" : "auto",
                    height: "auto",
                    aspectRatio: meta.aspect && meta.aspect !== "auto" ? meta.aspect : "16/9"
                  }}
                >
                  <ImageStatusView
                    status={meta.status || 'completed'}
                    src={displayUrl}
                    alt={prompt}
                    aspect={meta.aspect || "auto"}
                    className="w-full h-full object-cover transition-transform duration-700"
                    showOverlay={true}
                  >
                    {iVideo && iUrl && (
                      <video 
                        src={iUrl} 
                        className="w-full h-full object-cover" 
                        muted 
                        loop 
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                    )}
                  </ImageStatusView>
                  
                  {/* Video Indicator */}
                  {iVideo && (
                    <div className="absolute top-3 right-3 p-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 z-10">
                      <Play className="size-3 fill-white text-white" />
                    </div>
                  )}
                  
                  {/* Selection Glow */}
                  {isActive && (
                    <div className="absolute inset-0 bg-white/5 pointer-events-none z-10" />
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <ButtonGroup className="bg-white/60 backdrop-blur-md rounded-lg scale-90 origin-top-left">
                      <ActionBtn
                        onClick={(e) => handleDetach(e, itemId)}
                        title="Detach to new workflow"
                      >
                        <Scissors className="size-3.5" />
                      </ActionBtn>
                      <ActionBtn
                        onClick={(e) => handleDelete(e, itemId)}
                        title="Delete media"
                      >
                        <Trash2 className="size-3.5" />
                      </ActionBtn>
                    </ButtonGroup>
                  </div>
                </div>

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
                    )})}
                  </div>
                )}

                {/* Prompt Text */}
                {prompt && (
                  <p
                    onClick={() => toggleExpand(itemId)}
                    className={cn(
                      "px-1 text-[11px] text-white font-medium transition-all duration-200 cursor-pointer select-none",
                      expandedIds.has(itemId) ? "" : "line-clamp-2"
                    )}
                    title={expandedIds.has(itemId) ? "" : prompt}
                  >
                    {prompt}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
