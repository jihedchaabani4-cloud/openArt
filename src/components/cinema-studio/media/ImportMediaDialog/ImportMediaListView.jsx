"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/base/button";
import { resolveMediaUrl } from "@/shared/lib/displayUtils";
import { AssetListItem } from "../AssetListItem";

/**
 * ImportMediaListView
 * Google Flow inspired master-detail view for media assets:
 * - Left pane: list of assets. Clicking an item sets it as active to preview.
 * - Right pane: large hero preview pane with a single "Ajouter au prompt" button to import directly.
 */
export function ImportMediaListView({
  items = [],
  focusedId: propFocusedId,
  onFocusChange,
  onSelectDirect,
  loading = false,
  hasMore = false,
  onLoadMore,
  remainingImages,
  availableSlots,
  maxAllowed: _maxAllowed,
}) {
  const [internalFocusedId, setInternalFocusedId] = useState(propFocusedId ?? null);

  // Sync internal state whenever propFocusedId updates externally
  useEffect(() => {
    if (propFocusedId !== undefined && propFocusedId !== null) {
      setInternalFocusedId(propFocusedId);
    }
  }, [propFocusedId]);

  const focusedId = internalFocusedId ?? propFocusedId;
  const loadMoreRef = useRef(null);

  // Flexible match function
  const matchesFocused = (item) => {
    if (!item || !focusedId) return false;
    const candidates = [item.id, item.workflow_id, item.workflowId, item.name, item.url].filter(Boolean);
    return candidates.includes(focusedId);
  };

  // Derive focused item from items
  const focusedItem = useMemo(() => {
    if (!items || items.length === 0) return null;
    if (focusedId) {
      const found = items.find(matchesFocused);
      if (found) return found;
    }
    return items[0] || null;
  }, [items, focusedId]);

  // Update focusedId if focusedItem changes and focusedId is not set
  useEffect(() => {
    if (focusedItem && !internalFocusedId) {
      const initialId = focusedItem.id || focusedItem.workflow_id || focusedItem.name;
      setInternalFocusedId(initialId);
    }
  }, [focusedItem, internalFocusedId]);

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
    const title = item?.display_name || item?.metadata?.displayName || item?.name || item?.prompt || "Sans titre";
    return { isVid, title };
  };

  const focusedUrl = focusedItem ? getItemUrl(focusedItem) : "";
  const focusedMeta = focusedItem ? getItemMetadata(focusedItem) : null;

  return (
    <div className="flex-1 flex flex-row min-h-0 overflow-hidden gap-2">
      {/* ── Middle Pane: Scrollable Asset List (flow-add-menu-asset-list) ── */}
      <div
        role="listbox"
        aria-label="Asset list"
        className="w-[240px] shrink-0 overflow-y-auto custom-scrollbar flex flex-col gap-0.5 pr-1"
      >
        {items.length === 0 && !loading ? (
          <div className="flex-1 flex items-center justify-center text-white/30 text-xs">
            No assets found
          </div>
        ) : (
          items.map((item, idx) => {
            const itemUrl = getItemUrl(item);
            const { isVid, title } = getItemMetadata(item);
            const itemId = item.id || item.workflow_id || item.name || String(idx);
            const isFocused = Boolean(
              focusedItem &&
              (
                item === focusedItem ||
                (item.id && (item.id === focusedItem.id || item.id === focusedItem.workflow_id)) ||
                (item.workflow_id && (item.workflow_id === focusedItem.workflow_id || item.workflow_id === focusedItem.id)) ||
                (item.url && item.url === focusedItem.url)
              )
            );
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
                isVideo={isVid}
                isActive={isFocused}
                isDisabled={isOverQuota}
                onClick={() => {
                  setInternalFocusedId(itemId);
                  onFocusChange?.(item, idx, itemId);
                }}
                onDoubleClick={() => {
                  if (!isOverQuota) {
                    onSelectDirect?.(item);
                  }
                }}
              />
            );
          })
        )}

        {/* Loader for pagination */}
        {(hasMore || loading) && (
          <div ref={loadMoreRef} className="h-8 flex items-center justify-center shrink-0">
            {loading && <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />}
          </div>
        )}
      </div>

      {/* ── Right Pane: Large Detail & Preview Hero Pane (flow-add-menu-detail-pane) ── */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-2 rounded-xl bg-black/25 p-2 overflow-hidden">
        {focusedItem ? (
          <>
            {/* Detail Preview Box */}
            <div className="flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden">
              {focusedMeta?.isVid ? (
                <video
                  src={focusedUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              ) : (
                <img
                  src={focusedUrl}
                  alt={focusedMeta?.title || ""}
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              )}
            </div>

            {/* Bottom Actions */}
            <div className="shrink-0 flex items-center">
              {(() => {
                const focusedCandidateCount = focusedItem.image_count || 1;
                const isFocusedOverQuota = typeof remainingImages === "number"
                  ? focusedCandidateCount > availableSlots
                  : (typeof availableSlots === "number" ? availableSlots <= 0 : false);

                return (
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (!isFocusedOverQuota) {
                        onSelectDirect?.(focusedItem);
                      }
                    }}
                    disabled={isFocusedOverQuota}
                    className="w-full !h-8.5 rounded-lg text-xs font-medium justify-center"
                  >
                    Add to prompt
                  </Button>
                );
              })()}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/25 text-xs">
            No item selected
          </div>
        )}
      </div>
    </div>
  );
}
