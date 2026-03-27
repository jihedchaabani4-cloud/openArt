import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useAssets, useUploadAsset } from "../api/mediaApi";

/**
 * [FSD Layer: features/media]
 * A shared hook for managing the Media Library state, 
 * pagination, filtering, and uploading for a project.
 */
export function useMediaLibrary(projectId, initialMode = "all") {
  const [enabled,   setEnabled]   = useState(false);
  const [offset,    setOffset]    = useState(0);
  const [source,    setSource]    = useState("all"); // 'all' | 'upload' | 'generation'
  const [mediaType, setMediaType] = useState(initialMode); // 'image' | 'video' | 'all'
  const [items,     setItems]     = useState([]);
  const [hasMore,   setHasMore]   = useState(false);

  const { data: page, isFetching: loading } = useAssets(projectId, {
    enabled,
    offset,
    type:      source === "all" ? null : source,
    mediaType: mediaType === "all" ? null : mediaType,
  });

  const { mutateAsync: uploadAssetToServer } = useUploadAsset();

  // Accumulate pages
  useEffect(() => {
    if (!page?.data) return;
    if (offset === 0) {
      setItems(page.data);
    } else {
      setItems((prev) => [...prev, ...page.data]);
    }
    setHasMore(page.hasMore ?? false);
  }, [page, offset]);

  // Reset when filters change
  useEffect(() => {
    setItems([]);
    setOffset(0);
  }, [projectId, source, mediaType]);

  const handleOpen = useCallback((mode = "all") => {
    setMediaType(mode);
    setEnabled(true);
    setOffset(0);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setOffset((prev) => prev + 30);
    }
  }, [loading, hasMore]);

  const handleUpload = useCallback(async (file, sessionId = "") => {
    try {
      const data = await uploadAssetToServer({ 
        file, 
        projectId: projectId ?? "", 
        sessionId 
      });
      return data;
    } catch (err) {
      console.error("❌ Media Library Upload Error:", err);
      throw err;
    }
  }, [projectId, uploadAssetToServer]);

  return {
    items,
    loading,
    hasMore,
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
