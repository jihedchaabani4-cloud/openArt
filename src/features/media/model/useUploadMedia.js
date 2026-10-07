import { useCallback } from "react";
import { useParams } from "next/navigation";
import { useWorkflowsStore } from "@/features/workflows";
import { useBatchUploadAssets } from "../api/mediaApi";
import { intrinsicSizeToRatioLabel } from "@/shared/lib/displayUtils";

/**
 * useUploadMedia
 * Unified hook for uploading media files (images/videos) to the backend.
 * Automatically resolves projectId from route params or store.
 * Dispatches to POST /api/assets/upload, triggers optimistic updates,
 * and returns canonical normalized items with workflow_id.
 *
 * @param {string} [overrideProjectId] - Optional explicit projectId
 * @returns {{
 *   uploadMedia: (filesOrFile: File | File[]) => Promise<Array<object> | object>,
 *   isUploading: boolean,
 *   projectId: string,
 * }}
 */
export function useUploadMedia(overrideProjectId) {
  const params = useParams();
  const routeProjectId = params?.projectId;

  const storeProjectId = useWorkflowsStore((s) => s.selectedProjectId);

  const effectiveProjectId = overrideProjectId || routeProjectId || storeProjectId;

  const { mutateAsync: uploadBatchToServer, isPending: isUploading } = useBatchUploadAssets();

  const uploadMedia = useCallback(
    async (filesOrFile) => {
      const isArray = Array.isArray(filesOrFile);
      const files = isArray ? filesOrFile : [filesOrFile];

      if (files.length === 0) return isArray ? [] : null;
      if (!effectiveProjectId) {
        throw new Error("Project ID is required for asset uploads.");
      }

      const results = await uploadBatchToServer({
        files,
        projectId: effectiveProjectId,
      });

      // Normalize each returned item to match Prompt Bar and Media Store contract
      const normalized = (results || []).map((res, index) => {
        const wfId = res.workflow_id || res.workflowId || res.asset_id || res.media_id;
        const isVid = res.type === "video" || files[index]?.type?.startsWith("video/");
        const resolvedWidth = res.width || (isVid ? 1280 : 1024);
        const resolvedHeight = res.height || (isVid ? 720 : 1024);
        const resolvedRatio = (res.ratio && res.ratio !== "IMAGE_ASPECT_RATIO_UNSPECIFIED")
          ? res.ratio
          : intrinsicSizeToRatioLabel(resolvedWidth, resolvedHeight);

        return {
          ...res,
          id: wfId,
          workflow_id: wfId,
          workflowId: wfId,
          asset_id: res.asset_id || res.media_id || wfId,
          media_id: res.media_id,
          url: res.url,
          preview: res.url,
          displayName: files[index]?.name || "Uploaded Media",
          name: files[index]?.name || "Uploaded Media",
          type: isVid ? "video" : "image",
          workflow_type: res.workflow_type || "UPLOAD",
          is_upload: true,
          width: resolvedWidth,
          height: resolvedHeight,
          ratio: resolvedRatio,
          aspectRatio: resolvedRatio,
          image_count: 1,
        };
      });

      return isArray ? normalized : normalized[0];
    },
    [effectiveProjectId, uploadBatchToServer]
  );

  return {
    uploadMedia,
    isUploading,
    projectId: effectiveProjectId,
  };
}
