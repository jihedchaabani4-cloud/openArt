import { useWorkflowsStore } from "./useWorkflowsStore";
import { useToggleWorkflowLike, useRemoveWorkflow, useToggleLike, useRemoveWorkflowItem } from "../api/workflowsApi";
import { getItemMetadata, getPrimaryMedia, getPrimaryMediaConfig } from "@/shared/lib/generationUtils";
import { downloadFile } from "@/shared/lib/utils";
import { useRemoveAsset } from "@/features/media/api/mediaApi";
import { usePathname } from "next/navigation";

import { useEditStore } from "@/features/prompt-bar/model/useEditStore";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";

/**
 * useWorkflowActions
 * Centralized hook for actions performed on a Workflow or a specific Media Item.
 * @param {Object} workflow - The parent workflow object.
 * @param {Object} item - (Optional) Specific media item to perform actions on. 
 *                        If not provided, defaults to the workflow's primary media.
 */
export function useWorkflowActions(workflow, item = null) {
  const pathname = usePathname();
  const isEditPage = pathname?.includes("/edit/");

  const { 
    setEditTrigger,
    activeSessionId,
  } = useWorkflowsStore();

  const editStore = useEditStore();
  const promptStore = usePromptStore();

  const { mutate: toggleLike } = useToggleWorkflowLike();
  const { mutate: removeWorkflow } = useRemoveWorkflow();
  const { mutate: removeAsset } = useRemoveAsset();

  // Determine which store to use for prompt/reference actions
  const activeStore = isEditPage ? editStore : promptStore;

  // If item is provided, use it. Otherwise, use the primary item of the workflow.
  const targetItem = item || getPrimaryMedia(workflow);
  const metadata = getItemMetadata(targetItem);
  const { isVideo, url } = metadata;

  const workflowSessionId = workflow?.metadata?.sessionId ?? workflow?.session_id ?? null;
  const isSameSession = !activeSessionId || !workflowSessionId || workflowSessionId === activeSessionId;
  const isInProgress = ["processing", "pending", "uploading"].includes(metadata?.status);
  const canUseAsInput = isSameSession && metadata?.status === "completed" && !!url;
  const canEnterEdit = isSameSession && (metadata?.status === "completed" || isInProgress);
  // Delete is allowed cross-session in UI (server enforces auth separately);
  // only block while a job is in progress to avoid race/confusion.
  const canDelete = !isInProgress;

  const prompt = targetItem?.params?.prompt 
                || targetItem?.mediaMetadata?.requestData?.promptInputs?.[0]?.textInput 
                || workflow.metadata?.displayName 
                || "";

  const handleLike = () => {
    if (workflow.id || workflow.name) {
      toggleLike({ workflowId: workflow.id || workflow.name });
    }
  };

  const handleDelete = () => {
    if (!canDelete) return;
    if (item) {
      removeAsset(item.name || item.id);
    } else {
      removeWorkflow(workflow.name || workflow.id);
    }
  };

  const handleDownload = () => {
    downloadFile(url, isVideo ? "video.mp4" : "image.png");
  };

  const handleReuseSettings = () => {
    if (!canUseAsInput) return;
    const config = (targetItem?.generationConfig) || getPrimaryMediaConfig(workflow) || {};
    const modelName = config.model_name || config.model || "";
    
    const refs = (config.references || []).map(r => ({
      ...r,
      type: r.url?.match(/\.(mp4|webm|mov)$/i) ? "video" : "image"
    }));

    if (isEditPage) {
      // In edit page, reuse settings might mean setting up the edit bar
      editStore.setPrompt(prompt || config.prompt || "");
      editStore.setModelId(modelName);
      editStore.setRatio(config.ratio || config.aspectRatio || "1:1");
      editStore.setReferenceImages(refs);
    } else {
      // In normal page, reuse settings for the generation bar
      promptStore.setGenerationMode(isVideo ? "video" : "image");
      promptStore.setPrompt(prompt || config.prompt || "");
      promptStore.setModelId(modelName);
      promptStore.setRatio(config.ratio || config.aspectRatio || "1:1");
      promptStore.setReferenceImages(refs);
    }
  };

  const handleEdit = () => {
    if (!canEnterEdit) return;
    const config = (targetItem?.generationConfig) || getPrimaryMediaConfig(workflow) || {};
    const modelName = config.model_name || config.model || "";
    const assetId = targetItem?.asset_id || targetItem?.name || targetItem?.id || "";

    // Set edit target and redirect
    editStore.setEditTarget({ 
      workflow_id: workflow.id || workflow.name,
      media_id:    assetId,
      prompt:      prompt || config.prompt || "",
      model_name:  modelName,
      ratio:       config.ratio || config.aspectRatio || "",
    });
    
    // The redirect logic usually happens outside or via router.push in the component
    // but here we just set the store state.
  };

  const handleAnimate = () => {
    if (!canUseAsInput) return;
    const assetId = targetItem?.asset_id || targetItem?.name || targetItem?.id || "";

    if (isEditPage) {
      // If we are in edit page, animate might not be directly supported in the edit bar,
      // but we can add as reference if needed. For now, let's keep it consistent.
    } else {
      promptStore.setGenerationMode("video");
      promptStore.clearReferences();
      promptStore.addReference({
        url,
        asset_id: assetId,
        is_video: false
      }, "start");
    }
  };

  const handleAddToPrompt = () => {
    if (!canUseAsInput) return;
    const assetId = targetItem?.asset_id || targetItem?.name || targetItem?.id || "";
    const asset = { 
      url, 
      asset_id: assetId, 
      is_video: isVideo 
    };
    
    activeStore.addReference(asset, "normal");
  };

  return {
    handleLike,
    handleDelete,
    handleDownload,
    handleReuseSettings,
    handleEdit,
    handleAnimate,
    handleAddToPrompt,
    canDelete,
    isVideo,
    url,
    aspect: metadata.aspect,
    status: metadata.status,
    prompt,
    isLiked: workflow.metadata?.favorited || false,
    item: targetItem, // return the resolved item
  };
}
