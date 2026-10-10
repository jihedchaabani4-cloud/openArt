// [FSD Layer: features/workflows/api/mutations] — Move workflow stub mutation (1 hook/file).
// Body copied VERBATIM from features/workflows/api/workflowsApi.js useMoveWorkflow.
// Preserves the dead-stub contract (mutationFn = async () => ({ok:true})). Currently not
// imported anywhere — kept for continuity with prior export contract.
import { useMutation } from '@tanstack/react-query';

export function useMoveWorkflow() {
  return useMutation({
    mutationFn: async () => ({ ok: true }),
  });
}
