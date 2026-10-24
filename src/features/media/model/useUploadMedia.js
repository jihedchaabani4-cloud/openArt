import { useCallback } from "react";
import { useParams, useSearchParams, usePathname } from "next/navigation";
import { useWorkflowsStore } from "@/features/workflows";
import { useBatchUploadAssets } from "../api/mediaApi";
import { intrinsicSizeToRatioLabel } from "@/shared/lib/displayUtils";
import { validateFilesAgainstPolicy, DEFAULT_UPLOAD_POLICY } from "../uploadPolicy";
import { api } from "@/shared/api/client";

/**
 * Standalone direct media upload helper.
 * Validates against DEFAULT_UPLOAD_POLICY and uploads via POST /api/assets/upload.
 * Used by MediaInput and non-hook call sites without requiring React Query context.
 */
export async function uploadMediaAsset(file, { projectId, folderId } = {}) {
  const pId = projectId || useWorkflowsStore.getState?.()?.selectedProjectId;
  if (!pId) throw new Error("Project ID is required for asset uploads.");

  const validation = validateFilesAgainstPolicy(file, DEFAULT_UPLOAD_POLICY);
  if (!validation.valid) {
    throw new Error(validation.message || "File validation failed");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("project_id", pId);
  formData.append("workflow_type", "UPLOAD");
  formData.append("workflowType", "UPLOAD");
  formData.append("type", "upload");
  formData.append("source", "upload");
  if (folderId) formData.append("folder_id", folderId);

  const res = await api.postForm("/api/assets/upload", formData);
  const data = res?.data || res;
  const returned = Array.isArray(data) ? data[0] : (data?.asset || data);
  const wfId = returned?.workflow_id || returned?.workflowId || returned?.asset_id || returned?.media_id || returned?.id;
  const isVid = returned?.type === "video" || file?.type?.startsWith("video/");
  const width = returned?.width || (isVid ? 1280 : 1024);
  const height = returned?.height || (isVid ? 720 : 1024);
  const ratio = returned?.ratio && returned?.ratio !== "IMAGE_ASPECT_RATIO_UNSPECIFIED"
    ? returned.ratio
    : intrinsicSizeToRatioLabel(width, height);

  return {
    ...returned,
    id: wfId,
    workflow_id: wfId,
    workflowId: wfId,
    asset_id: returned?.asset_id || returned?.media_id || wfId,
    media_id: returned?.media_id || wfId,
    url: returned?.url,
    preview: returned?.url,
    displayName: file?.name || "Uploaded Media",
    name: file?.name || "Uploaded Media",
    type: isVid ? "video" : "image",
    workflow_type: returned?.workflow_type || "UPLOAD",
    is_upload: true,
    width,
    height,
    ratio,
    aspectRatio: ratio,
    image_count: 1,
  };
}

/**
 * useUploadMedia
 * Unified hook for uploading media files (images/videos) to the backend.
 * Automatically resolves projectId from route params or store.
 * Dispatches to POST /api/assets/upload, triggers optimistic updates,
 * and returns canonical normalized items with workflow_id.
 *
 * @param {string} [overrideProjectId] - Optional explicit projectId
 * @returns {{
 *   uploadMedia: (filesOrFile: File | File[], options?: { folderId?: string, collectionId?: string }) => Promise<Array<object> | object>,
 *   isUploading: boolean,
 *   projectId: string,
 *   folderId: string | null,
 *   collectionId: string | null,
 * }}
 */
export function useUploadMedia(overrideProjectId) {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeProjectId = params?.projectId;
  const routeCollectionId = params?.collectionId;

  const isCollectionPage = pathname?.includes("/collection/") || Boolean(routeCollectionId);
  const isDirectAssetsPage = pathname?.includes("/assets") && !isCollectionPage;

  // In direct assets: strictly null. In collection page: routeCollectionId.
  const pageCollectionId = isDirectAssetsPage
    ? null
    : (isCollectionPage
        ? (routeCollectionId || null)
        : (searchParams?.get("collection_id") || searchParams?.get("folder_id") || searchParams?.get("folderId") || null));

  const storeProjectId = useWorkflowsStore((s) => s.selectedProjectId);
  const effectiveProjectId = overrideProjectId || routeProjectId || storeProjectId;

  const { mutateAsync: uploadBatchToServer, isPending: isUploading } = useBatchUploadAssets();

  const uploadMedia = useCallback(
    async (filesOrFile, options = {}) => {
      const isArray = Array.isArray(filesOrFile);
      const files = isArray ? filesOrFile : [filesOrFile];

      if (files.length === 0) return isArray ? [] : null;
      if (!effectiveProjectId) {
        throw new Error("Project ID is required for asset uploads.");
      }

      // Pre-flight UX validation against DEFAULT_UPLOAD_POLICY (ADR-0012, Ticket 08)
      const validation = validateFilesAgainstPolicy(files, DEFAULT_UPLOAD_POLICY);
      if (!validation.valid) {
        throw new Error(validation.message || "Invalid files for media upload.");
      }

      // Check if options explicitly defined folderId / collectionId (null is preserved)
      const explicitFolderId =
        options?.folderId !== undefined
          ? options.folderId
          : (options?.collectionId !== undefined
              ? options.collectionId
              : (options?.folder_id !== undefined
                  ? options.folder_id
                  : options?.collection_id));

      const effectiveFolderId = explicitFolderId !== undefined ? explicitFolderId : pageCollectionId;

      const results = await uploadBatchToServer({
        files,
        projectId: effectiveProjectId,
        folderId: effectiveFolderId || null,
        collectionId: effectiveFolderId || null,
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
    [effectiveProjectId, uploadBatchToServer, pageCollectionId]
  );

  return {
    uploadMedia,
    isUploading,
    projectId: effectiveProjectId,
    collectionId: pageCollectionId,
    folderId: pageCollectionId,
  };
}
