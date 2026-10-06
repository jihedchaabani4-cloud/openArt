"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";

/**
 * Legacy /elements/new page
 * Automatically redirects to /elements?new=true to open the NewElementDialog modal.
 */
export default function LegacyNewElementPage({ params }) {
  const { projectId } = use(params);
  const router = useRouter();

  useEffect(() => {
    if (projectId) {
      router.replace(`/cinema-studio/${projectId}/elements?new=true`);
    }
  }, [projectId, router]);

  return <LoadingScreen message="Opening new element dialog..." />;
}