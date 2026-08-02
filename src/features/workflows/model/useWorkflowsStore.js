import { useWorkflowUiStore } from "./useWorkflowUiStore";

export { useWorkflowUiStore };
export const useWorkflowsStore = useWorkflowUiStore;
export const useGenerationsStore = useWorkflowsStore;
export default useWorkflowsStore;
