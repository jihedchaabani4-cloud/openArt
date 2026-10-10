import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOptimisticMutation } from "./useOptimisticMutation";
import * as notifyModule from "./notifyOptimisticError";

vi.mock("./notifyOptimisticError", () => ({
  notifyOptimisticError: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("useOptimisticMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("success path: applies optimistic patch immediately, resolves mutationFn, and invalidates query", async () => {
    const { queryClient, wrapper } = createWrapper();
    const key = ["items", "p1"];
    queryClient.setQueryData(key, [{ id: "1", name: "Old" }]);

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn: async (vars) => ({ ok: true, id: vars.id }),
          getCacheKeys: () => [key],
          applyOptimistic: (old, vars) =>
            old.map((item) => (item.id === vars.id ? { ...item, name: vars.name } : item)),
          onSuccess,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({ id: "1", name: "New" });
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: key });
  });

  it("error path: rolls back cache snapshot exactly and notifies error toast", async () => {
    const { queryClient, wrapper } = createWrapper();
    const key = ["items", "p1"];
    const initialData = [{ id: "1", name: "Original" }];
    queryClient.setQueryData(key, initialData);

    const onError = vi.fn();
    const testError = new Error("Server rejected update");

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn: async () => {
            throw testError;
          },
          getCacheKeys: () => [key],
          applyOptimistic: (old, vars) =>
            old.map((item) => (item.id === vars.id ? { ...item, name: vars.name } : item)),
          errorMessage: "Failed to update item",
          onError,
        }),
      { wrapper }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: "1", name: "Changed" });
      } catch {
        // expected mutation rejection
      }
    });

    // Cache is restored to original snapshot
    expect(queryClient.getQueryData(key)).toEqual(initialData);

    // Toast/logger notification was called
    expect(notifyModule.notifyOptimisticError).toHaveBeenCalledWith(
      testError,
      "Failed to update item",
      expect.objectContaining({ variables: { id: "1", name: "Changed" } })
    );

    // User onError hook ran
    expect(onError).toHaveBeenCalledWith(
      testError,
      { id: "1", name: "Changed" },
      undefined
    );
  });

  it("handles two cache keys: patches both and rolls back both on error", async () => {
    const { queryClient, wrapper } = createWrapper();
    const key1 = ["projectData", "p1"];
    const key2 = ["folders", "p1"];

    const initData1 = { workflows: [{ id: "w1", folderId: null }] };
    const initData2 = [{ id: "f1", name: "Folder 1" }];

    queryClient.setQueryData(key1, initData1);
    queryClient.setQueryData(key2, initData2);

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn: async () => {
            throw new Error("Batch move failed");
          },
          getCacheKeys: () => [key1, key2],
          applyOptimistic: (old, vars, k) => {
            if (k === key1) {
              return {
                ...old,
                workflows: old.workflows.map((w) =>
                  w.id === vars.id ? { ...w, folderId: vars.folderId } : w
                ),
              };
            }
            if (k === key2) {
              return old.map((f) => (f.id === vars.folderId ? { ...f, count: 1 } : f));
            }
            return old;
          },
        }),
      { wrapper }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: "w1", folderId: "f1" });
      } catch {
        // expected
      }
    });

    // Both keys are restored to exact snapshots
    expect(queryClient.getQueryData(key1)).toEqual(initData1);
    expect(queryClient.getQueryData(key2)).toEqual(initData2);
  });

  it("does not crash or set optimistic data when cache snapshot is undefined (cold cache)", async () => {
    const { queryClient, wrapper } = createWrapper();
    const key = ["nonExistent", "p1"];
    const applyOptimistic = vi.fn();

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn: async () => ({ success: true }),
          getCacheKeys: () => [key],
          applyOptimistic,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({});
    });

    // applyOptimistic is NOT called when there was no cached data to patch
    expect(applyOptimistic).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(key)).toBeUndefined();
  });

  it("calls user onMutate, onSuccess, and onSettled with correct contexts", async () => {
    const { queryClient, wrapper } = createWrapper();
    const key = ["items", "p1"];
    queryClient.setQueryData(key, []);

    const userOnMutate = vi.fn().mockResolvedValue({ customMeta: 123 });
    const userOnSuccess = vi.fn();
    const userOnSettled = vi.fn();

    const { result } = renderHook(
      () =>
        useOptimisticMutation({
          mutationFn: async (vars) => ({ id: vars.id }),
          getCacheKeys: () => [key],
          applyOptimistic: (old) => old,
          onMutate: userOnMutate,
          onSuccess: userOnSuccess,
          onSettled: userOnSettled,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.mutateAsync({ id: "item-1" });
    });

    expect(userOnMutate).toHaveBeenCalledWith({ id: "item-1" });
    expect(userOnSuccess).toHaveBeenCalledWith(
      { id: "item-1" },
      { id: "item-1" },
      { customMeta: 123 }
    );
    expect(userOnSettled).toHaveBeenCalledWith(
      { id: "item-1" },
      null,
      { id: "item-1" },
      { customMeta: 123 }
    );
  });

  it("skips query invalidation if another in-flight mutation on same entity is active", async () => {
    const { queryClient, wrapper } = createWrapper();
    const key = ["folder", "f1"];
    queryClient.setQueryData(key, []);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    let releaseSlow;
    const slowPromise = new Promise((r) => { releaseSlow = r; });
    const options = (fn) => ({
      mutationFn: fn,
      getCacheKeys: () => [key],
      getEntityKey: (vars) => ["folder", vars.id],
      applyOptimistic: (old) => old,
    });

    const { result } = renderHook(
      () => ({
        slow: useOptimisticMutation(options(() => slowPromise)),
        fast: useOptimisticMutation(options(async () => ({ ok: true }))),
      }),
      { wrapper }
    );

    act(() => result.current.slow.mutate({ id: "f1" }));
    await act(async () => {
      await result.current.fast.mutateAsync({ id: "f1" });
    });

    // "slow" is still in flight on the same entity: invalidating now could overwrite its newer state
    expect(invalidateSpy).not.toHaveBeenCalled();

    await act(async () => releaseSlow({ ok: true }));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: key });
  });
});
