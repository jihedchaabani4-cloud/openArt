"use client";

import Link from "next/link";
import { useLibraryWorkflowDetail } from "@/features/media";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

export default function AssetDetailNavbar({ workflowId, userSlot = null }) {
  const { data } = useLibraryWorkflowDetail(workflowId);
  const displayName = data?.workflow?.display_name || "Media Viewer";

  return (
    <nav className="sticky top-0 z-[110] flex h-[75px] w-full items-center border-b border-white/6 bg-background/92 px-5 backdrop-blur-xl sm:px-6">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/assets"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-white/72 transition hover:bg-white/5 hover:text-white"
            aria-label="Back to assets"
          >
            <GoogleIcon iconName="arrow_back" className="text-2xl" />
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            <div className="truncate text-lg font-semibold tracking-tight text-white">
              {displayName}
            </div>
          </div>
        </div>

        {userSlot && (
          <div className="shrink-0">
            {userSlot}
          </div>
        )}
      </div>
    </nav>
  );
}
