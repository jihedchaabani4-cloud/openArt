// [FSD Layer: shared/lib/optimistic] Per-entity in-flight tracker for optimistic mutations.
// Owns: counting in-flight optimistic mutations per entity and their start order, scoped per
// QueryClient (WeakMap, so separate clients/tests never share state).
// Public: beginEntity(qc, key) -> seq · endEntity(qc, key) · inFlightCount(qc, key) · isLatest(qc, key, seq)
//         deferInvalidation(qc, key, queryKeys) · takeDeferred(qc, key) · uniqueKeys(queryKeys)
//
// Why not queryClient.isMutating({ mutationKey })? useMutation registers ONE static key per hook
// instance, so a per-variables key is never visible to isMutating, and two different hooks
// (move vs delete) touching the same entity would never see each other.

const registry = new WeakMap();

function entriesFor(queryClient) {
  let map = registry.get(queryClient);
  if (!map) {
    map = new Map();
    registry.set(queryClient, map);
  }
  return map;
}

function serialize(key) {
  return JSON.stringify(key);
}

/** Registers a starting mutation on `key`; returns its start sequence number. */
export function beginEntity(queryClient, key) {
  const map = entriesFor(queryClient);
  const id = serialize(key);
  const entry = map.get(id) || { inFlight: 0, latestSeq: 0 };
  entry.inFlight += 1;
  entry.latestSeq += 1;
  map.set(id, entry);
  return entry.latestSeq;
}

/** Marks one mutation on `key` as settled. Entry is dropped when nothing is in flight. */
export function endEntity(queryClient, key) {
  const map = entriesFor(queryClient);
  const id = serialize(key);
  const entry = map.get(id);
  if (!entry) return;
  entry.inFlight -= 1;
  if (entry.inFlight <= 0) map.delete(id);
}

/** Number of in-flight mutations on `key` (including the caller if it has not ended yet). */
export function inFlightCount(queryClient, key) {
  return entriesFor(queryClient).get(serialize(key))?.inFlight ?? 0;
}

/** True when no mutation on `key` started after the one identified by `seq`. */
export function isLatest(queryClient, key, seq) {
  const entry = entriesFor(queryClient).get(serialize(key));
  return !entry || entry.latestSeq === seq;
}

/** Stores query keys a non-last mutation skipped, so the last settler can invalidate them too. */
export function deferInvalidation(queryClient, key, queryKeys) {
  const entry = entriesFor(queryClient).get(serialize(key));
  if (!entry || !Array.isArray(queryKeys)) return;
  entry.deferred = [...(entry.deferred || []), ...queryKeys.filter(Boolean)];
}

/** Returns and clears the deferred query keys for `key`. */
export function takeDeferred(queryClient, key) {
  const entry = entriesFor(queryClient).get(serialize(key));
  const deferred = entry?.deferred || [];
  if (entry) entry.deferred = [];
  return deferred;
}

/** Removes duplicate query keys (structural equality). */
export function uniqueKeys(queryKeys) {
  const seen = new Set();
  return queryKeys.filter((k) => {
    const id = serialize(k);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
