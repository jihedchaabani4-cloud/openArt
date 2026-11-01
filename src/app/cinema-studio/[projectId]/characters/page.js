"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { useCharacterWorkflows } from "@/features/characters"
import { Plus } from "lucide-react"
import { usePromptStore } from "@/features/studio";
import { LoadingScreen } from "@/shared/ui/LoadingScreen"

import { SharedGalleryGrid } from "@/features/media"
import { MediaGridItem } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem"
import { HowToDrawer } from "@/components/cinema-studio/elements/HowToDrawer"
import { useWorkflowDelete } from "@/features/workflows"
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog"
import { Button } from "@/shared/ui/button"

const PAGE_SIZE = 30;

export default function CharactersPage({ params }) {
    const { projectId } = React.use(params)
    const setSelectedProjectId = useGenerationsStore(s => s.setSelectedProjectId);
    const setActiveStudioTab = useGenerationsStore(s => s.setActiveStudioTab);
    const setIsNavbarHidden = useGenerationsStore(s => s.setIsNavbarHidden);

    // Setup active project state without re-render cascades
    React.useEffect(() => {
        if (projectId && useGenerationsStore.getState().selectedProjectId !== projectId) {
            setSelectedProjectId(projectId);
        }
        if (useGenerationsStore.getState().activeStudioTab !== "characters") {
            setActiveStudioTab("characters");
        }
    }, [projectId, setSelectedProjectId, setActiveStudioTab])

    const gridSize = useGenerationsStore(s => s.gridSize);
    
    const isDragging = usePromptStore(s => s.isDraggingGalleryItem);
    const router = useRouter();
    
    // Natively fetch character sheet workflows via unified selector
    const { workflows: existingSheets, totalCharacters, isLoading } = useCharacterWorkflows(projectId)

    // Redirect to /characters/new if project has 0 characters total
    React.useEffect(() => {
        if (!isLoading && totalCharacters === 0 && projectId) {
            router.replace(`/cinema-studio/${projectId}/characters/new`);
        }
    }, [isLoading, totalCharacters, projectId, router]);

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

    // Navigate to the Edit Page for this character workflow
    const handleWorkflowClick = React.useCallback((workflow) => {
        const workflowId = workflow?.id || workflow?.name;
        if (!workflowId || !projectId) return;
        router.push(`/cinema-studio/${projectId}/characters/${workflowId}`);
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
    }, [hasMore, loadMore, visibleSheets.length]);

    if (isLoading || existingSheets.length === 0) {
        return <LoadingScreen message="Loading characters..." />
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
                    data-scroll-container="true"
                    className="flex-1 overflow-y-auto pt-[72px] overflow-x-hidden px-3 custom-scrollbar w-full"
                >
                    {visibleSheets.length === 0 ? (
                        <div className="w-full flex flex-col items-center justify-center py-28 text-center">
                            <p className="text-[18px] text-white/35 font-normal tracking-wide">
                                No characters yet
                            </p>
                            <p className="text-[13px] text-white/20 mt-1">
                                Click &quot;New character&quot; below to create your first character.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 w-full pb-32">
                            <SharedGalleryGrid
                                workflows={visibleSheets}
                                gridSize={gridSize}
                                projectId={projectId}
                                CardComponent={MediaGridItem}
                                onWorkflowClick={handleWorkflowClick}
                                itemClassName="rounded-xl border-none shadow-xl"
                            />
                            {hasMore && (
                                <div className="flex justify-center pt-2 text-sm text-white/45">
                                    Scroll down to load more
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Floating Action Button (New Character) */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40">
                    <Button
                        type="button"
                        onClick={() => router.push(`/cinema-studio/${projectId}/characters/new`)}
                        className="flex items-center gap-2 px-6 py-4 h-auto rounded-[24px] bg-[#4a4a4a] hover:bg-[#5a5a5a] text-[#d1d1d1] hover:text-white shadow-2xl shadow-black/50 transition-all active:scale-95 border border-white/5 backdrop-blur-md cursor-pointer"
                    >
                        <Plus className="size-5" />
                        <span className="font-medium text-[15px]">New character</span>
                    </Button>
                </div>

                <HowToDrawer
                    isOpen={isHowToOpen}
                    onClose={() => setIsHowToOpen(false)}
                />

                <ConfirmDeleteDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    title="Delete Character?"
                    description="This action will permanently delete this character reference sheet."
                    onConfirm={() => confirmDelete(projectId)}
                    isDeleting={isDeleting}
                />
            </main>
        </div>
    )
}
