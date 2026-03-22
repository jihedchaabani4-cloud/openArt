// [FSD Layer: features/generations] — Server State (React Query)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';

// Minimal in-memory set tracking sessions with in-flight generations (for polling)
export const pendingSessionIds = new Set();

// ── Queries ───────────────────────────────────────────────────────────────────

export function useGenerations(projectId, sessionId) {
  return useQuery({
    queryKey: queryKeys.generations.byProject(projectId, sessionId),
    queryFn: async () => {
      let url = `/generations/generations/${projectId}`;
      if (sessionId) url += `?session_id=${sessionId}`;
      const res = await api.get(url);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to fetch generations');
      return res.data;
    },
    enabled: !!projectId,
    staleTime: 10_000, // 10s — live data, updated frequently
  });
}

export function useAllGenerations(page = 1) {
  return useQuery({
    queryKey: queryKeys.generations.paginated(page),
    queryFn: async () => {
      const res = await api.get(`/generations/generations?page=${page}&limit=10`);
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to fetch generations');
      return { data: res.data, hasMore: res.hasMore };
    },
    staleTime: 30_000, // 30s — library view, less critical
  });
}

export function useStudioModels() {
  return useQuery({
    queryKey: queryKeys.models.studio(),
    queryFn: async () => {
      const res = await api.get('/models');
      // The models endpoint specifically uses 'success' instead of 'ok'
      if (res.ok === false || res.success === false) throw new Error(res.message || 'Failed to fetch models');
      return res.data?.models ?? [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour — nearly static data
    gcTime:    24 * 60 * 60 * 1000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * useGenerateMutation
 * Single generation mutation for both image and video.
 * Accepts an optional onError callback (e.g. to show a toast).
 */
export function useGenerateMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payload, isVideo }) => {
      const endpoint = isVideo ? '/video/generate' : '/generations/generate';
      const res = await api.post(endpoint, payload);
      if (!res.ok) throw new Error(res.message || 'Generation failed');
      return res;
    },
    // ── Optimistic: immediately increment items_count in sessions cache ─────
    onMutate: async ({ payload }) => {
      const { project_id: projectId, session_id: sessionId } = payload || {};
      
      console.log('[onMutate] 🔎 payload received:', { projectId, sessionId });

      if (!projectId || !sessionId) {
        console.warn('[onMutate] ⚠️ Missing projectId or sessionId — skipping optimistic update');
        return {};
      }

      await queryClient.cancelQueries({ queryKey: queryKeys.sessions.byProject(projectId) });
      const previousSessions = queryClient.getQueryData(queryKeys.sessions.byProject(projectId));

      console.log('[onMutate] 📦 Sessions cache found:', Array.isArray(previousSessions) ? `${previousSessions.length} sessions` : 'EMPTY / undefined');

      if (!Array.isArray(previousSessions)) {
        console.warn('[onMutate] ⚠️ sessions cache is empty — optimistic update skipped');
        return {};
      }

      const targetSession = previousSessions.find(s => s.session_id === sessionId);
      console.log('[onMutate] 🎯 Target session:', targetSession ? `found (current items_count: ${targetSession.items_count})` : 'NOT FOUND in cache');

      queryClient.setQueryData(queryKeys.sessions.byProject(projectId), (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((s) =>
          s.session_id === sessionId
            ? { ...s, items_count: (s.items_count || 0) + 1 }
            : s
        );
      });

      const updatedSessions = queryClient.getQueryData(queryKeys.sessions.byProject(projectId));
      const updatedSession = updatedSessions?.find(s => s.session_id === sessionId);
      console.log('[onMutate] ✅ After optimistic update, items_count =', updatedSession?.items_count);

      return { previousSessions, projectId, sessionId };
    },
    // ── Rollback on error ─────────────────────────────────────────────────
    onError: (err, _vars, context) => {
      if (context?.previousSessions !== undefined) {
        queryClient.setQueryData(
          queryKeys.sessions.byProject(context.projectId),
          context.previousSessions
        );
      }
      console.error('❌ Generation failed:', err);
      if (typeof onError === 'function') onError(err);
    },
    // ── After success: patch cover_url if not set, schedule sessions refetch ─
    onSuccess: (res, _vars, context) => {
      const projectId = res.project_id;
      const sessionId = res.session_id;

      // Patch cover_url in sessions cache if this session doesn't have one yet
      // and the response already contains a completed asset URL
      const group = res.data;
      const firstCompletedAsset = group?.items?.find((i) => i.asset?.file_url);
      if (projectId && sessionId && firstCompletedAsset?.asset?.file_url) {
        queryClient.setQueryData(queryKeys.sessions.byProject(projectId), (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((s) =>
            s.session_id === sessionId && !s.cover_url
              ? { ...s, cover_url: firstCompletedAsset.asset.file_url }
              : s
          );
        });
      }

      // Mark session as pending-cover so the sidebar polls for it
      if (sessionId) pendingSessionIds.add(sessionId);

      // Invalidate server state (NOT sessions — optimistic items_count must survive until poller confirms completion)
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.paginated(1) });
      if (projectId && sessionId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.generations.byProject(projectId, sessionId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.assets.byProject(projectId, sessionId),
        });
      }
    },
  });
}

export function useRemoveGeneration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (groupId) => {
      const res = await api.delete(`/generations/generations/${groupId}`);
      if (!res.ok) throw new Error(res.message);
      return groupId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.paginated(1) });
    },
  });
}

export function useRemoveGenerationItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId }) => {
      const res = await api.delete(`/generations/items/${itemId}`);
      if (!res.ok) throw new Error(res.message);
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.paginated(1) });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId }) => {
      const res = await api.patch(`/generations/items/${itemId}/like`);
      if (!res.ok) throw new Error(res.message);
      return itemId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.paginated(1) });
    },
  });
}

export function useRetryGeneration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ endpoint, payload }) => {
      const res = await api.post(endpoint, payload);
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.all() });
    },
  });
}

export function useGenerateMore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId }) => {
      const res = await api.post('/generations/show-more', { group_id: groupId });
      if (!res.ok) throw new Error(res.message);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.generations.paginated(1) });
    },
  });
}
