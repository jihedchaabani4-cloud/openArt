// [FSD Layer: features/workflows/api/mutations] — Detach media as standalone workflow (1 hook/file).
// Optimistically creates standalone workflow and reassigns media.
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { matchMediaId } from '@/features/workflows/lib/cacheHelpers';
import { useOptimisticMutation } from '@/shared/lib/optimistic/useOptimisticMutation';
import { mediaEntity } from '@/shared/lib/optimistic/entityKeys';

export function useDetachMedia() {
  return useOptimisticMutation({
    mutationFn: async ({ mediaId, projectId, displayName }) => {
      const res = await api.post(`/workflows/detach-media`, {
        media_id: mediaId,
        project_id: projectId,
        display_name: displayName,
      });
      if (!res.ok) throw new Error(res.message || 'Failed to detach media');
      return res;
    },
    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),
    getEntityKey: ({ mediaId }) => mediaEntity(mediaId),
    onMutate: (variables) => {
      const tempWfId = `temp-detached-${Date.now()}`;
      variables.tempWfId = tempWfId;
      return { tempWfId };
    },
    applyOptimistic: (oldData, { mediaId, displayName, projectId, tempWfId }) => {
      if (!oldData?.projectContents) return oldData;
      const newWfId = tempWfId || `temp-detached-${Date.now()}`;
      const newWorkflow = {
        id: newWfId,
        name: newWfId,
        display_name: displayName || "Detached Media",
        workflow_type: "GENERATION",
        projectId,
        metadata: { displayName: displayName || "Detached Media" },
        createTime: new Date().toISOString(),
      };

      const updatedMedia = (oldData.projectContents.media || []).map((m) => {
        if (matchMediaId(m, mediaId)) {
          return {
            ...m,
            workflowId: newWfId,
            workflow_id: newWfId,
          };
        }
        return m;
      });

      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          workflows: [newWorkflow, ...(oldData.projectContents.workflows || [])],
          media: updatedMedia,
        },
      };
    },
    invalidateKeys: ({ projectId }) => [
      ...(projectId ? [queryKeys.projectData.byProject(projectId)] : []),
      ['workflows'],
    ],
    errorMessage: 'Failed to detach media item. Changes were reverted.',
  });
}

export default useDetachMedia;
