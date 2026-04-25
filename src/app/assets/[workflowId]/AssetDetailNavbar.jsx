"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, PlaySquare } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/queryKeys";
import { UserDropdown } from "@/widgets/StudioNavbar/ui/UserDropdown";

export default function AssetDetailNavbar({ workflowId }) {
  const queryClient = useQueryClient();
  const displayName = useMemo(() => {
    const detailEntry = queryClient.getQueryData(queryKeys.library.detail(workflowId));
    if (detailEntry?.workflow?.display_name) {
      return detailEntry.workflow.display_name;
    }

    const queries = queryClient.getQueriesData({
      queryKey: queryKeys.library.all(),
    });

    for (const [, queryData] of queries) {
      const pages = queryData?.pages || [];
      for (const page of pages) {
        const match = (page?.data || []).find((entry) => entry?.workflow?.id === workflowId);
        if (match?.workflow?.display_name) {
          return match.workflow.display_name;
        }
      }
    }

    return "Media Viewer";
  }, [queryClient, workflowId]);

  return (
    <nav className="sticky top-0 z-[110] flex h-[75px] w-full items-center border-b border-white/6 bg-[#050505]/92 px-5 backdrop-blur-xl sm:px-6">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/assets"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/72 transition hover:bg-white/5 hover:text-white"
            aria-label="Back to assets"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={3} />
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            <div className="truncate text-lg font-semibold tracking-tight text-white">
              {displayName}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <UserDropdown />
        </div>
      </div>
    </nav>
  );
}
