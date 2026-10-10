// [FSD Layer: features/workflows/api/mutations] — Generate workflow mutation (1 hook/file).
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useGenerateMutation.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { useWorkflowsStore } from '@/features/workflows/model/useWorkflowsStore';

export function useGenerateMutation({ onError } = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false, // ⛔ NEVER retry generation calls — prevent double-billing on network hiccups
    mutationFn: async ({ payload, isVideo }) => {
      // Explicit domain routing: Generated Image vs Generated Video
      const endpoint = isVideo ? '/video/generated' : '/images/generated';
      const res = await api.post(endpoint, payload, { timeout: 15000 }); // 15s timeout
      if (!res.ok) throw new Error(res.message || 'Workflow execution failed');
      return res;
    },

    onMutate: async ({ payload, isVideo }) => {
      useWorkflowsStore.getState().fireScrollToTop();

      const projectId = payload.project_id;
      if (!projectId) return {};

      const projectKey = queryKeys.projectData.byProject(projectId);
      await queryClient.cancelQueries({ queryKey: projectKey });
      const previousData = queryClient.getQueryData(projectKey);

      if (previousData) {
        const optimisticId = `optimistic-gen-${Date.now()}`;

        const optimisticWorkflow = {
          name: optimisticId,
          projectId: projectId,
          workflow_type: 'GENERATION',
          metadata: {
            displayName: payload.prompt || (isVideo ? "Video Generation" : "Image Generation"),
            createTime: new Date().toISOString(),
            favorited: false,
          }
        };

        const optimisticMedia = {
          id: `${optimisticId}-item`,
          name: `${optimisticId}-item`,
          url: null, // Placeholder
          status: 'pending',
          projectId: projectId,
          workflowId: optimisticId,
          workflowStepId: 'GEN',
          mediaMetadata: {
            createTime: new Date().toISOString(),
            visibility: 'PRIVATE',
          },
          generationConfig: {
            prompt: payload.prompt,
            model: payload.model_name || payload.model,
            ratio: payload.aspect_ratio || payload.ratio,
          },
          [isVideo ? 'video' : 'image']: {
            dimensions: { width: 1024, height: 1024 },
            [isVideo ? 'generatedVideo' : 'generatedImage']: null,
          }
        };

        queryClient.setQueryData(projectKey, (old) => {
          if (!old) return old;
          return {
            ...old,
            projectContents: {
              ...old.projectContents,
              workflows: [optimisticWorkflow, ...(old.projectContents?.workflows || [])],
              media: [optimisticMedia, ...(old.projectContents?.media || [])]
            }
          };
        });
      }

      return { previousData, projectKey };
    },
    onError: (err, variables, context) => {
      console.error('❌ Workflow execution failed:', err);
      if (context?.previousData) {
        queryClient.setQueryData(context.projectKey, context.previousData);
      }
      if (typeof onError === 'function') onError(err);
    },
    onSuccess: (res, { payload }) => {
      const { project_id: projectId } = payload || {};
      if (projectId) {
        // Small delay to ensure the placeholder row is visible in DB before refetch.
        // The backend responds with 202 immediately, but the DB write may lag slightly.
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
        }, 500);
      }
    },
  });
}
