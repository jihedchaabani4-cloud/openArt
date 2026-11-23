// [FSD Layer: features/workflows/api/mutations] — Remove workflow mutation (1 hook/file).
// Optimistically removes workflow and associated media; skips Trash for failed-only workflows; rolls back on error.
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/shared/api/client";
import { queryKeys } from "@/shared/api/queryKeys";
import { matchWorkflowId } from "@/shared/lib/optimistic/cacheOps";
import { workflowEntity } from "@/shared/lib/optimistic/entityKeys";
import { useOptimisticMutation } from "@/shared/lib/optimistic/useOptimisticMutation";
import {
  areAllWorkflowMediaFailed,
  isMediaProcessingConflictError,
  getMediaProcessingConflictMessage,
} from "@/features/workflows/lib/mediaStatusHelpers";

function cleanWorkflowId(id) {
  return String(id || "")
    .trim()
    .replace(/^workflows\//, "");
}

function extractIdsFromVariables(variables) {
  if (typeof variables === "string") return [variables];
  if (Array.isArray(variables)) return variables;
  if (!variables || typeof variables !== "object") return [];
  if (Array.isArray(variables.workflowIds)) return variables.workflowIds;
  if (variables.workflowId) return [variables.workflowId];
  const wfId = variables.workflow?.id || variables.workflow?.name;
  return wfId ? [wfId] : [];
}

function filterEntitiesByIds(list, idsToRemove) {
  if (!Array.isArray(list) || idsToRemove.length === 0) return list;
  return list.filter((entity) => !idsToRemove.some((id) => matchWorkflowId(entity, id)));
}

function patchFlatWorkflowCache(oldData, idsToRemove) {
  if (!oldData || idsToRemove.length === 0) return oldData;
  if (Array.isArray(oldData)) {
    return filterEntitiesByIds(oldData, idsToRemove);
  }
  if (typeof oldData === "object") {
    const next = { ...oldData };
    if (Array.isArray(oldData.workflows)) {
      next.workflows = filterEntitiesByIds(oldData.workflows, idsToRemove);
    }
    if (Array.isArray(oldData.items)) {
      next.items = filterEntitiesByIds(oldData.items, idsToRemove);
    }
    if (Array.isArray(oldData.data)) {
      next.data = filterEntitiesByIds(oldData.data, idsToRemove);
    }
    return next;
  }
  return oldData;
}

export function useRemoveWorkflow() {
  const queryClient = useQueryClient();

  return useOptimisticMutation({
    mutationFn: async (variables) => {
      const ids = extractIdsFromVariables(variables).filter(Boolean);
      if (ids.length === 0) throw new Error("workflowId is required");
      const cleanIds = ids.map(cleanWorkflowId).filter(Boolean);

      const res =
        cleanIds.length === 1
          ? await api.delete(`/workflows/workflows/${cleanIds[0]}`)
          : await api.delete(`/workflows/workflows`, {
              body: JSON.stringify({ workflow_ids: cleanIds }),
            });

      if (!res || res.ok === false || res.success === false) {
        const err = new Error(res?.message || res?.error || "Failed to remove workflow");
        if (res?.status || res?.statusCode) err.status = res.status || res.statusCode;
        if (res?.errorCode || res?.code) err.errorCode = res.errorCode || res.code;
        throw err;
      }

      return typeof res === "object" && res !== null ? res : { ok: true };
    },

    getEntityKey: (variables) => {
      const ids = extractIdsFromVariables(variables);
      const targetId = ids[0] || null;
      return targetId ? workflowEntity(targetId) : null;
    },

    getCacheKeys: (variables) => {
      const projectId =
        typeof variables === "object" && !Array.isArray(variables)
          ? variables?.projectId
          : null;
      return projectId
        ? [
            queryKeys.projectData.byProject(projectId),
            queryKeys.generations.byProject(projectId),
            queryKeys.trash.all(),
          ]
        : [queryKeys.generations.all(), queryKeys.trash.all()];
    },

    onMutate: (variables) => {
      const idsToRemove = extractIdsFromVariables(variables).filter(Boolean);
      const cleanIds = idsToRemove.map(cleanWorkflowId).filter(Boolean);
      const projectId =
        typeof variables === "object" && !Array.isArray(variables)
          ? variables?.projectId
          : null;
      const explicitWorkflow =
        typeof variables === "object" && !Array.isArray(variables)
          ? variables?.workflow
          : null;

      const cachedProject = projectId
        ? queryClient.getQueryData(queryKeys.projectData.byProject(projectId))
        : null;
      const pc = cachedProject?.projectContents || {};
      const currentWorkflows = Array.isArray(pc.workflows) ? pc.workflows : [];
      const currentTrashed = Array.isArray(pc.trashedWorkflows) ? pc.trashedWorkflows : [];
      const currentCharacters = Array.isArray(pc.characters) ? pc.characters : [];
      const currentElements = Array.isArray(pc.elements) ? pc.elements : [];
      const currentMedia = Array.isArray(pc.media) ? pc.media : [];

      const failedOnlyIds = new Set();
      const alreadyInTrashIds = new Set();

      for (let i = 0; i < idsToRemove.length; i++) {
        const id = idsToRemove[i];
        const cleanId = cleanIds[i];
        if (!cleanId) continue;

        if (currentTrashed.some((wf) => matchWorkflowId(wf, id))) {
          alreadyInTrashIds.add(cleanId);
          continue;
        }

        const targetWf =
          currentWorkflows.find((wf) => matchWorkflowId(wf, id)) ||
          currentCharacters.find((c) => matchWorkflowId(c, id)) ||
          currentElements.find((el) => matchWorkflowId(el, id)) ||
          (explicitWorkflow && matchWorkflowId(explicitWorkflow, id) ? explicitWorkflow : null);

        const wfMedia = currentMedia.filter(
          (m) => cleanWorkflowId(m?.workflowId || m?.workflow_id || m?.workflowName) === cleanId
        );

        if (areAllWorkflowMediaFailed(targetWf || explicitWorkflow, wfMedia)) {
          failedOnlyIds.add(cleanId);
        }
      }

      const allFailedOnly =
        cleanIds.length > 0 && cleanIds.every((id) => failedOnlyIds.has(id));
      const allAlreadyInTrash =
        cleanIds.length > 0 && cleanIds.every((id) => alreadyInTrashIds.has(id));

      if (allFailedOnly && variables && typeof variables === "object" && !Array.isArray(variables)) {
        variables._skipTrashInvalidate = true;
      }

      return {
        idsToRemove,
        cleanIds,
        failedOnlyIds,
        alreadyInTrashIds,
        allFailedOnly,
        allAlreadyInTrash,
      };
    },

    applyOptimistic: (oldData, variables, key) => {
      const idsToRemove = extractIdsFromVariables(variables).filter(Boolean);
      if (idsToRemove.length === 0) return oldData;

      const cleanIds = idsToRemove.map(cleanWorkflowId).filter(Boolean);
      const cleanIdSet = new Set(cleanIds);
      const explicitWorkflow =
        typeof variables === "object" && !Array.isArray(variables)
          ? variables?.workflow
          : null;

      if (Array.isArray(key) && key[0] === "trash") {
        // Never add failed-only workflows to Trash cache; remove if already present
        return patchFlatWorkflowCache(oldData, idsToRemove);
      }

      if (Array.isArray(key) && key[0] === "workflows") {
        return patchFlatWorkflowCache(oldData, idsToRemove);
      }

      if (!oldData?.projectContents) return oldData;

      const currentWorkflows = oldData.projectContents?.workflows || [];
      const currentTrashed = oldData.projectContents?.trashedWorkflows || [];
      const currentCharacters = oldData.projectContents?.characters || [];
      const currentElements = oldData.projectContents?.elements || [];
      const currentMedia = oldData.projectContents?.media || [];

      const nowIso = new Date().toISOString();
      const newlyTrashedEntries = [];
      const seenTrashedCleanIds = new Set();

      for (let i = 0; i < idsToRemove.length; i++) {
        const id = idsToRemove[i];
        const cleanId = cleanIds[i];
        if (!cleanId || seenTrashedCleanIds.has(cleanId)) continue;

        // Already in trash -> permanent delete (omit from trashedWorkflows)
        if (currentTrashed.some((wf) => matchWorkflowId(wf, id))) continue;

        const targetWf =
          currentWorkflows.find((wf) => matchWorkflowId(wf, id)) ||
          currentCharacters.find((c) => matchWorkflowId(c, id)) ||
          currentElements.find((el) => matchWorkflowId(el, id)) ||
          (explicitWorkflow && matchWorkflowId(explicitWorkflow, id) ? explicitWorkflow : null);

        const wfMedia = currentMedia.filter(
          (m) => cleanWorkflowId(m?.workflowId || m?.workflow_id || m?.workflowName) === cleanId
        );

        // Failed-only workflow -> permanent delete (skips Trash)
        if (areAllWorkflowMediaFailed(targetWf || explicitWorkflow, wfMedia)) {
          continue;
        }

        seenTrashedCleanIds.add(cleanId);
        newlyTrashedEntries.push(
          targetWf
            ? {
                ...targetWf,
                deleted_at: nowIso,
                deletedAt: nowIso,
                metadata: {
                  ...(targetWf.metadata || {}),
                  deleted_at: nowIso,
                },
              }
            : {
                id: cleanId,
                name: cleanId,
                deleted_at: nowIso,
                deletedAt: nowIso,
              }
        );
      }

      const matchesAnyTarget = (entity) =>
        idsToRemove.some((id) => matchWorkflowId(entity, id));

      return {
        ...oldData,
        projectContents: {
          ...oldData.projectContents,
          workflows: currentWorkflows.filter((wf) => !matchesAnyTarget(wf)),
          trashedWorkflows: [
            ...newlyTrashedEntries,
            ...currentTrashed.filter((wf) => !matchesAnyTarget(wf)),
          ],
          characters: currentCharacters.filter((c) => !matchesAnyTarget(c)),
          elements: currentElements.filter((el) => !matchesAnyTarget(el)),
          media: currentMedia.filter((m) => {
            const mWf = cleanWorkflowId(m?.workflowId || m?.workflow_id || m?.workflowName);
            return !cleanIdSet.has(mWf);
          }),
        },
      };
    },

    onSuccess: (res, variables, userContext) => {
      const projectId =
        typeof variables === "object" && !Array.isArray(variables)
          ? variables?.projectId
          : null;
      const cleanIds =
        userContext?.cleanIds ||
        extractIdsFromVariables(variables).map(cleanWorkflowId).filter(Boolean);

      const serverDeletedIds = Array.isArray(res?.deleted_workflow_ids)
        ? res.deleted_workflow_ids.map(cleanWorkflowId).filter(Boolean)
        : [];
      const serverTrashedIds = Array.isArray(res?.trashed_workflow_ids)
        ? res.trashed_workflow_ids.map(cleanWorkflowId).filter(Boolean)
        : [];

      const wasTrashed =
        res?.trashed === true ||
        (serverTrashedIds.length > 0 && serverDeletedIds.length === 0);

      const wasPermanentlyDeleted =
        !wasTrashed &&
        Boolean(
          userContext?.allFailedOnly ||
            userContext?.allAlreadyInTrash ||
            res?.trashed === false ||
            typeof res?.deleted_media_count === "number" ||
            serverDeletedIds.length > 0
        );

      const permanentIdsToPurgeFromTrash = wasPermanentlyDeleted
        ? serverDeletedIds.length > 0
          ? serverDeletedIds
          : cleanIds
        : serverDeletedIds;

      if (permanentIdsToPurgeFromTrash.length > 0) {
        if (projectId) {
          queryClient.setQueryData(
            queryKeys.projectData.byProject(projectId),
            (old) => {
              if (!old?.projectContents) return old;
              const currentTrashed = Array.isArray(
                old.projectContents.trashedWorkflows
              )
                ? old.projectContents.trashedWorkflows
                : [];
              return {
                ...old,
                projectContents: {
                  ...old.projectContents,
                  trashedWorkflows: filterEntitiesByIds(
                    currentTrashed,
                    permanentIdsToPurgeFromTrash
                  ),
                },
              };
            }
          );
        }

        const existingTrashCache = queryClient.getQueryData(queryKeys.trash.all());
        if (existingTrashCache !== undefined) {
          queryClient.setQueryData(queryKeys.trash.all(), (old) =>
            patchFlatWorkflowCache(old, permanentIdsToPurgeFromTrash)
          );
        }
      }

      if (
        wasPermanentlyDeleted &&
        !userContext?.allAlreadyInTrash &&
        variables &&
        typeof variables === "object" &&
        !Array.isArray(variables)
      ) {
        variables._skipTrashInvalidate = true;
      }

      if (wasPermanentlyDeleted) {
        toast.success("Deleted permanently");
      } else if (wasTrashed) {
        toast.success("Moved to Trash");
      }
    },

    invalidateKeys: (variables) => {
      const projectId =
        typeof variables === "object" && !Array.isArray(variables)
          ? variables?.projectId
          : null;
      const skipTrash =
        typeof variables === "object" && !Array.isArray(variables)
          ? Boolean(variables?._skipTrashInvalidate)
          : false;
      return [
        ...(projectId ? [queryKeys.projectData.byProject(projectId)] : []),
        ...(skipTrash ? [] : [queryKeys.trash.all()]),
        queryKeys.library.all(),
      ];
    },

    errorMessage: (err) =>
      isMediaProcessingConflictError(err)
        ? getMediaProcessingConflictMessage(err)
        : "Failed to remove workflow. Changes were reverted.",
  });
}

export default useRemoveWorkflow;
