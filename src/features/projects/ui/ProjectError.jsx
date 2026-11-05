"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";

/**
 * Standardized ProjectError with Legacy Design and Smart Logic.
 */
export function ProjectError({ error, reset, onRetry }) {
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

  React.useEffect(() => {
    if (error) console.error("Project Studio Error:", error);
  }, [error]);

  const handleBack = () => {
    clearProjectStudioState();
    router.push("/");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-screen flex flex-col items-center justify-center text-white bg-background"
    >
      <h2 className="mb-6 text-2xl font-medium tracking-tight text-white/90">
        Un problème est survenu.
      </h2>
      
      <div className="flex gap-4">
        {onRetry && (
          <Button
            type="button"
            variant="primary"
            onClick={onRetry}
            className="rounded-sm px-6 py-2.5 shadow-none h-auto"
          >
            Réessayer
          </Button>
        )}
        
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="rounded-sm px-6 py-2.5 shadow-none h-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux projets
        </Button>
      </div>
    </motion.div>
  );
}

export default ProjectError;
