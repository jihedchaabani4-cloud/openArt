// [FSD Layer: shared/lib/optimistic] Generic optimistic mutation hook wrapping TanStack React Query.
// Owns: canceling queries, taking snapshots, applying pure optimistic updates, rolling back on error,
// notifying user/logger on failure, conditional cache invalidation, and per-entity concurrency.
//
// Public: useOptimisticMutation({ mutationFn, getCacheKeys, applyOptimistic, invalidateKeys, ... })

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifyOptimisticError } from "./notifyOptimisticError";
import {
  beginEntity,
  endEntity,
  inFlightCount,
  isLatest,
  deferInvalidation,
  takeDeferred,
  uniqueKeys,
} from "./entityTracker";

/**
 * Hook to execute optimistic mutations with standardized snapshot/rollback semantics.
 *
 * CONCURRENCY RULES (only when an entity key is provided):
 * - Invalidation: only the LAST in-flight mutation on an entity invalidates. Earlier ones skip it,
 *   otherwise their refetch would bring back older server data over a newer optimistic state
 *   (e.g. "move" settling while "delete" on the same item is still pending).
 * - Rollback: a failing mutation restores its snapshot ONLY if it is alone and no newer mutation
 *   started after it. Otherwise its snapshot predates newer optimistic changes and restoring it
 *   would wipe them; the last settler's invalidation brings the server truth instead.
 *
 * @param {Object} options
 * @param {Function} options.mutationFn - Async mutation function
 * @param {(vars: any) => Array<any>} options.getCacheKeys - Returns all query keys to optimistically patch
 * @param {(oldData: any, vars: any, key: any) => any} options.applyOptimistic - Pure updater function for cached data
 * @param {(vars: any) => Array<any>} [options.invalidateKeys] - Query keys to invalidate onSettled (defaults to getCacheKeys)
 * @param {string|((err: any, vars: any) => string)} [options.errorMessage] - User-facing error message or formatter
 * @param {(vars: any) => any} [options.getEntityKey] - Entity touched by this call (use shared/lib/optimistic/entityKeys)
 * @param {(vars: any) => any} [options.getMutationKey] - Legacy alias of getEntityKey
 * @param {any} [options.mutationKey] - Static mutationKey (passed to useMutation; also used as entity key fallback)
 * @param {Function} [options.onMutate] - User onMutate hook
 * @param {Function} [options.onSuccess] - User onSuccess hook
 * @param {Function} [options.onError] - User onError hook
 * @param {Function} [options.onSettled] - User onSettled hook
 * @returns {import('@tanstack/react-query').UseMutationResult}
 */
export function useOptimisticMutation({
  mutationFn,
  getCacheKeys,
  applyOptimistic,
  invalidateKeys,
  errorMessage,
  getEntityKey,
  getMutationKey,
  mutationKey,
  onMutate: userOnMutate,
  onSuccess: userOnSuccess,
  onError: userOnError,
  onSettled: userOnSettled,
  ...restOptions
}) {
  const queryClient = useQueryClient();

  const resolveEntityKey = (variables) => {
    if (typeof getEntityKey === "function") return getEntityKey(variables);
    if (typeof getMutationKey === "function") return getMutationKey(variables);
    return mutationKey;
  };

  return useMutation({
    ...restOptions,
    mutationKey,
    mutationFn,

    onMutate: async (variables) => {
      // 1. Run user onMutate first so variables/context can be initialized (e.g. temp IDs)
      let userContext;
      if (typeof userOnMutate === "function") {
        userContext = await userOnMutate(variables);
      }

      // 2. Register on the entity BEFORE any await, so concurrent calls see each other
      const entityKey = resolveEntityKey(variables);
      const entity = entityKey ? { key: entityKey, seq: beginEntity(queryClient, entityKey) } : null;

      try {
        const keys = typeof getCacheKeys === "function" ? getCacheKeys(variables) || [] : [];
        const snapshots = [];

        // 3. For each cache key: cancel in-flight queries and capture snapshot
        for (const key of keys) {
          if (!key) continue;
          await queryClient.cancelQueries({ queryKey: key });
          const previousData = queryClient.getQueryData(key);
          snapshots.push({ key, previousData });

          // 4. Apply optimistic patch ONLY if previous data exists in cache (cold cache stays untouched)
          if (previousData !== undefined && typeof applyOptimistic === "function") {
            queryClient.setQueryData(key, (old) => applyOptimistic(old, variables, key));
          }
        }

        return { snapshots, userContext, entity };
      } catch (err) {
        // Never leak an in-flight slot: it would block invalidation for this entity forever.
        if (entity) endEntity(queryClient, entity.key);
        throw err;
      }
    },

    onError: (err, variables, context) => {
      // 1. Restore snapshots, unless newer optimistic state on the same entity would be wiped
      const entity = context?.entity;
      const canRestore =
        !entity ||
        (inFlightCount(queryClient, entity.key) <= 1 && isLatest(queryClient, entity.key, entity.seq));

      if (canRestore && context?.snapshots) {
        for (const { key, previousData } of context.snapshots) {
          if (previousData !== undefined) {
            queryClient.setQueryData(key, previousData);
          }
        }
      }

      // 2. Structured log and error toast (always: the user must know the action failed)
      const customMsg = typeof errorMessage === "function" ? errorMessage(err, variables) : errorMessage;
      notifyOptimisticError(err, customMsg, { variables });

      // 3. Delegate to caller onError
      if (typeof userOnError === "function") {
        userOnError(err, variables, context?.userContext);
      }
    },

    onSuccess: (data, variables, context) => {
      if (typeof userOnSuccess === "function") {
        userOnSuccess(data, variables, context?.userContext);
      }
    },

    onSettled: async (data, err, variables, context) => {
      const entity = context?.entity;
      // Only the last in-flight mutation on an entity syncs with the server (see header rules).
      const isLastOnEntity = !entity || inFlightCount(queryClient, entity.key) <= 1;

      try {
        const ownKeys =
          typeof invalidateKeys === "function"
            ? invalidateKeys(variables)
            : typeof getCacheKeys === "function"
            ? getCacheKeys(variables)
            : [];
        const safeOwnKeys = Array.isArray(ownKeys) ? ownKeys : [];

        if (!isLastOnEntity) {
          // Hand our keys to the last settler (its invalidateKeys may not cover ours).
          deferInvalidation(queryClient, entity.key, safeOwnKeys);
        } else {
          const deferred = entity ? takeDeferred(queryClient, entity.key) : [];
          for (const key of uniqueKeys([...safeOwnKeys, ...deferred])) {
            if (key) {
              await queryClient.invalidateQueries({ queryKey: key });
            }
          }
        }
      } finally {
        if (entity) endEntity(queryClient, entity.key);
      }

      if (typeof userOnSettled === "function") {
        userOnSettled(data, err, variables, context?.userContext);
      }
    },
  });
}

export default useOptimisticMutation;
