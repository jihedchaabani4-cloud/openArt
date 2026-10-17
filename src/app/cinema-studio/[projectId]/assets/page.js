"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"

import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { useFilteredWorkflows as useFilteredGenerations } from "@/features/workflows/model/useFilteredWorkflows"
import { useQueryClient } from "@tanstack/react-query"
import { useGenerateMutation } from "@/features/workflows/api/workflowsApi"
import { useProjectFolders } from "@/features/folders"
import { queryKeys } from "@/shared/api/queryKeys"
import {
  GeneratedPromptBar,
  useRealBackendModels,
} from "@/features/prompt-bar/index.platform"
import { SharedGalleryGrid } from "@/features/media"
import { MediaGridItem } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem"

import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";
import { buildCollectionCoverById } from "@/shared/lib/displayUtils";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";
import { logger } from "@/shared/lib/logger";

const PAGE_SIZE = 30;

// ─── Sub-Components ──────────────────────────────────────────────────────────

const EmptyState = () => (
    <div className="w-full h-full flex flex-col items-center justify-center">
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
        >
            <div className="flex flex-col items-center gap-1">
                <p className="text-[18px] text-white/35 font-normal tracking-wide text-center">
                    Start creating or drop media
                </p>
            </div>
        </motion.div>
    </div>
)

export default function AssetsPage({ params }) {
    const { projectId } = React.use(params)
    const setSelectedProjectId = useGenerationsStore(s => s.setSelectedProjectId);
    const setActiveStudioTab   = useGenerationsStore(s => s.setActiveStudioTab);
    const gridSize             = useGenerationsStore(s => s.gridSize);
    const setIsNavbarHidden    = useGenerationsStore(s => s.setIsNavbarHidden);

    // Set the active project on mount
    React.useEffect(() => {
        if (projectId && useGenerationsStore.getState().selectedProjectId !== projectId) {
            setSelectedProjectId(projectId);
        }
        if (useGenerationsStore.getState().activeStudioTab !== "assets") {
            setActiveStudioTab("assets");
        }
    }, [projectId, setSelectedProjectId, setActiveStudioTab])

    const isDragging = usePromptStore(s => s.isDraggingGalleryItem);
    const draggedItem = usePromptStore(s => s.draggedItem);
    const router = useRouter();

    const queryClient = useQueryClient();
    const { data: backendData } = useRealBackendModels({ projectId });
    const realModels = React.useMemo(() => backendData?.models || [], [backendData]);
    const { mutateAsync: runGenerate, isPending: isGeneratingMutation } = useGenerateMutation();

    const handleGenerate = React.useCallback(
        async (request) => {
            if (!request?.prompt?.trim()) return;
            const chosenModel = realModels.find((m) => m.id === request.model || m.key === request.model);
            const isVideo = chosenModel?.domain === "video" || chosenModel?.category === "video" || String(request.model).startsWith("ltx") || String(request.model).startsWith("seedance") || String(request.model).startsWith("wan");

            const payload = {
                model: request.model,
                prompt: request.prompt,
                project_id: projectId,
                parameters: request.parameters || {},
                references: request.references || [],
                elements: request.elements || [],
                characters: request.characters || [],
            };

            try {
                const res = await runGenerate({ payload, isVideo });
                const finalProj = res?.project_id ?? projectId;
                if (finalProj) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(finalProj) });
                }
            } catch (err) {
                logger.error("generation_execution_failed", { error: err });
            }
        },
        [projectId, realModels, runGenerate, queryClient]
    );
    
    // Fetch project workflows/assets (pure project-level feed, no session parameter)
    const { data: fetchResult, isLoading } = useFilteredGenerations(projectId);
    const workflows = React.useMemo(
        () => fetchResult?.filteredWorkflows || [],
        [fetchResult?.filteredWorkflows]
    );

    // Fetch project folders/collections
    const { data: rawFolders = [], isLoading: isFoldersLoading } = useProjectFolders(projectId);
    const collections = React.useMemo(() => {
        if (Array.isArray(rawFolders)) return rawFolders;
        if (Array.isArray(rawFolders?.items)) return rawFolders.items;
        return [];
    }, [rawFolders]);

    const collectionCoverById = React.useMemo(
        () => buildCollectionCoverById(workflows),
        [workflows]
    );

    const setActiveCollectionId = useGenerationsStore(s => s.setActiveCollectionId);
    const searchParams = useSearchParams();

    // Reset active collection when on root assets feed, or redirect if URL has collection_id
    React.useEffect(() => {
        const urlColId = searchParams?.get("collection_id") || searchParams?.get("folder_id");
        if (urlColId && projectId) {
            router.replace(`/cinema-studio/${projectId}/collection/${urlColId}`);
            return;
        }
        setActiveCollectionId(null);
    }, [searchParams, projectId, router, setActiveCollectionId]);

    // Unified list containing collections first, then root workflows
    const combinedItems = React.useMemo(() => {
        // Only root-level folders (no parent) appear on the assets page
        const rootCollections = collections.filter(c => !c.parentId && !c.parent_id);

        const collectionItems = rootCollections.map(col => ({
            type: "collection",
            data: col,
            key: `col-${col.id}`,
        }));

        const rootWorkflows = workflows
            .filter(w => !w.folder_id && !w.folderId)
            .map(w => ({
                type: "workflow",
                data: w,
                key: w.id || w.name,
            }));

        return [...collectionItems, ...rootWorkflows];
    }, [collections, workflows]);

    const itemListKey = React.useMemo(
        () => combinedItems.map((item) => item.key).join("|"),
        [combinedItems]
    );
    const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
    const hasMore = visibleCount < combinedItems.length;
    const visibleItems = React.useMemo(
        () => combinedItems.slice(0, visibleCount),
        [combinedItems, visibleCount]
    );

    // Navigate to the Edit Page for this workflow
    const handleWorkflowClick = React.useCallback((workflow) => {
        const workflowId = workflow?.id || workflow?.name;
        if (!workflowId || !projectId) return;
        router.push(`/cinema-studio/${projectId}/assets/edit/${workflowId}`);
    }, [projectId, router]);

    // Navigate into a collection
    const handleCollectionClick = React.useCallback((collection) => {
        const id = typeof collection === "string"
            ? collection
            : (collection?.id || collection?.name || collection?.folder_id || collection?.folderId);
        if (id && projectId) {
            router.push(`/cinema-studio/${projectId}/collection/${id}`);
        }
    }, [projectId, router]);

    const scrollRef = React.useRef(null);
    const prevScrollTop = React.useRef(0);
    
    const loadMore = React.useCallback(() => {
        setVisibleCount((current) => Math.min(current + PAGE_SIZE, combinedItems.length));
    }, [combinedItems.length]);

    React.useEffect(() => {
        setVisibleCount(PAGE_SIZE);
        prevScrollTop.current = 0;
        setIsNavbarHidden(false);
    }, [projectId, itemListKey, setIsNavbarHidden]);

    // ─── 144Hz responsive navbar toggle & scroll handler ─────
    const handleScroll = React.useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;

        const currentScrollTop = el.scrollTop;

        // Navbar auto-hide on scroll down (> 80px), reveal on scroll up
        const isCurrentlyHidden = useGenerationsStore.getState().isNavbarHidden;
        if (currentScrollTop > prevScrollTop.current && currentScrollTop > 80) {
            if (!isCurrentlyHidden) setIsNavbarHidden(true);
        } else if (currentScrollTop < prevScrollTop.current) {
            if (isCurrentlyHidden) setIsNavbarHidden(false);
        }
        prevScrollTop.current = currentScrollTop;

        if (hasMore) {
            const remainingScroll = el.scrollHeight - (currentScrollTop + el.clientHeight);
            if (remainingScroll <= 300) {
                loadMore();
            }
        }
    }, [hasMore, loadMore, setIsNavbarHidden]);

    React.useEffect(() => {
        const el = scrollRef.current;
        if (!el || !hasMore) return;

        if (el.scrollHeight <= el.clientHeight + 120) {
            loadMore();
        }
    }, [hasMore, loadMore, visibleItems.length]);

    if ((isLoading || isFoldersLoading) && combinedItems.length === 0) {
        return <LoadingScreen message="Loading assets" />
    }

    return (
        <div className="flex h-full w-full overflow-hidden text-white bg-background relative">
            <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden z-10">
                {/* Preserve dragged workflow in DOM to prevent browser canceling HTML5 drag */}
                {isDragging && draggedItem?.workflow && (
                    <div style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none", opacity: 0 }}>
                        <MediaGridItem workflow={draggedItem.workflow} />
                    </div>
                )}

                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    data-scroll-container="true"
                    className="flex-1 overflow-y-auto pt-[72px] overflow-x-hidden px-3 custom-scrollbar"
                >
                    <AnimatePresence mode="wait">
                        {combinedItems.length > 0 ? (
                            <motion.div 
                                key="feed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex flex-col gap-6 w-full pb-32"
                            >
                                <SharedGalleryGrid
                                    entries={visibleItems}
                                    collectionCoverById={collectionCoverById}
                                    gridSize={gridSize}
                                    projectId={projectId}
                                    CardComponent={MediaGridItem}
                                    onWorkflowClick={handleWorkflowClick}
                                    onCollectionClick={handleCollectionClick}
                                    itemClassName="rounded-xl border-none shadow-xl"
                                />
                                {hasMore && (
                                    <div className="flex justify-center pt-2 text-sm text-white/45">
                                        Scroll down to load 30 more
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="w-full h-full flex items-center justify-center"
                            >
                                <EmptyState />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Dedicated Generations PromptBar (Platform Architecture) */}
                <GeneratedPromptBar
                    projectId={projectId}
                    models={realModels}
                    onGenerate={handleGenerate}
                    isGenerating={isGeneratingMutation}
                />
            </main>
        </div>
    )
}
