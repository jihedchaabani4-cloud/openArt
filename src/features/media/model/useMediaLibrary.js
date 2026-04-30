import { useState, useMemo, useCallback } from "react";
import { useBatchUploadAssets } from "../api/mediaApi";
import { useProjectData } from "@/features/workflows/api/workflowsApi";

/**
 * [FSD Layer: features/media]
 * A shared hook for managing the Media Library state, 
 * using cached project data instead of independent fetching.
 */
export function useMediaLibrary(projectId, initialMode = "all") {
  const [enabled,   setEnabled]   = useState(false);
  const [source,    setSource]    = useState("all"); // 'all' | 'upload' | 'generation'
  const [mediaType, setMediaType] = useState(initialMode); // 'image' | 'video' | 'all'

  // Instead of querying /api/media directly, we just read from the unified project data cache
  const { data: projectData, isFetching: loading } = useProjectData(projectId);

  const { mutateAsync: uploadBatchToServer } = useBatchUploadAssets();

  const items = useMemo(() => {
    if (!projectData?.projectContents?.media) return [];
    
    let allMedia = [...projectData.projectContents.media];
    const workflows = projectData.projectContents.workflows || [];
    const workflowSessionMap = new Map(
      workflows.map((workflow) => [
        workflow.name || workflow.id,
        workflow.metadata?.sessionId || workflow.session_id || null,
      ])
    );
    
    // Sort by descending create_time
    allMedia.sort((a, b) => {
      const tA = new Date(a.mediaMetadata?.createTime || a.create_time || 0).getTime();
      const tB = new Date(b.mediaMetadata?.createTime || b.create_time || 0).getTime();
      return tB - tA;
    });

    // Determine type: 'video' or 'image' and map structure
    allMedia = allMedia.map(m => {
        const isVid = !!m.video || (m.url && /\.(mp4|webm|mov)$/i.test(m.url));
        const workflowId = m.workflowId || m.workflow_id;
        const sessionId =
          m.session_id ||
          m.sessionId ||
          m.mediaMetadata?.sessionId ||
          m.mediaMetadata?.session_id ||
          workflowSessionMap.get(workflowId) ||
          null;

        return {
            ...m,
            id: m.name || m.id,
            type: isVid ? 'video' : 'image',
            is_video: isVid,
            workflow_id: workflowId,
            session_id: sessionId,
            sessionId,
            primaryMediaId: m.name || m.id // requested by user to extract the media id
        };
    });

    // filter by 'source'
    if (source !== "all") {
       const ACCEPTED_GENERATION_STEPS = ["GEN", "EDIT", "CAE", "LIT", "VID", "UP"];
       
       allMedia = allMedia.filter(m => {
           const stepId = (m.workflowStepId || "").toUpperCase();
           const isGeneration = !!m.generationConfig && ACCEPTED_GENERATION_STEPS.includes(stepId);
           
           if (source === "upload") {
               return !isGeneration;
           }
           if (source === "generation") {
               return isGeneration;
           }
           
           // specific stepId filtering (GEN, EDIT, CAE, LIT, VID, UP)
           return stepId === source.toUpperCase();
       });
    }

    // filter by 'mediaType' ('image' vs 'video')
    if (mediaType !== "all") {
       allMedia = allMedia.filter(m => m.type === mediaType);
    }

    return allMedia;
  }, [projectData, source, mediaType]);

  const handleOpen = useCallback((mode = "all") => {
    setMediaType(mode);
    setEnabled(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    // Pagination is mostly handled by caching the entire project now
  }, []);

  const handleUpload = useCallback(async (filesOrFile, sessionId = "") => {
    const files = Array.isArray(filesOrFile) ? filesOrFile : [filesOrFile];
    try {
      const results = await uploadBatchToServer({ 
        files, 
        projectId: projectId ?? "", 
        sessionId 
      });
      return Array.isArray(filesOrFile) ? results : results[0];
    } catch (err) {
      console.error("❌ Media Library Upload Error:", err);
      throw err;
    }
  }, [projectId, uploadBatchToServer]);

  return {
    items,
    loading: enabled && loading,
    hasMore: false,
    source,
    setSource,
    mediaType,
    setMediaType,
    handleOpen,
    handleLoadMore,
    handleUpload,
    setEnabled,
  };
}
