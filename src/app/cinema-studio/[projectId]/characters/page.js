"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { useCharacterWorkflows } from "@/features/workflows/api/workflowsApi"
import { ArrowUp } from "lucide-react"
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore"
import { getPrimaryMedia } from "@/shared/lib/generationUtils"
import { getItemMetadata as getDisplayMeta } from "@/shared/lib/displayUtils"
import { LoadingScreen } from "@/shared/ui/LoadingScreen"

import { CharacterCardKrea } from "@/components/cinema-studio/characters/CharacterCardKrea"
import { NewElementCardKrea } from "@/components/cinema-studio/elements/NewElementCardKrea"
import { ElementsKreaHero } from "@/components/cinema-studio/elements/ElementsKreaHero"
import { HowToDrawer } from "@/components/cinema-studio/elements/HowToDrawer"
import { useWorkflowDelete } from "@/features/workflows"
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog"

const PAGE_SIZE = 30;

export default function CharactersPage({ params }) {
    const { projectId } = React.use(params)
    const { setSelectedProjectId, setActiveStudioTab } = useGenerationsStore()

    // Setup active project state
    React.useEffect(() => {
        if (projectId) setSelectedProjectId(projectId)
        setActiveStudioTab("characters")
    }, [projectId, setSelectedProjectId, setActiveStudioTab])

    const gridSize = useGenerationsStore(s => s.gridSize);
    const setIsNavbarHidden = useGenerationsStore(s => s.setIsNavbarHidden);
    const [isGridResizing, setIsGridResizing] = React.useState(false);
    
    const isDragging = usePromptStore(s => s.isDraggingGalleryItem);
    const router = useRouter();
    
    // Natively fetch character sheet workflows
    const { workflows: existingSheets, isLoading } = useCharacterWorkflows(projectId)
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
    const { isDeleteDialogOpen, setIsDeleteDialogOpen, promptDelete, confirmDelete, isDeleting } = useWorkflowDelete();

    // Navigate to the Edit Page for this character workflow
    const handleWorkflowClick = (workflow) => {
        const workflowId = workflow.id || workflow.name;
        if (!workflowId || !projectId) return;
        router.push(`/cinema-studio/${projectId}/characters/${workflowId}`);
    };

    const scrollRef = React.useRef(null);
    const prevScrollTop = React.useRef(0);
    const rafRef = React.useRef(null);
    const [showTopBtn, setShowTopBtn] = React.useState(false);

    const loadMore = React.useCallback(() => {
        setVisibleCount((current) => Math.min(current + PAGE_SIZE, existingSheets.length));
    }, [existingSheets.length]);

    React.useEffect(() => {
        setVisibleCount(PAGE_SIZE);
        prevScrollTop.current = 0;
    }, [projectId, sheetsListKey]);

    const handleScroll = React.useCallback(() => {
        if (rafRef.current) return; 

        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            if (!scrollRef.current) return;

            const currentScrollTop = scrollRef.current.scrollTop;

            setShowTopBtn(currentScrollTop > 400);

            const isCurrentlyHidden = useGenerationsStore.getState().isNavbarHidden;
            if (currentScrollTop > prevScrollTop.current && currentScrollTop > 80) {
                if (!isCurrentlyHidden) setIsNavbarHidden(true);
            } else if (currentScrollTop < prevScrollTop.current) {
                if (isCurrentlyHidden) setIsNavbarHidden(false);
            }

            const remainingScroll =
                scrollRef.current.scrollHeight - (currentScrollTop + scrollRef.current.clientHeight);
            if (remainingScroll <= 240 && hasMore) {
                loadMore();
            }

            prevScrollTop.current = currentScrollTop;
        });
    }, [hasMore, loadMore, setIsNavbarHidden]);

    React.useEffect(() => {
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    React.useEffect(() => {
        const el = scrollRef.current;
        if (!el || !hasMore) return;

        if (el.scrollHeight <= el.clientHeight + 120) {
            loadMore();
        }
    }, [hasMore, loadMore, visibleSheets.length]);

    const scrollToTop = React.useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;

        const start     = el.scrollTop;
        const startTime = performance.now();
        const duration  = 600; 

        const ease = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const animate = (now) => {
            const elapsed  = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            el.scrollTop   = start * (1 - ease(progress));
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, []);

    if (isLoading) {
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
                    className="flex-1 overflow-y-auto pt-[80px] overflow-x-hidden px-4 py-6 custom-scrollbar w-full"
                >
                    {/* ── Krea Characters Hero Banner ── */}
                    <ElementsKreaHero
                        projectName="Characters"
                        description="Create and save 3-view character references for consistent video generation across all your scenes."
                        createLabel="Create new character"
                        onOpenCreateModal={() => router.push(`/cinema-studio/${projectId}/characters/new`)}
                    />

                    {/* ── Characters Grid (Full Width 100%) ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-32 w-full pt-4">
                        {/* Always show + New Character Card */}
                        <NewElementCardKrea
                            onClick={() => router.push(`/cinema-studio/${projectId}/characters/new`)}
                            label="New Character"
                        />

                        {visibleSheets.map((workflow) => (
                            <CharacterCardKrea
                                key={workflow.id || workflow.name}
                                character={workflow}
                                onClick={handleWorkflowClick}
                                onDelete={(char) => promptDelete(char)}
                            />
                        ))}
                    </div>
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

                <AnimatePresence>
                    {showTopBtn && (
                        <motion.button
                            initial={{ opacity: 0, y: 30, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            onClick={scrollToTop}
                            className="absolute bottom-10 right-10 z-50 p-3 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 text-white backdrop-blur-xl shadow-2xl transition-all cursor-pointer"
                        >
                            <ArrowUp className="w-5 h-5" />
                        </motion.button>
                    )}
                </AnimatePresence>

                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 14px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background-color: rgba(255, 255, 255, 0.2);
                        border-radius: 20px;
                        border: 4px solid transparent;
                        background-clip: padding-box;
                        transition: background 0.2s ease;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background-color: rgba(255, 255, 255, 0.35);
                    }
                    .custom-scrollbar {
                        -ms-overflow-style: auto;
                        scrollbar-width: thin;
                        scrollbar-color: rgba(255, 255, 255, 0.2) transparent;

                        scroll-behavior: smooth;
                        -webkit-overflow-scrolling: touch;
                        overscroll-behavior-y: contain;
                        will-change: scroll-position;
                    }
                `}</style>
            </main>
        </div>
    )
}
