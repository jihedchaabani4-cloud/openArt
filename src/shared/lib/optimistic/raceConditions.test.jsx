import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useOptimisticMutation } from "./useOptimisticMutation";
import * as notifyModule from "./notifyOptimisticError";

vi.mock("./notifyOptimisticError", () => ({ notifyOptimisticError: vi.fn() }));

const KEY = ["folders", "p1"];

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

// Each test builds a fake "server" plus an active useQuery observer, so invalidation really
// refetches and the final cache can be compared with the server state.
function folderMutation(mutationFn, applyOptimistic) {
  return {
    mutationFn,
    getCacheKeys: () => [KEY],
    getEntityKey: (vars) => ["folder", vars.id],
    applyOptimistic,
  };
}

const rename = (old, v) => old.map((f) => (f.id === v.id ? { ...f, name: v.name } : f));
const move = (old, v) => old.map((f) => (f.id === v.id ? { ...f, parentId: v.parentId } : f));
const remove = (old, v) => old.filter((f) => f.id !== v.id);

describe("Phase 6 race conditions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("T6.1 move then delete: the first onSettled does not refetch a stale item back", async () => {
    const { queryClient, wrapper } = createWrapper();
    let server = [{ id: "f1", name: "A", parentId: null }];
    const queryFn = vi.fn(async () => structuredClone(server));
    const moveD = deferred();
    const delD = deferred();

    const { result } = renderHook(
      () => ({
        q: useQuery({ queryKey: KEY, queryFn }),
        move: useOptimisticMutation(folderMutation(() => moveD.promise, move)),
        del: useOptimisticMutation(folderMutation(() => delD.promise, remove)),
      }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.q.data).toHaveLength(1));

    act(() => result.current.move.mutate({ id: "f1", parentId: "p" }));
    await waitFor(() => expect(queryClient.getQueryData(KEY)[0].parentId).toBe("p"));

    act(() => result.current.del.mutate({ id: "f1" }));
    await waitFor(() => expect(queryClient.getQueryData(KEY)).toHaveLength(0));

    // Server applies the move; the delete is still in flight.
    server = [{ id: "f1", name: "A", parentId: "p" }];
    await act(async () => moveD.resolve({ ok: true }));
    await act(async () => {});

    expect(queryFn).toHaveBeenCalledTimes(1); // no refetch while the delete is pending
    expect(queryClient.getQueryData(KEY)).toHaveLength(0); // f1 did not come back

    server = [];
    await act(async () => delD.resolve({ ok: true }));
    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2)); // last settler syncs
    expect(queryClient.getQueryData(KEY)).toEqual([]);
  });

  it("T6.2 three rapid actions: a failing first action does not wipe newer optimistic state; final = server", async () => {
    const { queryClient, wrapper } = createWrapper();
    let server = [{ id: "f1", name: "A", parentId: null }];
    const queryFn = vi.fn(async () => structuredClone(server));
    const d1 = deferred();
    const d2 = deferred();
    const d3 = deferred();
    const queue = [d1, d2, d3];

    const { result } = renderHook(
      () => ({
        q: useQuery({ queryKey: KEY, queryFn }),
        rename: useOptimisticMutation(folderMutation(() => queue.shift().promise, rename)),
      }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.q.data).toHaveLength(1));

    act(() => result.current.rename.mutate({ id: "f1", name: "B1" }));
    await waitFor(() => expect(queryClient.getQueryData(KEY)[0].name).toBe("B1"));
    act(() => result.current.rename.mutate({ id: "f1", name: "B2" }));
    await waitFor(() => expect(queryClient.getQueryData(KEY)[0].name).toBe("B2"));
    act(() => result.current.rename.mutate({ id: "f1", name: "B3" }));
    await waitFor(() => expect(queryClient.getQueryData(KEY)[0].name).toBe("B3"));

    // First action fails while the two newer ones are still in flight.
    await act(async () => d1.reject(new Error("rename rejected")));
    await act(async () => {});

    expect(notifyModule.notifyOptimisticError).toHaveBeenCalledTimes(1); // user still told
    expect(queryClient.getQueryData(KEY)[0].name).toBe("B3"); // newer state kept
    expect(queryFn).toHaveBeenCalledTimes(1);

    server = [{ id: "f1", name: "B2", parentId: null }];
    await act(async () => d2.resolve({ ok: true }));
    await act(async () => {});
    expect(queryFn).toHaveBeenCalledTimes(1); // still one in flight -> no refetch
    expect(queryClient.getQueryData(KEY)[0].name).toBe("B3");

    server = [{ id: "f1", name: "B3", parentId: null }];
    await act(async () => d3.resolve({ ok: true }));
    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
    expect(queryClient.getQueryData(KEY)).toEqual(server);
  });

  it("a lone failing mutation still restores its snapshot", async () => {
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(KEY, [{ id: "f1", name: "A" }]);
    const { result } = renderHook(
      () =>
        useOptimisticMutation(
          folderMutation(async () => {
            throw new Error("nope");
          }, rename)
        ),
      { wrapper }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({ id: "f1", name: "Z" });
      } catch {
        // expected
      }
    });

    expect(queryClient.getQueryData(KEY)).toEqual([{ id: "f1", name: "A" }]);
  });

  it("different entities do not block each other's invalidation", async () => {
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(KEY, [{ id: "f1", name: "A" }, { id: "f2", name: "B" }]);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const slow = deferred();

    const { result } = renderHook(
      () => ({
        slow: useOptimisticMutation(folderMutation(() => slow.promise, rename)),
        fast: useOptimisticMutation(folderMutation(async () => ({ ok: true }), rename)),
      }),
      { wrapper }
    );

    act(() => result.current.slow.mutate({ id: "f1", name: "A2" }));
    await act(async () => {
      await result.current.fast.mutateAsync({ id: "f2", name: "B2" });
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1); // f2 synced even though f1 is pending
    await act(async () => slow.resolve({ ok: true }));
  });
});
