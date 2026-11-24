// [FSD Layer: features/workflows/api/mutations] — Shared Project Cache patcher for In-Place Image Edits (angles, relight).
import { matchWorkflowId } from "@/shared/lib/optimistic/cacheOps";

/**
 * Patches the Project Cache immediately with a new `processing` media row
 * and flips `is_primary = true` to mirror the server's immediate primary swap.
 */
export function patchProjectCacheForImageEdit(
  oldData,
  { workflowId, projectId, mediaId, stepId, editType, editSettings = {} }
) {
  if (!oldData?.projectContents || !workflowId || !mediaId) return oldData;

  const nowIso = new Date().toISOString();
  const workflows = Array.isArray(oldData.projectContents.workflows)
    ? oldData.projectContents.workflows
    : [];
  const mediaList = Array.isArray(oldData.projectContents.media)
    ? oldData.projectContents.media
    : [];

  const targetWf = workflows.find((wf) => matchWorkflowId(wf, workflowId));
  const refMedia =
    mediaList.find(
      (m) =>
        matchWorkflowId(
          { id: m.workflowId || m.workflow_id, name: m.workflowId || m.workflow_id },
          workflowId
        ) && (m.is_primary || m.isPrimary)
    ) ||
    targetWf?.items?.find((it) => it.is_primary || it.isPrimary) ||
    targetWf?.items?.[0] ||
    null;

  const width = Number(refMedia?.width || refMedia?.image?.dimensions?.width) || 1024;
  const height = Number(refMedia?.height || refMedia?.image?.dimensions?.height) || 1024;

  const newPlaceholder = {
    id: mediaId,
    name: mediaId,
    media_id: mediaId,
    workflowId,
    workflow_id: workflowId,
    projectId: projectId || targetWf?.projectId || targetWf?.project_id || null,
    step_id: stepId,
    workflowStepId: stepId,
    role: "output",
    kind: "image",
    type: "image",
    status: "processing",
    url: null,
    is_primary: true,
    isPrimary: true,
    width,
    height,
    created_at: nowIso,
    mediaMetadata: { createTime: nowIso, visibility: "PRIVATE" },
    generation_config: {
      edit_type: editType,
      edit_settings: editSettings,
      created_at: nowIso,
    },
    generationConfig: {
      edit_type: editType,
      edit_settings: editSettings,
    },
    image: {
      dimensions: { width, height },
      generatedImage: null,
    },
  };

  const demoteList = (list) =>
    list
      .filter((it) => (it.id || it.media_id || it.name) !== mediaId)
      .map((it) => ({ ...it, is_primary: false, isPrimary: false }));

  return {
    ...oldData,
    projectContents: {
      ...oldData.projectContents,
      workflows: workflows.map((wf) => {
        if (!matchWorkflowId(wf, workflowId)) return wf;
        return {
          ...wf,
          primary_media_id: mediaId,
          primaryMediaId: mediaId,
          metadata: {
            ...(wf.metadata || {}),
            primary_media_id: mediaId,
            primaryMediaId: mediaId,
          },
          items: Array.isArray(wf.items)
            ? [newPlaceholder, ...demoteList(wf.items)]
            : wf.items,
          media: Array.isArray(wf.media)
            ? [newPlaceholder, ...demoteList(wf.media)]
            : wf.media,
        };
      }),
      media: [
        newPlaceholder,
        ...mediaList
          .filter((m) => (m.id || m.media_id || m.name) !== mediaId)
          .map((m) => {
            const belongs = matchWorkflowId(
              { id: m.workflowId || m.workflow_id, name: m.workflowId || m.workflow_id },
              workflowId
            );
            return belongs ? { ...m, is_primary: false, isPrimary: false } : m;
          }),
      ],
    },
  };
}
