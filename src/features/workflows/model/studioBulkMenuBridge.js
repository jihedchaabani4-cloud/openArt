// [FSD Layer: features/workflows/model] — Zero-subscription bridge from StudioSelectionBar to bulk card context menus.

let activeBulkMenuGetter = null;

/**
 * Registers the live bulk-menu snapshot getter owned by the mounted StudioSelectionBarContent.
 * Returns an unregister cleanup that only clears if this getter is still the active one.
 */
export function registerBulkMenuProvider(getter) {
  if (typeof getter !== "function") {
    return () => {};
  }
  activeBulkMenuGetter = getter;
  return () => {
    if (activeBulkMenuGetter === getter) {
      activeBulkMenuGetter = null;
    }
  };
}

/**
 * Lazily reads the current bulk selection snapshot (only invoked when opening a selected card's context menu).
 */
export function getBulkContextMenuSnapshot() {
  return typeof activeBulkMenuGetter === "function"
    ? activeBulkMenuGetter()
    : null;
}
