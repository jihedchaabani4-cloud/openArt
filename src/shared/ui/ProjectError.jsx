"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

/**
 * [FSD Layer: shared/ui]
 * Standardized ProjectError with Legacy Design and Smart Logic.
 */
export function ProjectError() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const clearProjectStudioState = useCallback(() => {
    // 🧹 Clean up cache and session storage to avoid sticky errors
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

  const handleBack = () => {
    clearProjectStudioState();
    router.push("/projects");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen flex flex-col items-center justify-center text-white bg-[#050505]"
    >
      <h2 className="mb-6 text-2xl font-medium tracking-tight text-white/90">
        Un problème est survenu.
      </h2>
      
      <button
        onClick={handleBack}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 shadow-lg"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux projets
      </button>
    </motion.div>
  );
}
