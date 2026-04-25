"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * [FSD Layer: app/projects/[projectId]]
 * Robust Error Boundary for Project Studio.
 *
 * Logic:
 * 1. Clear failed project queries so error states do not stick.
 * 2. Remove entry flags used by the project layout smart-navigation logic.
 * 3. Reset the boundary before retrying or navigating back to the projects list.
 */
export default function ProjectError({ error, reset }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const clearProjectStudioState = useCallback(() => {
    queryClient.removeQueries({ queryKey: ["projectData"] });

    if (typeof window !== "undefined") {
      const keysToRemove = [];

      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i);
        if (key?.startsWith("project-") && key.endsWith("-active")) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
    }
  }, [queryClient]);

  useEffect(() => {
    clearProjectStudioState();
    console.error("Project Studio Error:", error);
  }, [clearProjectStudioState, error]);

  const handleTryAgain = () => {
    clearProjectStudioState();
    reset();
  };

  const handleBackToProjects = () => {
    clearProjectStudioState();
    reset();
    router.replace("/projects");
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#050505] p-6 text-white">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
        <RefreshCcw className="h-8 w-8 animate-pulse text-red-500" />
      </div>

      <h2 className="mb-2 text-2xl font-bold tracking-tight text-white">
        Project Studio Unavailable
      </h2>
      <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-white/40">
        We couldn&apos;t load the project data. This might be due to an invalid
        ID, network issues, or session expiry.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          onClick={handleTryAgain}
          className="flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-black shadow-2xl transition hover:bg-white/90"
        >
          Try Again
        </button>

        <button
          onClick={handleBackToProjects}
          className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-bold text-white transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </button>
      </div>
    </div>
  );
}
