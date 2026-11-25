"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/base/button";
import { resolveMediaUrl } from "@/shared/lib/displayUtils";
import { AssetListItem } from "../AssetListItem";

const LIST_ITEM_EASE = [0.22, 1, 0.36, 1];
const LIST_COLLAPSE_EASE = [0.25, 1, 0.5, 1];

/**
 * ImportMediaListView
 * Google Flow inspired master-detail view for media assets:
 * - Left pane: list of assets. Clicking an item sets it as active to preview.
 * - Right pane: large hero preview pane with a single "Add to prompt" button to import directly.
 */
export function ImportMediaListView({
  items = [],
  listKey = "default",
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
  const prefersReducedMotion = useReducedMotion();
  const [internalFocusedId, setInternalFocusedId] = useState(propFocusedId ?? null);

  // Sync internal state whenever propFocusedId updates externally
  useEffect(() => {
    if (propFocusedId !== undefined && propFocusedId !== null) {
      setInternalFocusedId(propFocusedId);
    }
  }, [propFocusedId]);

  const loadMoreRef = useRef(null);

  // Flexible match function
  const matchesId = (item, targetId) => {
    if (!item || !targetId) return false;
    const candidates = [item.id, item.workflow_id, item.workflowId, item.name, item.url].filter(Boolean);
    return candidates.includes(targetId);
  };

  // Derive focused item from items (prefer propFocusedId immediately so removing an item never flashes items[0])
  const focusedItem = useMemo(() => {
    if (!items || items.length === 0) return null;
    const primaryId = propFocusedId ?? internalFocusedId;
    if (primaryId) {
      const found = items.find((item) => matchesId(item, primaryId));
      if (found) return found;
    }
    if (internalFocusedId && internalFocusedId !== primaryId) {
      const found = items.find((item) => matchesId(item, internalFocusedId));
      if (found) return found;
    }
    return items[0] || null;
  }, [items, propFocusedId, internalFocusedId]);

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
  const focusedItemKey = focusedItem
    ? focusedItem.id || focusedItem.workflow_id || focusedItem.workflowId || focusedUrl || focusedItem.name || "focused"
    : null;

  const rowInitial = prefersReducedMotion
    ? { opacity: 0, paddingBottom: 2 }
    : { opacity: 0, height: 0, x: -12, scale: 0.96, filter: "blur(2px)", paddingBottom: 0 };

  const rowAnimate = prefersReducedMotion
    ? { opacity: 1, paddingBottom: 2, transition: { duration: 0.12 } }
    : {
        opacity: 1,
        height: "auto",
        x: 0,
        scale: 1,
        filter: "blur(0px)",
        paddingBottom: 2,
        transition: { duration: 0.22, ease: LIST_ITEM_EASE },
      };

  const rowExit = prefersReducedMotion
    ? { opacity: 0, pointerEvents: "none", transition: { duration: 0.12 } }
    : {
        opacity: 0,
        x: -28,
        scale: 0.94,
        filter: "blur(2px)",
        height: 0,
        paddingBottom: 0,
        pointerEvents: "none",
        transition: {
          opacity: { duration: 0.2, ease: LIST_ITEM_EASE },
          x: { duration: 0.24, ease: LIST_ITEM_EASE },
          scale: { duration: 0.2, ease: LIST_ITEM_EASE },
          filter: { duration: 0.2, ease: LIST_ITEM_EASE },
          height: { duration: 0.24, delay: 0.08, ease: LIST_COLLAPSE_EASE },
          paddingBottom: { duration: 0.24, delay: 0.08, ease: LIST_COLLAPSE_EASE },
        },
      };

  const previewInitial = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.96, y: 6, filter: "blur(2px)" };

  const previewAnimate = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" };

  const previewExit = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.92, y: 14, filter: "blur(3px)" };

  const previewTransition = {
    duration: prefersReducedMotion ? 0.1 : 0.2,
    ease: LIST_ITEM_EASE,
  };

  return (
    <div className="flex-1 flex flex-row min-h-0 overflow-hidden gap-2">
      {/* ── Middle Pane: Scrollable Asset List (flow-add-menu-asset-list) ── */}
      <div
        role="listbox"
        aria-label="Asset list"
        className="w-[240px] shrink-0 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col pr-1"
      >
        <div key={listKey} className="flex flex-col flex-1">
          <AnimatePresence initial={false}>
            {items.map((item, idx) => {
              const itemUrl = getItemUrl(item);
              const { isVid, title } = getItemMetadata(item);
              const itemId = item.id || item.workflow_id || item.workflowId || item.url || item.name || String(idx);
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
                <motion.div
                  key={itemId}
                  role="presentation"
                  initial={rowInitial}
                  animate={rowAnimate}
                  exit={rowExit}
                  className="shrink-0 overflow-hidden"
                >
                  <AssetListItem
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
                </motion.div>
              );
            })}
          </AnimatePresence>

          {items.length === 0 && !loading && (
            <motion.div
              key="empty-assets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.18, delay: prefersReducedMotion ? 0 : 0.12 }}
              className="flex-1 flex items-center justify-center text-white/30 ds-type-small"
            >
              No assets found
            </motion.div>
          )}
        </div>

        {/* Loader for pagination */}
        {(hasMore || loading) && (
          <div ref={loadMoreRef} className="h-8 flex items-center justify-center shrink-0">
            {loading && <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />}
          </div>
        )}
      </div>

      {/* ── Right Pane: Large Detail & Preview Hero Pane (flow-add-menu-detail-pane) ── */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-2 rounded-comfortable bg-black/25 p-2 overflow-hidden">
        {/* Detail Preview Box */}
        <div className="flex-1 w-full min-h-0 relative flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {focusedItem ? (
              <motion.div
                key={focusedItemKey}
                initial={previewInitial}
                animate={previewAnimate}
                exit={previewExit}
                transition={previewTransition}
                className="size-full flex items-center justify-center"
              >
                {focusedMeta?.isVid ? (
                  <video
                    src={focusedUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    className="max-h-full max-w-full rounded-comfortable object-contain"
                  />
                ) : (
                  <img
                    src={focusedUrl}
                    alt={focusedMeta?.title || ""}
                    className="max-h-full max-w-full rounded-comfortable object-contain"
                  />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="no-item-selected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="size-full flex items-center justify-center text-white/25 ds-type-small"
              >
                No item selected
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Actions */}
        {focusedItem && (
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
                  className="w-full !h-8.5 rounded-subtle justify-center"
                >
                  Add to prompt
                </Button>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
