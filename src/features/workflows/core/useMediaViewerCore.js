"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  getItemMetadata,
  getPrimaryMedia,
  intrinsicSizeToCssAspect,
  getCachedImageDimensions,
  setCachedImageDimensions,
} from "@/shared/lib/generationUtils";

// Module-level cache: src → true once the media has loaded once
const MAX_LOADED_CACHE = 800;
const _loadedSrcCache = new Map();

export function markMediaLoaded(src) {
  if (!src) return;
  if (_loadedSrcCache.size >= MAX_LOADED_CACHE) {
    const firstKey = _loadedSrcCache.keys().next().value;
    _loadedSrcCache.delete(firstKey);
  }
  _loadedSrcCache.set(src, true);
}

export function isMediaLoadedInCache(src) {
  return !!(src && _loadedSrcCache.get(src));
}

export function formatMediaDuration(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * useMediaViewerCore
 * Core hook providing all state, sizing, video playback controls,
 * and metadata resolution for media viewers (EditMediaView, MediaGridItem, etc.).
 */
export function useMediaViewerCore({ workflow, item: propItem = null }) {
  const targetItem = propItem || (workflow ? getPrimaryMedia(workflow) : null);
  const metadata = useMemo(() => {
    return targetItem
      ? getItemMetadata(targetItem, workflow)
      : { status: "empty", url: null, isVideo: false, aspect: "1/1", prompt: "" };
  }, [targetItem, workflow]);

  const { isVideo, url, status, aspect: metaAspect, prompt, error } = metadata;
  const progress = targetItem?.progress ?? workflow?.progress ?? 0;

  // ── Intrinsic Dimensions & Pixel-Perfect Aspect Ratio ──
  const cachedDim = url ? getCachedImageDimensions(url) : null;
  const [intrinsicAspect, setIntrinsicAspect] = useState(
    () => cachedDim ? `${cachedDim.width}/${cachedDim.height}` : null
  );

  useEffect(() => {
    if (url) {
      const dim = getCachedImageDimensions(url);
      setIntrinsicAspect(dim ? `${dim.width}/${dim.height}` : null);
    } else {
      setIntrinsicAspect(null);
    }
  }, [url]);

  const handleIntrinsicDimensions = useCallback((w, h) => {
    if (!w || !h) return;
    const cssAspect = intrinsicSizeToCssAspect(w, h);
    setIntrinsicAspect(cssAspect);
    if (url) {
      setCachedImageDimensions(url, w, h);
    }
  }, [url]);

  const displayAspect = intrinsicAspect || metaAspect || "1/1";

  // ── Media Loaded State ──
  const [isMediaLoaded, setIsMediaLoaded] = useState(() => isMediaLoadedInCache(url));

  useEffect(() => {
    if (url && isMediaLoadedInCache(url)) {
      setIsMediaLoaded(true);
    } else {
      setIsMediaLoaded(false);
    }
  }, [url]);

  const onMediaLoaded = useCallback(() => {
    if (url) markMediaLoaded(url);
    setIsMediaLoaded(true);
  }, [url]);

  const onMediaError = useCallback(() => {
    if (url) markMediaLoaded(url);
    setIsMediaLoaded(true);
  }, [url]);

  // ── Video Playback Engine ──
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Sync muted directly on the DOM element for reliable autoplay
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Autoplay on src change
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url || !isVideo) return;

    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
    video.muted = true;
    setIsMuted(true);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setIsPlaying(false);
      });
    }
  }, [url, isVideo]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleVideoTimeUpdate = useCallback((e) => {
    const video = e?.currentTarget || videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    }
  }, []);

  const handleVideoLoadedMetadata = useCallback((e) => {
    const video = e?.currentTarget || videoRef.current;
    if (video) {
      if (video.videoWidth && video.videoHeight) {
        handleIntrinsicDimensions(video.videoWidth, video.videoHeight);
      }
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
      video.muted = isMuted;
    }
    onMediaLoaded();
  }, [handleIntrinsicDimensions, isMuted, onMediaLoaded]);

  const seek = useCallback((ratio) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const targetTime = Math.max(0, Math.min(ratio * video.duration, video.duration));
    video.currentTime = targetTime;
    setCurrentTime(targetTime);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    }
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const isCompleted = status === "completed" && !!url;
  const isProcessing = ["processing", "pending", "uploading", "queued"].includes(status);
  const isFailed = ["failed", "error", "rejected"].includes(status);

  return {
    targetItem,
    metadata,
    isVideo,
    url,
    status,
    prompt,
    error,
    progress,
    isCompleted,
    isProcessing,
    isFailed,
    displayAspect,
    intrinsicAspect,
    handleIntrinsicDimensions,
    isMediaLoaded,
    onMediaLoaded,
    onMediaError,
    // Video playback controls
    videoRef,
    isPlaying,
    isMuted,
    currentTime,
    duration,
    progressPercent,
    formattedCurrentTime: formatMediaDuration(currentTime),
    formattedDuration: formatMediaDuration(duration),
    togglePlay,
    toggleMute,
    seek,
    toggleFullscreen,
    handleVideoTimeUpdate,
    handleVideoLoadedMetadata,
  };
}
