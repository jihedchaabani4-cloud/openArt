"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { useFilteredWorkflows as useFilteredGenerations } from "@/features/workflows/model/useFilteredWorkflows"
import { useQueryClient } from "@tanstack/react-query"
import { useGenerateMutation } from "@/features/workflows/api/workflowsApi"
import { queryKeys } from "@/shared/api/queryKeys"
import {
  PromptBarPlatform,
  generatedMediaType,
  generatedMediaConfig,
  useRealBackendModels,
} from "@/features/prompt-bar/index.platform"
import { isLtxModel } from "@/features/prompt-bar/providers/ltx/index.js"
import { RowsPhotoAlbum } from 'react-photo-album'
import 'react-photo-album/rows.css'
import { MediaGridItem } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem"
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { useProjectFolders } from "@/features/folders";

import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";
import { getPrimaryMedia } from "@/shared/lib/generationUtils";
import { getItemMetadata as getDisplayMeta, getStudioGridDensity } from "@/shared/lib/displayUtils";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";

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
    const activeCollectionId   = useGenerationsStore(s => s.activeCollectionId);
    const setActiveCollectionId = useGenerationsStore(s => s.setActiveCollectionId);

    // Fetch project folders/collections
    const { data: projectFolders = [] } = useProjectFolders(projectId);

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
    const router = useRouter();

    const queryClient = useQueryClient();
    const { data: backendData } = useRealBackendModels({ projectId });
    const realModels = React.useMemo(() => backendData?.models || [], [backendData]);
    const { mutateAsync: runGenerate, isPending: isGeneratingMutation } = useGenerateMutation();

    const handleGenerate = React.useCallback(
        async (request) => {
            if (!request?.prompt?.trim()) return;
            const chosenModel = realModels.find((m) => m.id === request.model);
            const isVideo = chosenModel?.domain === "video";

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
                if (isLtxModel(request.model)) {
                    const res = await fetch("/api/ltx/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    });
                    const data = await res.json();
                    if (!data.ok) {
                        throw new Error(data.message || "LTX generation failed");
                    }
                    if (projectId) {
                        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
                    }
                } else {
                    const res = await runGenerate({ payload, isVideo });
                    const finalProj = res?.project_id ?? projectId;
                    if (finalProj) {
                        queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(finalProj) });
                    }
                }
            } catch (err) {
                console.error("Generation execution failed:", err);
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
    const workflowListKey = React.useMemo(
        () => workflows.map((workflow) => workflow.id || workflow.name).join("|"),
        [workflows]
    );
    const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
    const hasMore = visibleCount < workflows.length;
    const visibleWorkflows = React.useMemo(
        () => workflows.slice(0, visibleCount),
        [workflows, visibleCount]
    );

    // Navigate to the Edit Page for this workflow
    const handleWorkflowClick = React.useCallback((workflow) => {
        const workflowId = workflow?.id || workflow?.name;
        if (!workflowId || !projectId) return;
        router.push(`/cinema-studio/${projectId}/assets/edit/${workflowId}`);
    }, [projectId, router]);

    const activeCollection = React.useMemo(() => {
        if (!activeCollectionId) return null;
        return projectFolders.find((f) => f.id === activeCollectionId) || null;
    }, [projectFolders, activeCollectionId]);

    const handleCollectionClick = React.useCallback((collection) => {
        if (!collection?.id) return;
        setActiveCollectionId(collection.id);
    }, [setActiveCollectionId]);

    // Format collections list (shown at the beginning of the grid in root view)
    const collections = React.useMemo(() => {
        if (activeCollectionId) return [];
        return (projectFolders || []).map((col) => ({
            ...col,
            type: "collection",
            isCollection: true,
            key: `collection-${col.id}`,
        }));
    }, [projectFolders, activeCollectionId]);

    // Workflows: when inside a collection, filter by that collection's ID
    const displayedWorkflows = React.useMemo(() => {
        if (!activeCollectionId) return visibleWorkflows;
        return workflows.filter((w) => w.folder_id === activeCollectionId || w.metadata?.folderId === activeCollectionId);
    }, [workflows, visibleWorkflows, activeCollectionId]);

    // Combined items: Collections placed FIRST, followed by workflows
    const allGridItems = React.useMemo(() => {
        return [...collections, ...displayedWorkflows];
    }, [collections, displayedWorkflows]);

    const scrollRef = React.useRef(null);
    const prevScrollTop = React.useRef(0);
    
    const loadMore = React.useCallback(() => {
        setVisibleCount((current) => Math.min(current + PAGE_SIZE, workflows.length));
    }, [workflows.length]);

    React.useEffect(() => {
        setVisibleCount(PAGE_SIZE);
        prevScrollTop.current = 0;
        setIsNavbarHidden(false);
    }, [projectId, workflowListKey, setIsNavbarHidden]);

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
    }, [hasMore, loadMore, visibleWorkflows.length]);

    const density = getStudioGridDensity(gridSize);

    const renderPhoto = React.useCallback(
        (_, { photo, width, height }) => (
            <MediaGridItem
                key={photo.key}
                workflow={photo.workflow}
                onClick={photo.isCollection ? handleCollectionClick : handleWorkflowClick}
                className="rounded-2xl border-none shadow-xl"
                width={width}
                height={height}
            />
        ),
        [handleWorkflowClick, handleCollectionClick]
    );

    const albumRender = React.useMemo(() => ({
        photo: renderPhoto,
    }), [renderPhoto]);

    const photos = React.useMemo(() => {
        return allGridItems.reduce((acc, item, i) => {
            if (item.type === "collection" || item.isCollection) {
                const BASE = 1200;
                const width  = BASE;
                const height = Math.round(BASE * (3 / 4));

                acc.push({
                    src:          "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
                    width,
                    height,
                    key:          item.key || `collection-${item.id}`,
                    workflow:     item,
                    type:         "collection",
                    isCollection: true,
                });
                return acc;
            }

            const primaryItem = getPrimaryMedia(item);
            if (!primaryItem) return acc;

            const meta = getDisplayMeta(primaryItem, item);
            const aspect = meta?.aspect ?? "3/4";
            const [wStr, hStr] = aspect.split("/");
            const wNum = parseFloat(wStr) || 3;
            const hNum = parseFloat(hStr) || 4;
            const BASE = 1200;
            const width  = Math.round(BASE * (wNum / Math.max(wNum, hNum)));
            const height = Math.round(BASE * (hNum / Math.max(wNum, hNum)));

            const url = meta?.url || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

            acc.push({
                src:          url,
                width,
                height,
                key:          item.id || item.name || String(i),
                workflow:     item,
                type:         "workflow",
                isCollection: false,
            });
            return acc;
        }, []);
    }, [allGridItems]);

    if (isLoading && workflows.length === 0 && projectFolders.length === 0) {
        return <LoadingScreen message="Loading assets" />
    }

    return (
        <div className="flex h-full w-full overflow-hidden text-white bg-background relative">
            <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden z-10">
                <AnimatePresence>
                    {isDragging && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[25] bg-black/60 backdrop-blur-[4px] pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                <div 
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto pt-[72px] overflow-x-hidden px-3 py-3 custom-scrollbar"
                >
                    {activeCollection && (
                        <div className="flex items-center gap-2 mb-3 px-1">
                            <button
                                onClick={() => setActiveCollectionId(null)}
                                className="flex items-center gap-1.5 text-[13px] text-white/50 hover:text-white transition-colors cursor-pointer"
                            >
                                <GoogleIcon iconName="arrow_back" className="text-[16px]" />
                                <span>All Assets</span>
                            </button>
                            <span className="text-white/20 text-xs">/</span>
                            <span className="text-[13px] text-white/90 font-medium">{activeCollection.name}</span>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {allGridItems.length > 0 ? (
                            <motion.div 
                                key="feed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex flex-col gap-6 w-full pb-32"
                            >
                                <RowsPhotoAlbum
                                    photos={photos}
                                    targetRowHeight={density.targetRowHeight}
                                    spacing={density.spacing}
                                    rowConstraints={{ singleRowMaxHeight: density.targetRowHeight * density.maxRowHeightMultiplier }}
                                    render={albumRender}
                                />
                                {hasMore && !activeCollectionId && (
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
                <PromptBarPlatform
                    type={generatedMediaType}
                    featureConfig={generatedMediaConfig}
                    models={realModels}
                    onGenerate={handleGenerate}
                    isGenerating={isGeneratingMutation}
                />
            </main>
        </div>
    )
}
