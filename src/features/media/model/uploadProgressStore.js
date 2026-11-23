import { useSyncExternalStore } from "react";

const stateById = new Map();
const listenersById = new Map();
const fileToUploadId = new WeakMap();

function notify(id) {
  const listeners = listenersById.get(id);
  if (!listeners) return;
  listeners.forEach((listener) => listener());
}

export function clampUploadPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(100, Math.max(0, Math.round(num)));
}

export function registerUploadFile(file, uploadId) {
  if (!file || typeof file !== "object" || !uploadId) return;
  fileToUploadId.set(file, String(uploadId));
}

export function takeUploadIdForFile(file) {
  if (!file || typeof file !== "object") return null;
  const id = fileToUploadId.get(file) || null;
  if (id) fileToUploadId.delete(file);
  return id;
}

export function setUploadProgress(uploadId, percent, phase = "uploading") {
  if (!uploadId) return;
  const key = String(uploadId);
  const clamped = clampUploadPercent(percent);
  const normalizedPhase = phase || "uploading";
  const prev = stateById.get(key);
  if (prev && prev.percent === clamped && prev.phase === normalizedPhase) return;
  stateById.set(key, { percent: clamped, phase: normalizedPhase });
  notify(key);
}

export function clearUploadProgress(uploadId) {
  if (!uploadId) return;
  const key = String(uploadId);
  if (!stateById.has(key)) return;
  stateById.delete(key);
  notify(key);
}

export function getUploadState(uploadId) {
  if (!uploadId) return undefined;
  return stateById.get(String(uploadId));
}

export function getUploadProgress(uploadId) {
  return getUploadState(uploadId)?.percent;
}

function subscribeToUpload(uploadId, listener) {
  if (!uploadId) return () => {};
  const key = String(uploadId);
  let set = listenersById.get(key);
  if (!set) {
    set = new Set();
    listenersById.set(key, set);
  }
  set.add(listener);
  return () => {
    const current = listenersById.get(key);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      listenersById.delete(key);
    }
  };
}

/**
 * Subscribes only to a single upload item's live state ({ percent, phase })
 * so upload progress ticks never re-render sibling gallery cards.
 */
export function useUploadState(uploadId) {
  const key = uploadId ? String(uploadId) : null;
  return useSyncExternalStore(
    (onStoreChange) => subscribeToUpload(key, onStoreChange),
    () => getUploadState(key),
    () => undefined
  );
}

export function useUploadProgress(uploadId) {
  return useUploadState(uploadId)?.percent;
}
