// [FSD Layer: features/workflows/api/queries] — Unified project data query hook.
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useProjectData.
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { useAuthSession } from '@/shared/api/auth';

/**
 * useProjectData:
 * The SINGLE source of truth for a project.
 *
 * 🧠 Blueprint Layer: Pure Hook.
 * Logic is handled by the Layout (Control Layer).
 */
export function useProjectData(projectId) {
  const { data: user, isLoading: authLoading } = useAuthSession();
  const queryKey = queryKeys.projectData.byProject(projectId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = `/workflows/project-data/${projectId}`;

      try {
        const res = await api.get(url, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
          cache: 'no-store',
        });


        // Comprehensive check for all possible backend response structures
        const data =
          res?.data?.data?.json ||
          res?.data?.json ||
          res?.result?.data?.json ||
          res?.json ||
          res?.data;

        if (data && (data.projectContents || data.projectName)) {
          if (data.projectContents?.workflows) {
            data.projectContents.workflows = data.projectContents.workflows.map(wf => {
              const isUploadWf = wf.workflow_type === 'UPLOAD' || wf.workflowType === 'UPLOAD' || wf.type === 'upload' || Boolean(wf.is_upload);
              return isUploadWf ? { ...wf, workflow_type: 'UPLOAD', workflowType: 'UPLOAD', is_upload: true, type: 'upload' } : wf;
            });
          }
          return data;
        }
        throw new Error('Project data structure invalid or not found');
      } catch (err) {
        throw err;
      }
    },
    enabled: !authLoading && !!user && !!projectId, // ⛔ Block until auth resolves
    // 🎯 SaaS Settings - 144Hz Instant Tab Switching & Cache
    staleTime: 30000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const media = query.state.data?.projectContents?.media || [];
      const now = Date.now();
      const MAX_PROCESSING_MS = 10 * 60 * 1000; // 10 minutes hard timeout failsafe

      const hasPending = media.some((m) => {
        const isProcessing = m.status === 'processing' || m.status === 'pending';
        if (!isProcessing) return false;

        const rawDate = m.create_time || m.createTime || m.created_at || m.mediaMetadata?.createTime || m.mediaMetadata?.create_time;
        if (!rawDate) return false;

        const createdMs = new Date(rawDate).getTime();
        if (!createdMs || isNaN(createdMs)) return false;

        // If elapsed time >= 10 minutes, stop polling (failsafe for stuck/abandoned backend jobs)
        if ((now - createdMs) >= MAX_PROCESSING_MS) {
          return false;
        }

        return true;
      });

      // 30s polling during generation; completely stops (false) when idle/finished
      return hasPending ? 30000 : false;
    },
    retry: false, // Don't hang forever on bad IDs
    throwOnError: false, // Controlled handling

  });
}
