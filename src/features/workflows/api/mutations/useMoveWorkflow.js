// [FSD Layer: features/workflows/api/mutations] — Move workflow stub mutation (1 hook/file).
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useMoveWorkflow.
// Preserves the dead-stub contract (mutationFn = async () => ({ok:true})). Currently not
// imported anywhere — kept for continuity with prior export contract.
import { useMutation } from '@tanstack/react-query';

/**
 * @deprecated Dead stub: it never calls the backend and always resolves `{ ok: true }`.
 * Use `useMoveAssetToFolder` (features/folders/mutations) to move a workflow into a folder.
 * Kept only to preserve the public export contract (AGENTS.md: never remove/rename exports).
 */
export function useMoveWorkflow() {
  return useMutation({
    mutationFn: async () => ({ ok: true }),
  });
}
