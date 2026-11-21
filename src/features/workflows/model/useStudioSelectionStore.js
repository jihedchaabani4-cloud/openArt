// [FSD Layer: features/workflows/model] — Ephemeral (non-persisted) multi-select state for Cinema Studio grids.
import { create } from "zustand";

/**
 * Builds the canonical composite selection key (`workflow:<id>` or `collection:<id>`).
 *
 * @param {"workflow"|"collection"} itemType
 * @param {string|number} id
 * @returns {string|null}
 */
export function makeSelectionKey(itemType, id) {
  if (!itemType || id == null || id === "") return null;
  const normalizedType = itemType === "collection" ? "collection" : "workflow";
  return `${normalizedType}:${String(id)}`;
}

/**
 * Parses a composite selection key back into `{ itemType, id }`.
 *
 * @param {string} key
 * @returns {{ itemType: "workflow"|"collection"|null, id: string|null }}
 */
export function parseSelectionKey(key) {
  if (typeof key !== "string") return { itemType: null, id: null };
  const sepIndex = key.indexOf(":");
  if (sepIndex <= 0 || sepIndex === key.length - 1) {
    return { itemType: null, id: null };
  }
  const itemType = key.slice(0, sepIndex);
  const id = key.slice(sepIndex + 1);
  if (itemType !== "workflow" && itemType !== "collection") {
    return { itemType: null, id: null };
  }
  return { itemType, id };
}

/**
 * Resolves a canonical selection key from any studio grid representation:
 * - Normalized grid entries: `{ type: "collection" | "workflow", data }`
 * - Photo objects: `{ itemType, workflow, collection }`
 * - Selected entries: `{ itemType, id }`
 * - Raw workflow objects: `{ id, name }`
 *
 * @param {Object|string|null} entry
 * @returns {string|null}
 */
export function getEntrySelectionKey(entry) {
  if (!entry) return null;
  if (typeof entry === "string") {
    return parseSelectionKey(entry).id ? entry : null;
  }
  if (typeof entry !== "object") return null;

  if (entry.type === "collection") {
    const col = entry.data || entry.collection || entry;
    return makeSelectionKey("collection", col?.id ?? col?.folderId ?? col?._id);
  }
  if (entry.type === "workflow") {
    const wf = entry.data || entry.workflow || entry;
    return makeSelectionKey("workflow", wf?.id ?? wf?.name);
  }

  if (
    entry.itemType === "collection" ||
    (entry.collection && !entry.workflow && entry.itemType !== "workflow")
  ) {
    const col = entry.collection || entry.data || entry;
    return makeSelectionKey("collection", col?.id ?? col?.folderId ?? col?._id ?? entry.id);
  }
  if (entry.itemType === "workflow" || entry.workflow) {
    const wf = entry.workflow || entry.data || entry;
    return makeSelectionKey("workflow", wf?.id ?? wf?.name ?? entry.id);
  }

  return makeSelectionKey("workflow", entry.id ?? entry.name);
}

const EMPTY_KEYS = [];
const EMPTY_SET = new Set();

/**
 * O(1) membership lookup that remains safe if a caller/test replaces
 * `selectedKeys` directly via `useStudioSelectionStore.setState({ selectedKeys })`.
 *
 * @param {Object} state
 * @param {string|null} key
 * @returns {boolean}
 */
export function hasSelectedKey(state, key) {
  if (!key || !state) return false;
  if (state._selectedSetKeys === state.selectedKeys) {
    return state.selectedSet.has(key);
  }
  return state.selectedKeys.includes(key);
}

function getSelectedSet(state) {
  return state._selectedSetKeys === state.selectedKeys
    ? state.selectedSet
    : new Set(state.selectedKeys);
}

function withSelection(next, nextSet, lastSelectedKey) {
  if (next.length === 0) {
    return {
      selectedKeys: EMPTY_KEYS,
      selectedSet: EMPTY_SET,
      _selectedSetKeys: EMPTY_KEYS,
      lastSelectedKey: null,
    };
  }
  return {
    selectedKeys: next,
    selectedSet: nextSet,
    _selectedSetKeys: next,
    lastSelectedKey,
  };
}

/**
 * Non-persisted Zustand store owning the active Cinema Studio selection scope & selected keys.
 */
export const useStudioSelectionStore = create((set) => ({
  scopeKey: null,
  selectedKeys: EMPTY_KEYS,
  selectedSet: EMPTY_SET,
  _selectedSetKeys: EMPTY_KEYS,
  lastSelectedKey: null,

  setScope: (scopeKey) =>
    set((state) => {
      if (scopeKey === state.scopeKey) return state;
      return {
        scopeKey,
        ...withSelection(EMPTY_KEYS, EMPTY_SET, null),
      };
    }),

  toggleItem: (key, { shiftKey = false, orderedKeys = [] } = {}) =>
    set((state) => {
      if (!key) return state;

      if (shiftKey && state.lastSelectedKey && Array.isArray(orderedKeys) && orderedKeys.length > 0) {
        const anchorIdx = orderedKeys.indexOf(state.lastSelectedKey);
        const targetIdx = orderedKeys.indexOf(key);
        if (anchorIdx !== -1 && targetIdx !== -1) {
          const start = Math.min(anchorIdx, targetIdx);
          const end = Math.max(anchorIdx, targetIdx);
          const nextSet = new Set(getSelectedSet(state));
          const next = [...state.selectedKeys];
          for (let i = start; i <= end; i++) {
            const rangeKey = orderedKeys[i];
            if (rangeKey && !nextSet.has(rangeKey)) {
              nextSet.add(rangeKey);
              next.push(rangeKey);
            }
          }
          return withSelection(next, nextSet, key);
        }
      }

      const currentSet = getSelectedSet(state);
      const nextSet = new Set(currentSet);
      if (currentSet.has(key)) {
        nextSet.delete(key);
        const next = state.selectedKeys.filter((k) => k !== key);
        return withSelection(next, nextSet, next.length === 0 ? null : key);
      }

      nextSet.add(key);
      return withSelection([...state.selectedKeys, key], nextSet, key);
    }),

  toggleGroup: (keys = []) =>
    set((state) => {
      const cleanKeys = [...new Set((keys || []).filter(Boolean))];
      if (cleanKeys.length === 0) return state;

      const currentSet = getSelectedSet(state);
      const allSelected = cleanKeys.every((k) => currentSet.has(k));

      if (allSelected) {
        const removeSet = new Set(cleanKeys);
        const next = state.selectedKeys.filter((k) => !removeSet.has(k));
        const nextLast =
          next.length === 0
            ? null
            : removeSet.has(state.lastSelectedKey)
              ? next[next.length - 1]
              : state.lastSelectedKey;
        return withSelection(next, new Set(next), nextLast);
      }

      const next = [...state.selectedKeys];
      const nextSet = new Set(currentSet);
      for (const k of cleanKeys) {
        if (!nextSet.has(k)) {
          nextSet.add(k);
          next.push(k);
        }
      }
      return withSelection(next, nextSet, cleanKeys[cleanKeys.length - 1]);
    }),

  selectAll: (keys = []) =>
    set((state) => {
      const nextSet = new Set((keys || []).filter(Boolean));
      const next = Array.from(nextSet);
      if (
        next.length === state.selectedKeys.length &&
        next.every((k, i) => k === state.selectedKeys[i])
      ) {
        return state;
      }
      return withSelection(next, nextSet, next.length > 0 ? next[next.length - 1] : null);
    }),

  setSelectedKeys: (keys = []) =>
    set((state) => {
      const nextSet = new Set(
        (Array.isArray(keys) ? keys : []).filter((k) => typeof k === "string" && k.length > 0)
      );
      const next = Array.from(nextSet);
      if (
        next.length === state.selectedKeys.length &&
        next.every((k, i) => k === state.selectedKeys[i])
      ) {
        return state;
      }
      return withSelection(next, nextSet, next.length === 0 ? null : state.lastSelectedKey);
    }),

  pruneToVisible: (visibleKeys = []) =>
    set((state) => {
      if (state.selectedKeys.length === 0) return state;
      const visibleSet = new Set((visibleKeys || []).filter(Boolean));
      const next = state.selectedKeys.filter((k) => visibleSet.has(k));
      if (next.length === state.selectedKeys.length) return state;
      return withSelection(
        next,
        new Set(next),
        next.length === 0
          ? null
          : visibleSet.has(state.lastSelectedKey)
            ? state.lastSelectedKey
            : next[next.length - 1]
      );
    }),

  clearSelection: () =>
    set((state) => {
      if (state.selectedKeys.length === 0 && state.lastSelectedKey === null) {
        return state;
      }
      return withSelection(EMPTY_KEYS, EMPTY_SET, null);
    }),
}));

export default useStudioSelectionStore;
