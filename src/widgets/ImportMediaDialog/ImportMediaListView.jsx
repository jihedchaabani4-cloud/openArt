"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { resolveMediaUrl } from "@/shared/lib/displayUtils";
import { cn } from "@/shared/lib/utils";
import { AssetListItem } from "@/features/media";

/**
 * ImportMediaListView
 * Google Flow inspired master-detail view for media assets:
 * - Left pane: list of assets. Clicking an item sets it as active to preview.
 * - Right pane: large hero preview pane with a single "Ajouter au prompt" button to import directly.
 */
export function ImportMediaListView({
  items = [],
  focusedId: propFocusedId,
  onSelectDirect,
  loading = false,
  hasMore = false,
  onLoadMore,
  remainingImages,
  availableSlots,
  maxAllowed,
}) {
  const [internalFocusedId, setInternalFocusedId] = useState(null);
  const focusedId = propFocusedId !== undefined ? propFocusedId : internalFocusedId;
  const setFocusedId = setInternalFocusedId;
  const loadMoreRef = useRef(null);

  // Derive focused item from items
  const focusedItem = useMemo(() => {
    if (!items || items.length === 0) return null;
    if (focusedId) {
      const found = items.find((it) => (it.id || it.name || it.workflow_id) === focusedId);
      if (found) return found;
    }
    return items[0] || null;
  }, [items, focusedId]);

  // Update focusedId if focusedItem changes and focusedId is not set
  useEffect(() => {
    if (focusedItem && !focusedId) {
      setFocusedId(focusedItem.id || focusedItem.name || focusedItem.workflow_id);
    }
  }, [focusedItem, focusedId]);

  // Infinite scroll intersection observer for list
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && hasMore) {
          onLoadMore?.();
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  const getItemUrl = (item) => {
    return resolveMediaUrl(item) || item?.url || item?.image?.url || item?.video?.url || item?.file_url || "";
  };

  const getItemMetadata = (item) => {
    const isVid = Boolean(item?.is_video || item?.type === "video" || !!item?.video);
    const wType = String(item?.workflow_type || item?.workflowType || "").toUpperCase();
    const isChar = Boolean(item?.is_character || item?.type === "character" || wType === "CHARACTER" || wType === "CHARACTER_SHEET");
    const isElem = Boolean(item?.is_element || item?.type === "element" || wType === "ELEMENT" || wType === "ELEMENT_SHEET");

    let typeLabel = "Image";

    if (isChar) {
      typeLabel = "Personnage";
    } else if (isElem) {
      typeLabel = "Element";
    } else if (isVid) {
      typeLabel = "Video";
    }

    const title = item?.display_name || item?.metadata?.displayName || item?.name || item?.prompt || "Sans titre";

    return { isVid, isChar, isElem, typeLabel, title };
  };

  const focusedUrl = focusedItem ? getItemUrl(focusedItem) : "";
  const focusedMeta = focusedItem ? getItemMetadata(focusedItem) : null;

  return (
    <div className="flex-1 flex flex-row min-h-0 overflow-hidden gap-2">
      {/* ── Left Pane: Scrollable Asset List ── */}
      <div className="w-[230px] shrink-0 flex flex-col min-h-0 bg-transparent overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
          {items.map((item, idx) => {
            const itemUrl = getItemUrl(item);
            const { isVid, typeLabel, title } = getItemMetadata(item);
            const itemId = item.id || item.name || item.workflow_id || String(idx);
            const isFocused = (focusedItem?.id || focusedItem?.name || focusedItem?.workflow_id) === itemId;
            const candidateCount = item.image_count || 1;
            const isOverQuota = typeof remainingImages === "number"
              ? candidateCount > availableSlots
              : (typeof availableSlots === "number" ? availableSlots <= 0 : false);

            return (
              <AssetListItem
                key={itemId}
                item={item}
                itemUrl={itemUrl}
                title={title}
                typeLabel={typeLabel}
                isVideo={isVid}
                isActive={isFocused}
                isDisabled={isOverQuota}
                onClick={() => setFocusedId(itemId)}
                onDoubleClick={() => {
                  if (!isOverQuota) {
                    onSelectDirect?.(item);
                  }
                }}
              />
            );
          })}

          {/* Loader for pagination */}
          {(hasMore || loading) && (
            <div ref={loadMoreRef} className="h-8 flex items-center justify-center shrink-0">
              {loading && <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Pane: Detail & Preview Hero Pane ── */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#1e1f20]/80 rounded-card overflow-hidden relative">
        {focusedItem ? (
          <>
            {/* Center Hero Preview Area */}
            <div className="flex-1 w-full min-h-0 flex items-center justify-center p-3 relative overflow-hidden">
              {focusedMeta?.isVid ? (
                <video
                  src={focusedUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                />
              ) : (
                <img
                  src={focusedUrl}
                  alt=""
                  className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                />
              )}
            </div>

            {/* Bottom Actions Bar - Single Direct Add Button with Quota Feedback */}
            <div className="p-3 shrink-0 flex items-center justify-end gap-3 bg-transparent">
              {(() => {
                const focusedCandidateCount = focusedItem.image_count || 1;
                const isFocusedOverQuota = typeof remainingImages === "number"
                  ? focusedCandidateCount > availableSlots
                  : (typeof availableSlots === "number" ? availableSlots <= 0 : false);

                return (
                  <>
                    {isFocusedOverQuota && (
                      <span className="text-[11px] text-[#c4c7c5] font-normal select-none">
                        {typeof remainingImages === "number"
                          ? (focusedCandidateCount > 1
                              ? `Nécessite ${focusedCandidateCount} images (${availableSlots} restante${availableSlots > 1 ? "s" : ""})`
                              : `Limite atteinte (${availableSlots} restante)`)
                          : "Limite atteinte"}
                      </span>
                    )}
                    <Button
                      onClick={() => {
                        if (!isFocusedOverQuota) {
                          onSelectDirect?.(focusedItem);
                        }
                      }}
                      disabled={isFocusedOverQuota}
                      className={cn(
                        "h-9 px-4 rounded-button text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm select-none",
                        isFocusedOverQuota
                          ? "bg-white/10 text-white/40 cursor-not-allowed border border-white/5"
                          : "bg-white text-black hover:bg-white/90 active:scale-[0.97] cursor-pointer border-none"
                      )}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">
                        <GoogleIcon iconName={isFocusedOverQuota ? "block" : "add"} weight={300} className="text-[15px] leading-none" />
                      </span>
                      <span className="leading-none flex items-center">Ajouter au prompt</span>
                    </Button>
                  </>
                );
              })()}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/20 text-xs uppercase tracking-widest font-sans antialiased">
            No item selected
          </div>
        )}
      </div>
    </div>
  );
}
