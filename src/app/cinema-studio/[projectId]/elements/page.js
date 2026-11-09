"use client";

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { useElementSheetWorkflows } from "@/features/elements"

import { Button } from "@/shared/ui/button";
import { usePromptStore } from "@/features/studio";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";

import { SharedGalleryGrid } from "@/features/media";
import { MediaGridItem } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem";
import { HowToDrawer, ElementsEmptyState } from "@/features/elements";
import { useWorkflowDelete } from "@/features/workflows";
import { ConfirmDeleteDialog } from "@/shared/ui/ConfirmDeleteDialog";
import { NewElementDialog } from "@/widgets/NewElementDialog";

const PAGE_SIZE = 30;

export default function ElementsPage({ params }) {
    const { projectId } = React.use(params)
    const setSelectedProjectId = useGenerationsStore(s => s.setSelectedProjectId);
    const setActiveStudioTab = useGenerationsStore(s => s.setActiveStudioTab);
    const setIsNavbarHidden = useGenerationsStore(s => s.setIsNavbarHidden);

    // Setup active project state without re-render cascades
    React.useEffect(() => {
        if (projectId && useGenerationsStore.getState().selectedProjectId !== projectId) {
            setSelectedProjectId(projectId);
        }
        if (useGenerationsStore.getState().activeStudioTab !== "elements") {
            setActiveStudioTab("elements");
        }
    }, [projectId, setSelectedProjectId, setActiveStudioTab])

    const gridSize = useGenerationsStore(s => s.gridSize);
    const gridSpacing = useGenerationsStore(s => s.gridSpacing);
    
    const isDragging = usePromptStore(s => s.isDraggingGalleryItem);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isNewElementOpen, setIsNewElementOpen] = React.useState(false);
    
    // Natively fetch element sheet workflows via unified selector
    const { workflows: existingSheets, isLoading } = useElementSheetWorkflows(projectId);

    // Auto-open modal if URL has ?new=true or ?create=true
    React.useEffect(() => {
        if (searchParams?.get("new") === "true" || searchParams?.get("create") === "true") {
            setIsNewElementOpen(true);
        }
    }, [searchParams]);

    const sheetsListKey = React.useMemo(
        () => existingSheets.map((workflow) => workflow.id || workflow.name).join("|"),
        [existingSheets]
    );
    const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
    const hasMore = visibleCount < existingSheets.length;
    const visibleSheets = React.useMemo(
        () => existingSheets.slice(0, visibleCount),
        [existingSheets, visibleCount]
    );

    const [isHowToOpen, setIsHowToOpen] = React.useState(false);
    const { isDeleteDialogOpen, setIsDeleteDialogOpen, confirmDelete, isDeleting } = useWorkflowDelete();

    // Navigate to the Edit Page for this workflow
    const handleWorkflowClick = React.useCallback((workflow) => {
        const workflowId = workflow?.id || workflow?.name;
        if (!workflowId || !projectId) return;
        router.push(`/cinema-studio/${projectId}/elements/${workflowId}`);
    }, [projectId, router]);

    const scrollRef = React.useRef(null);
    const prevScrollTop = React.useRef(0);

    const loadMore = React.useCallback(() => {
        setVisibleCount((current) => Math.min(current + PAGE_SIZE, existingSheets.length));
    }, [existingSheets.length]);

    React.useEffect(() => {
        setVisibleCount(PAGE_SIZE);
        prevScrollTop.current = 0;
        setIsNavbarHidden(false);
    }, [projectId, sheetsListKey, setIsNavbarHidden]);

    // ─── 144Hz responsive infinite scroll handler ─────
    const handleScroll = React.useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;

        const currentScrollTop = el.scrollTop;
        prevScrollTop.current = currentScrollTop;

        if (hasMore) {
            const remainingScroll = el.scrollHeight - (currentScrollTop + el.clientHeight);
            if (remainingScroll <= 300) {
                loadMore();
            }
        }
    }, [hasMore, loadMore]);

    React.useEffect(() => {
        const el = scrollRef.current;
        if (!el || !hasMore) return;

        if (el.scrollHeight <= el.clientHeight + 120) {
            loadMore();
        }
    }, [hasMore, loadMore, visibleSheets.length]);

    if (isLoading) {
        return <LoadingScreen message="Loading elements..." />
    }

    return (
        <div className="flex h-full w-full overflow-hidden text-white bg-background relative">
            <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden z-10">
                {/* ── Global Drag Overlay ── */}
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
                    data-scroll-container="true"
                    className="flex-1 overflow-y-auto overflow-x-hidden p-0 custom-scrollbar w-full"
                >
                    {/* ── Elements Grid (Full Width 100%) ── */}
                    {visibleSheets.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full my-auto">
                            <ElementsEmptyState onCreateElement={() => setIsNewElementOpen(true)} />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 w-full pb-32">
                            <SharedGalleryGrid
                                workflows={visibleSheets}
                                gridSize={gridSize}
                                gridSpacing={gridSpacing}
                                projectId={projectId}
                                CardComponent={MediaGridItem}
                                onWorkflowClick={handleWorkflowClick}
                            />
                            {hasMore && (
                                <div className="flex justify-center pt-2 text-sm text-white/45">
                                    Scroll down to load more
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Floating Action Button (New Element) */}
                {visibleSheets.length > 0 && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40">
                        <Button
                            type="button"
                            variant="secondary"
                            className="h-auto px-6 py-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white active:scale-95 border-none backdrop-blur-md text-sm font-medium"
                            onClick={() => setIsNewElementOpen(true)}
                        >
                            <GoogleIcon iconName="add" className="text-xl" />
                            <span>New element</span>
                        </Button>
                    </div>
                )}

                <HowToDrawer
                    isOpen={isHowToOpen}
                    onClose={() => setIsHowToOpen(false)}
                />

                <ConfirmDeleteDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    title="Delete Element?"
                    description="This action will permanently delete this element reference sheet."
                    onConfirm={() => confirmDelete(projectId)}
                    isDeleting={isDeleting}
                />

                <NewElementDialog
                    open={isNewElementOpen}
                    onOpenChange={setIsNewElementOpen}
                    projectId={projectId}
                />
            </main>
        </div>
    )
}
