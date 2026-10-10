// [FSD Layer: shared/lib/optimistic] Generic optimistic mutation hook wrapping TanStack React Query.
// Owns: canceling queries, taking snapshots, applying pure optimistic updates, rolling back on error,
// notifying user/logger on failure, and conditional cache invalidation.
//
// Public: useOptimisticMutation({ mutationFn, getCacheKeys, applyOptimistic, invalidateKeys, ... })

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notifyOptimisticError } from "./notifyOptimisticError";

/**
 * Hook to execute optimistic mutations with standardized snapshot/rollback semantics.
 *
 * @param {Object} options
 * @param {Function} options.mutationFn - Async mutation function
 * @param {(vars: any) => Array<any>} options.getCacheKeys - Returns all query keys to optimistically patch
 * @param {(oldData: any, vars: any, key: any) => any} options.applyOptimistic - Pure updater function for cached data
 * @param {(vars: any) => Array<any>} [options.invalidateKeys] - Query keys to invalidate onSettled (defaults to getCacheKeys)
 * @param {string|((err: any, vars: any) => string)} [options.errorMessage] - User-facing error message or formatter
 * @param {(vars: any) => any} [options.getMutationKey] - Resolves mutationKey for concurrency checks
 * @param {any} [options.mutationKey] - Static mutationKey
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
  getMutationKey,
  mutationKey,
  onMutate: userOnMutate,
  onSuccess: userOnSuccess,
  onError: userOnError,
  onSettled: userOnSettled,
  ...restOptions
}) {
  const queryClient = useQueryClient();

  return useMutation({
    ...restOptions,
    mutationKey,
    mutationFn,

    onMutate: async (variables) => {
      const keys = typeof getCacheKeys === "function" ? getCacheKeys(variables) || [] : [];
      const snapshots = [];

      // 1. For each cache key: cancel in-flight queries and capture snapshot
      for (const key of keys) {
        if (!key) continue;
        await queryClient.cancelQueries({ queryKey: key });
        const previousData = queryClient.getQueryData(key);
        snapshots.push({ key, previousData });

        // 2. Apply optimistic patch ONLY if previous data exists in cache (cold cache stays untouched)
        if (previousData !== undefined && typeof applyOptimistic === "function") {
          queryClient.setQueryData(key, (old) => applyOptimistic(old, variables, key));
        }
      }

      // 3. Delegate to caller onMutate if supplied
      let userContext;
      if (typeof userOnMutate === "function") {
        userContext = await userOnMutate(variables);
      }

      return {
        snapshots,
        userContext,
      };
    },

    onError: (err, variables, context) => {
      // 1. Restore all captured snapshots
      if (context?.snapshots) {
        for (const { key, previousData } of context.snapshots) {
          if (previousData !== undefined) {
            queryClient.setQueryData(key, previousData);
          }
        }
      }

      // 2. Structured log and error toast
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
      // RACE CONDITION RULE:
      // If another in-flight mutation on the same entity is active (isMutating > 1),
      // we SKIP query invalidation. Invalidating now would re-fetch older server data
      // and overwrite a newer optimistic update that is still in progress.
      const mKey = typeof getMutationKey === "function" ? getMutationKey(variables) : mutationKey;
      const isStillMutating = mKey ? queryClient.isMutating({ mutationKey: mKey }) > 1 : false;

      if (!isStillMutating) {
        const invKeys =
          typeof invalidateKeys === "function"
            ? invalidateKeys(variables)
            : typeof getCacheKeys === "function"
            ? getCacheKeys(variables)
            : [];

        if (Array.isArray(invKeys)) {
          for (const key of invKeys) {
            if (key) {
              await queryClient.invalidateQueries({ queryKey: key });
            }
          }
        }
      }

      if (typeof userOnSettled === "function") {
        userOnSettled(data, err, variables, context?.userContext);
      }
    },
  });
}

export default useOptimisticMutation;
