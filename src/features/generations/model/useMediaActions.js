import { useGenerationsStore } from "./useGenerationsStore";
import { useToggleLike, useRemoveGenerationItem } from "../api/generationsApi";
import { getItemMetadata } from "@/shared/lib/displayUtils";
import { getGenerationConfig } from "@/shared/lib/referenceUtils";
import { downloadFile } from "@/shared/lib/utils";

/**
 * useMediaActions
 * Centralized hook for all media-related actions used in context menus and overlays.
 */
export function useMediaActions(item, group) {
  const { 
    setGenerationMode, 
    addReference, 
    setEditTrigger,
    generationMode,
    referenceImages 
  } = useGenerationsStore();

  const { mutate: toggleLike } = useToggleLike();
  const { mutate: removeItem } = useRemoveGenerationItem();

  const { isVideo, url } = getItemMetadata(item, group);
  const config = getGenerationConfig(item, group);

  const handleLike = () => {
    toggleLike({ itemId: item.id });
  };

  const handleDelete = () => {
    removeItem({ itemId: item.id });
  };

  const handleDownload = () => {
    downloadFile(url, isVideo ? "video.mp4" : "image.png");
  };

  const handleReuseSettings = () => {
    setGenerationMode(isVideo ? "video" : "image");
    setEditTrigger({ params: config });
  };

  const handleAnimate = () => {
    setGenerationMode("video");
    setEditTrigger({
      params: {
        prompt: "",
        model_name: "kling_v3_std",
        generation_mode: "video",
        references: [{
          url,
          asset_id: item.asset_id,
          role: "start",
          type: "image"
        }]
      }
    });
  };

  const handleAddToPrompt = () => {
    const asset = { 
      url, 
      asset_id: item.asset_id, 
      is_video: isVideo 
    };

    if (generationMode === "image") {
      addReference(asset, "normal");
      return;
    }

    const hasStart = referenceImages.some(r => r.role === "start");
    addReference(asset, hasStart ? "end" : "start");
  };

  return {
    handleLike,
    handleDelete,
    handleDownload,
    handleReuseSettings,
    handleAnimate,
    handleAddToPrompt,
    isVideo,
    url,
    config,
    isLiked: item.is_liked
  };
}
