"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useLibraryWorkflowDetail } from "@/features/media";
import { queryKeys } from "@/shared/api/queryKeys";
import { isVideoUrl } from "../assetsUtils";
import { useAuthSession } from "@/shared/api/auth";

function findCachedLibraryEntry(queryClient, workflowId) {
  const detailEntry = queryClient.getQueryData(queryKeys.library.detail(workflowId));
  if (detailEntry) return detailEntry;

  const queries = queryClient.getQueriesData({
    queryKey: queryKeys.library.all(),
  });

  for (const [, queryData] of queries) {
    const pages = queryData?.pages || [];
    for (const page of pages) {
      const match = (page?.data || []).find((entry) => entry?.workflow?.id === workflowId);
      if (match) return match;
    }

    const directMatch = queryData?.data?.find?.((entry) => entry?.workflow?.id === workflowId);
    if (directMatch) return directMatch;
  }

  return null;
}

function AssetDetailState({ message = null }) {
  return (
    <div className="flex min-h-[calc(100vh-75px)] w-full items-center justify-center px-6">
      {message ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-5 text-sm text-white/45">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function MediaViewer({ media, alt, isVideo }) {
  if (!media?.url) {
    return (
      <div className="flex h-[70vh] min-h-[420px] w-full items-center justify-center text-white/35">
        No preview available for this asset.
      </div>
    );
  }

  const viewerStyle = {
    width: "auto",
    height: "min(84vh, calc(100vh - 115px))",
    maxWidth: "min(calc(100vw - 2rem), 1520px)",
  };

  if (isVideo) {
    return (
      <video
        src={media.url}
        controls
        autoPlay
        loop
        playsInline
        className="block bg-black object-contain"
        style={viewerStyle}
      />
    );
  }

  return (
    <img
      src={media.url}
      alt={alt}
      className="block bg-black object-contain"
      style={viewerStyle}
    />
  );
}

export default function AssetDetailPageClient({ workflowId }) {
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: authLoading } = useAuthSession();
  const cachedData = useMemo(
    () => findCachedLibraryEntry(queryClient, workflowId),
    [queryClient, workflowId]
  );
  const { data, isLoading, isError } = useLibraryWorkflowDetail(workflowId, {
    initialData: cachedData ?? undefined,
    enabled: !authLoading && !!currentUser,
  });

  const workflow = data?.workflow || {};
  const media = data?.primary_media || {};
  const isVideo = isVideoUrl(media?.url);
  const viewerAlt = workflow.display_name || "Asset preview";

  if (isLoading && !data) {
    return <AssetDetailState message="Loading asset details..." />;
  }

  if (isError || !data) {
    return <AssetDetailState />;
  }

  return (
    <div className="flex min-h-[calc(100vh-75px)] w-full items-center justify-center bg-[#050505] px-4 py-4 text-white xl:px-6">
      <div className="flex max-w-full justify-center">
        <div className="inline-flex max-w-full items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
          <MediaViewer media={media} alt={viewerAlt} isVideo={isVideo} />
        </div>
      </div>
    </div>
  );
}
