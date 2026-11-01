"use client";

import React, { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { SharedGalleryGrid } from "@/features/media";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { selectStudioWorkflows } from "@/features/workflows/model/selectStudioWorkflows";
import { MediaGridItem } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem";

export function TrashView({ projectId }) {
  const { data, isLoading, isError, error, refetch } = useProjectData(projectId);
  const filters = useGenerationsStore((s) => s.filters);
  const trashedWorkflows = React.useMemo(() => {
    return selectStudioWorkflows(data?.projectContents, {
      lifecycle: "trash",
      filters,
    });
  }, [data?.projectContents, filters]);

  const gridSize = useGenerationsStore((s) => s.gridSize);
  const setIsNavbarHidden = useGenerationsStore((s) => s.setIsNavbarHidden);

  const scrollRef = useRef(null);
  const prevScrollTop = useRef(0);

  // ─── 144Hz responsive navbar toggle & scroll handler ─────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const currentScrollTop = el.scrollTop;
    const isCurrentlyHidden = useGenerationsStore.getState().isNavbarHidden;
    if (currentScrollTop > prevScrollTop.current && currentScrollTop > 80) {
      if (!isCurrentlyHidden) setIsNavbarHidden(true);
    } else if (currentScrollTop < prevScrollTop.current) {
      if (isCurrentlyHidden) setIsNavbarHidden(false);
    }
    prevScrollTop.current = currentScrollTop;
  }, [setIsNavbarHidden]);

  const renderCard = useCallback(
    (cardProps) => <MediaGridItem {...cardProps} isTrash={true} />,
    []
  );

  if (isLoading) {
    return (
      <div className="flex h-full w-full overflow-hidden text-white bg-background relative">
        <main className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-white/60">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-sm">Chargement de la corbeille...</p>
        </main>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full w-full overflow-hidden text-white bg-background relative">
        <main className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <GoogleIcon iconName="error_outline" className="text-4xl text-red-400 mb-3" />
          <p className="text-base text-white/90 mb-1">Impossible de charger la corbeille</p>
          <p className="text-sm text-white/50 mb-4">{error?.message || "Une erreur est survenue."}</p>
          <Button variant="outline" onClick={() => refetch()}>
            Réessayer
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden text-white bg-background relative">
      <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden z-10">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          data-scroll-container="true"
          className="flex-1 overflow-y-auto pt-18 overflow-x-hidden px-6 sm:px-10 lg:px-14 custom-scrollbar w-full"
        >
          <AnimatePresence mode="wait">
            {trashedWorkflows.length > 0 ? (
              <motion.div
                key="trash-feed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-6 w-full pb-32"
              >
                <SharedGalleryGrid
                  workflows={trashedWorkflows}
                  gridSize={gridSize}
                  projectId={projectId}
                  CardComponent={renderCard}
                  itemClassName="rounded-xl border-none shadow-xl"
                />
              </motion.div>
            ) : (
              <motion.div
                key="trash-empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 flex flex-col items-center justify-center min-h-96 w-full my-auto"
              >
                <div className="flex flex-col items-center gap-1">
                  <p className="text-lg text-white/35 font-normal tracking-wide text-center">
                    {Boolean(filters?.prompt?.trim()) && (data?.projectContents?.trashedWorkflows?.length || 0) > 0
                      ? "Aucun élément ne correspond à votre recherche"
                      : "La corbeille est vide"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default TrashView;
