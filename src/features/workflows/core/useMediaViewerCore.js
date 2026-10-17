"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  getItemMetadata,
  intrinsicSizeToCssAspect,
  getCachedImageDimensions,
  setCachedImageDimensions,
} from "@/shared/lib/generationUtils";
import { resolveMainMedia } from "./resolveMediaRef";

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
export function useMediaViewerCore({ workflow, item: propItem = null, mediaId = null, autoPlay = true }) {
  const effectiveMediaId = mediaId || (typeof propItem === "string" ? propItem : null);
  const targetItem = useMemo(() => {
    if (typeof propItem === "object" && propItem !== null) return propItem;
    if (workflow?.items && effectiveMediaId) {
      const found = workflow.items.find(
        (i) => (i.id || i.name || i.asset_id) === effectiveMediaId
      );
      if (found) return found;
    }
    if (workflow) {
      const resolved = resolveMainMedia(workflow);
      if (resolved) return resolved.raw || resolved;
      return {
        id: workflow.id || workflow.name,
        status: workflow.status || "processing",
        url: null,
      };
    }
    if (effectiveMediaId) return { id: effectiveMediaId };
    return null;
  }, [propItem, workflow, effectiveMediaId]);

  const metadata = useMemo(() => {
    return targetItem
      ? getItemMetadata(targetItem, workflow)
      : { status: "empty", url: null, isVideo: false, aspect: null, prompt: "" };
  }, [targetItem, workflow]);

  const { isVideo, url, status, aspect: metaAspect, prompt, error } = metadata;
  const progress = targetItem?.progress ?? workflow?.progress ?? 0;

  // ── Intrinsic Dimensions & Pixel-Perfect Aspect Ratio ──
  const cachedDim = url ? getCachedImageDimensions(url) : null;
  const [intrinsicAspect, setIntrinsicAspect] = useState(
    () => (cachedDim ? `${cachedDim.width}/${cachedDim.height}` : null)
  );
  const [intrinsicSize, setIntrinsicSize] = useState(
    () => (cachedDim ? { width: cachedDim.width, height: cachedDim.height } : null)
  );

  const handleIntrinsicDimensions = useCallback((w, h) => {
    if (!w || !h) return;
    const cssAspect = intrinsicSizeToCssAspect(w, h);
    setIntrinsicAspect((prev) => (prev === cssAspect ? prev : cssAspect));
    setIntrinsicSize((prev) => (prev?.width === w && prev?.height === h ? prev : { width: w, height: h }));
    if (url) {
      setCachedImageDimensions(url, w, h);
    }
  }, [url]);

  useEffect(() => {
    if (url) {
      const dim = getCachedImageDimensions(url);
      if (dim) {
        setIntrinsicAspect(`${dim.width}/${dim.height}`);
        setIntrinsicSize({ width: dim.width, height: dim.height });
      } else {
        setIntrinsicAspect(null);
        setIntrinsicSize(null);
      }
    } else {
      setIntrinsicAspect(null);
      setIntrinsicSize(null);
    }
  }, [url]);

  const displayAspect = intrinsicAspect || metaAspect || null;

  const aspectRatioNumber = useMemo(() => {
    if (intrinsicSize?.width && intrinsicSize?.height) {
      return intrinsicSize.width / intrinsicSize.height;
    }
    if (displayAspect && displayAspect.includes("/")) {
      const parts = displayAspect.split("/").map(Number);
      if (parts[0] && parts[1]) {
        return parts[0] / parts[1];
      }
    }
    return 1;
  }, [intrinsicSize, displayAspect]);

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
    setIsMediaLoaded((prev) => (prev ? prev : true));
  }, [url]);

  const onMediaError = useCallback(() => {
    if (url) markMediaLoaded(url);
    setIsMediaLoaded((prev) => (prev ? prev : true));
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
    if (!video || !url || !isVideo || !autoPlay) return;

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
  }, [url, isVideo, autoPlay]);

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
    intrinsicSize,
    aspectRatioNumber,
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
