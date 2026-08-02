import { useMemo } from 'react';
import { useProjectData } from '../api/workflowsApi';
import { WORKFLOW_TYPES, isSpecialWorkflow } from '@/shared/constants/workflowTypes';

/**
 * [FSD Layer: features/workflows]
 * Derived React Query selector hooks.
 * Reads project contents directly from React Query cache.
 */

export function useProjectWorkflows(projectId) {
  const { data, ...rest } = useProjectData(projectId);
  const rawWorkflows = data?.projectContents?.workflows ?? [];

  return {
    ...rest,
    workflows: rawWorkflows,
  };
}

export function useGenerations(projectId) {
  const { data, ...rest } = useProjectData(projectId);
  const rawWorkflows = data?.projectContents?.workflows ?? [];

  const generations = useMemo(() => {
    return rawWorkflows.filter(wf => !isSpecialWorkflow(wf));
  }, [rawWorkflows]);

  return {
    ...rest,
    generations,
  };
}

export function useElements(projectId) {
  const { data, ...rest } = useProjectData(projectId);
  const rawElements = data?.projectContents?.elements ?? [];
  const rawWorkflows = data?.projectContents?.workflows ?? [];

  const elementWorkflows = useMemo(() => {
    return rawWorkflows.filter(wf => {
      const type = String(wf.workflow_type || wf.workflowType || "").toUpperCase();
      return type === WORKFLOW_TYPES.ELEMENT;
    });
  }, [rawWorkflows]);

  return {
    ...rest,
    elements: rawElements,
    elementWorkflows,
  };
}

export function useCharacters(projectId) {
  const { data, ...rest } = useProjectData(projectId);
  const rawCharacters = data?.projectContents?.characters ?? [];
  const rawWorkflows = data?.projectContents?.workflows ?? [];

  const characterWorkflows = useMemo(() => {
    const characterIds = new Set(rawCharacters.map(c => c.workflow_id || c.id).filter(Boolean));
    return rawWorkflows.filter(wf => {
      const type = String(wf.workflow_type || wf.workflowType || "").toUpperCase();
      const cleanWfId = String(wf.name || wf.id || "").replace(/^workflows\//, "");
      const isCharType = type === WORKFLOW_TYPES.CHARACTER || type === WORKFLOW_TYPES.CHAR_SHEET;
      const isInCharTable = characterIds.has(wf.id) || characterIds.has(wf.name) || characterIds.has(cleanWfId);
      return isCharType || isInCharTable;
    });
  }, [rawWorkflows, rawCharacters]);

  return {
    ...rest,
    characters: rawCharacters,
    characterWorkflows,
  };
}

export function useMediaByWorkflow(projectId, workflowId) {
  const { data, ...rest } = useProjectData(projectId);
  const rawMedia = data?.projectContents?.media ?? [];

  const media = useMemo(() => {
    if (!workflowId) return [];
    const cleanId = String(workflowId).replace(/^workflows\//, '');
    return rawMedia.filter(m => {
      const wfId = m.workflowId || m.workflow_id;
      return wfId === workflowId || wfId === cleanId;
    });
  }, [rawMedia, workflowId]);

  return {
    ...rest,
    media,
  };
}
