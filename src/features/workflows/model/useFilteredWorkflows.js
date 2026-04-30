import { useMemo } from 'react';
import { useProjectData } from '../api/workflowsApi';
import { useWorkflowsStore } from './useWorkflowsStore';
import { getGenerationConfig } from '@/shared/lib/referenceUtils';

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * يحول array → object بـ key محدد
 * بدل ما نلف كل مرة على array كاملة
 */
function indexBy(arr, key) {
  const map = {};
  for (const item of arr) {
    if (item[key] != null) map[item[key]] = item;
  }
  return map;
}

/**
 * يجمع الـ media حسب workflowId
 */
function groupMediaByWorkflow(media) {
  const map = {};
  for (const m of media) {
    if (!m.workflowId) continue;
    (map[m.workflowId] ??= []).push(m);
  }
  return map;
}

/**
 * يحدد هل الـ workflow upload ولا generation
 * يعطي الأولوية لآخر تعديل (Edit) موجود في الـ items
 */
function resolveConfig(wfItems) {
  const sortedItems = [...wfItems].sort((a, b) => 
    new Date(b.metadata?.createTime || b.create_time || 0) - new Date(a.metadata?.createTime || a.create_time || 0)
  );
  
  const caeItem        = sortedItems.find(i => i.workflowStepId === "CAE");
  const latestEditItem = sortedItems.find(i => i.generationConfig || i.mediaMetadata?.requestData);
  const firstMedia     = sortedItems[0] || {};
  
  // Priority: CAE Item -> Latest Edit -> First Media
  const sourceItem = caeItem || latestEditItem || firstMedia;
  const config = getGenerationConfig(sourceItem) || {};
  const model = config.model_name || config.model || '';
  const isUpload = !model && !config.prompt && (sourceItem.asset_type === 'upload' || sourceItem.asset_id || sourceItem.workflowStepId === 'upload');

  return { 
    config: {
      ...config,
      references: config.references || [],
    }, 
    model, 
    isUpload 
  };
}

/**
 * يبني الـ input_assets من references
 */
function buildInputAssets(references = []) {
  return references
    .filter(r => r?.url)
    .map(r => ({ url: r.url, asset_id: r.asset_id ?? null, role: r.role ?? null }));
}

// ─────────────────────────────────────────────────────────────────────────────
// main hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * [FSD Layer: features/workflows]
 *
 * كل group ترجع بهاذ الشكل:
 * {
 *   id, name, groupType, feed_type,
 *   prompt, model, ratio, count,
 *   modelLabel, modelIconUrl,
 *   input_assets: [{ url, asset_id, role }],
 *   workflows: [{ ...wf, items: media[] }]
 * }
 */
export function useFilteredWorkflows(projectId, sessionId) {
  // Always fetch the FULL project data (cached heavily) so switching sessions doesn't trigger a refetch
  const queryResult           = useProjectData(projectId);
  const { _generationFilters: filters, showUploadedMedia } = useWorkflowsStore();

  const rawWorkflows = queryResult.data?.projectContents?.workflows ?? [];
  const rawMedia     = queryResult.data?.projectContents?.media     ?? [];
  const rawBatches   = queryResult.data?.projectContents?.batches   ?? [];
  const rawModels    = queryResult.data?.modelConfig?.models        ?? [];

  // ── indexes (يُحسب مرة وحدة) ──────────────────────────────────────────────

  /** modelKey → { displayName, icon } */
  const modelLookup = useMemo(() => {
    const map = {};
    for (const m of rawModels) {
      if (m.key) map[m.key] = { displayName: m.displayName, icon: m.icon };
    }
    return map;
  }, [rawModels]);

  /** workflowId → media[] */
  const mediaByWorkflow = useMemo(() => groupMediaByWorkflow(rawMedia), [rawMedia]);

  // ── filteredWorkflows ────────────────────────────────────────────────────

  const filteredWorkflows = useMemo(() => {

    // 1. فلترة
    const filtered = rawWorkflows.filter(wf => {
      // Hide Element Sheets from normal workspace/timeline:
      if (wf.workflow_type === "ELEMENT_SHEET") return false;

      const wfMedia = mediaByWorkflow[wf.name] ?? [];
      const { config, model, isUpload } = resolveConfig(wfMedia);
      const type = isUpload ? 'upload' : 'generation';

      if (filters.liked && !wf.metadata?.favorited) return false;

      // Filter uploads if needed
      if (!showUploadedMedia && type === 'upload') return false;

      // فلتر session
      if (sessionId && wf.metadata?.sessionId !== sessionId) return false;

      // فلتر نوع الميديا (صورة / فيديو)
      if (filters.types?.length > 0) {
        const hasMatch = wfMedia.some(m => {
          const type = m.image ? 'image' : m.video ? 'video' : null;
          return filters.types.includes(type);
        });
        if (!hasMatch) return false;
      }

      // فلتر موديل
      if (filters.models?.length > 0) {
        if (!filters.models.includes(model)) return false;
      }

      // فلتر prompt
      if (filters.prompt?.trim()) {
        const q = filters.prompt.toLowerCase();
        if (!(config.prompt ?? '').toLowerCase().includes(q)) return false;
      }

      return true;
    });

    // 2. ترتيب
    filtered.sort((a, b) => {
      const tA = new Date(a.metadata?.createTime ?? 0).getTime();
      const tB = new Date(b.metadata?.createTime ?? 0).getTime();
      return filters.sort === 'oldest' ? tA - tB : tB - tA;
    });

    // 3. Flatten and attach metadata
    return filtered.map(wf => {
      const wfItems = mediaByWorkflow[wf.name] ?? [];
      const { config, model, isUpload } = resolveConfig(wfItems);

      return {
        ...wf,
        id:             wf.name,
        name:           wf.name,
        type:           isUpload ? 'upload' : 'generation',
        items:          wfItems.map(item => ({
          ...item,
          asset_id:       item.name || item.id,
          workflowStepId: item.workflowStepId || (isUpload ? 'upload' : item.workflowStepId)
        })),
        isMultiMedia:   wfItems.length > 1,
        is_liked:       !!wf.metadata?.favorited,
        generationConfig: config,
      };
    });
  }, [
    rawWorkflows,
    mediaByWorkflow,
    modelLookup,
    filters,
    showUploadedMedia,
    sessionId,
  ]);

  // ── availableModels ──────────────────────────────────────────────────────

  const availableModels = useMemo(() => {
    const models = rawBatches
      .map(b => b.generationConfig?.model)
      .filter(Boolean);
    return [...new Set(models)];
  }, [rawBatches]);

  // ─────────────────────────────────────────────────────────────────────────

  return {
    ...queryResult,
    availableModels,
    filteredCount: filteredWorkflows.length,
    total: rawWorkflows.filter(wf => wf.workflow_type !== "ELEMENT_SHEET").length,
    data: {
      ...queryResult.data,
      filteredWorkflows,
      availableModels,
    },
  };
}

// ── Alias for compatibility ──────────────────────────────────────────────────
export const useFilteredGenerations = useFilteredWorkflows;
