// [FSD Layer: features/workflows/api/mutations] — Set workflow primary media (1 hook/file).
// Optimistically updates primary media id in workflow.
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { matchWorkflowId } from '@/shared/lib/optimistic/cacheOps';
import { useOptimisticMutation } from '@/shared/lib/optimistic/useOptimisticMutation';
import { workflowEntity } from '@/shared/lib/optimistic/entityKeys';

export function useSetPrimaryMedia() {
  return useOptimisticMutation({
    mutationFn: async ({ workflowId, mediaId }) => {
      const res = await api.patch(`/workflows/workflows/${workflowId}/primary-media`, {
        media_id: mediaId,
        primaryMediaId: mediaId,
      });
      if (!res.ok) throw new Error(res.message || 'Failed to set primary media');
      return res;
    },
    getCacheKeys: ({ projectId }) => (projectId ? [queryKeys.projectData.byProject(projectId)] : []),
    getEntityKey: ({ workflowId }) => workflowEntity(workflowId),
    applyOptimistic: (oldData, { workflowId, mediaId }) => {
      if (!oldData?.projectContents?.workflows) return oldData;

      // Locate target media record to resolve its URL
      let targetMediaUrl = null;
      if (Array.isArray(oldData.projectContents.media)) {
        const foundMedia = oldData.projectContents.media.find(
          (m) => m.id === mediaId || m.name === mediaId || m.asset_id === mediaId || m.media_id === mediaId
        );
        if (foundMedia) targetMediaUrl = foundMedia.url || foundMedia.file_url;
      }
      if (!targetMediaUrl) {
        for (const wf of oldData.projectContents.workflows) {
          const list = [...(Array.isArray(wf.items) ? wf.items : []), ...(Array.isArray(wf.media) ? wf.media : [])];
          const found = list.find((it) => it.id === mediaId || it.name === mediaId || it.asset_id === mediaId || it.media_id === mediaId);
          if (found) {
            targetMediaUrl = found.url || found.file_url;
            break;
          }
        }
      }

      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          workflows: oldData.projectContents.workflows.map((wf) => {
            if (matchWorkflowId(wf, workflowId)) {
              return {
                ...wf,
                primary_media_id: mediaId,
                primaryMediaId: mediaId,
                primary_media_url: mediaId === null ? null : (targetMediaUrl || wf.primary_media_url),
                metadata: {
                  ...(wf.metadata || {}),
                  primary_media_id: mediaId,
                  primaryMediaId: mediaId,
                  primary_media_url: targetMediaUrl || wf.metadata?.primary_media_url,
                },
                items: Array.isArray(wf.items)
                  ? wf.items.map((it) => {
                      const isSelected = mediaId ? (it.id === mediaId || it.media_id === mediaId || it.asset_id === mediaId || it.name === mediaId) : false;
                      return {
                        ...it,
                        is_primary: isSelected,
                        isPrimary: isSelected,
                      };
                    })
                  : wf.items,
                media: Array.isArray(wf.media)
                  ? wf.media.map((it) => {
                      const isSelected = mediaId ? (it.id === mediaId || it.media_id === mediaId || it.asset_id === mediaId || it.name === mediaId) : false;
                      return {
                        ...it,
                        is_primary: isSelected,
                        isPrimary: isSelected,
                      };
                    })
                  : wf.media,
              };
            }
            return wf;
          }),
          media: Array.isArray(oldData.projectContents.media)
            ? oldData.projectContents.media.map((m) => {
                const belongsToWf = matchWorkflowId({ id: m.workflowId || m.workflow_id, name: m.workflowId || m.workflow_id }, workflowId);
                if (!belongsToWf) return m;
                const isSelected = mediaId ? (m.id === mediaId || m.name === mediaId || m.asset_id === mediaId || m.media_id === mediaId) : false;
                return {
                  ...m,
                  is_primary: isSelected,
                  isPrimary: isSelected,
                };
              })
            : oldData.projectContents.media,
          elements: Array.isArray(oldData.projectContents.elements)
            ? oldData.projectContents.elements.map((el) => {
                if (el.workflow_id === workflowId || el.id === workflowId) {
                  return {
                    ...el,
                    primaryMediaId: mediaId,
                    primary_media_id: mediaId,
                    primary_media_url: mediaId === null ? null : (targetMediaUrl || el.primary_media_url),
                  };
                }
                return el;
              })
            : oldData.projectContents.elements,
        },
      };
    },
    invalidateKeys: ({ projectId }) => [
      ...(projectId ? [queryKeys.projectData.byProject(projectId)] : []),
      ['workflows'],
    ],
    errorMessage: 'Failed to set cover photo. Changes were reverted.',
  });
}

export default useSetPrimaryMedia;
