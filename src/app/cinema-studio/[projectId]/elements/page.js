"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"

import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { useElementSheetWorkflows } from "@/features/elements"
import { Plus } from "lucide-react"

import { Button } from "@/shared/ui/button";
import { usePromptStore } from "@/features/studio";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";
import { getPrimaryMedia } from "@/shared/lib/generationUtils";
import { getItemMetadata as getDisplayMeta, getStudioGridDensity } from "@/shared/lib/displayUtils";

import { RowsPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/rows.css';
import { MediaGridItem } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem";
import { HowToDrawer } from "@/components/cinema-studio/elements/HowToDrawer";
import { useWorkflowDelete } from "@/features/workflows";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";
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

    const gridSize          = useGenerationsStore(s => s.gridSize);
    
    const isDragging = usePromptStore(s => s.isDraggingGalleryItem);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isNewElementOpen, setIsNewElementOpen] = React.useState(false);
    
    // Natively fetch element sheet workflows
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

    const photos = React.useMemo(() => {
        return visibleSheets.reduce((acc, workflow, i) => {
            const primaryItem = getPrimaryMedia(workflow);
            if (!primaryItem) return acc;

            const meta = getDisplayMeta(primaryItem, workflow);
            const aspect = meta?.aspect ?? "1/1";
            const [wStr, hStr] = aspect.split("/");
            const wNum = parseFloat(wStr) || 1;
            const hNum = parseFloat(hStr) || 1;
            const BASE = 1200;
            const width  = Math.round(BASE * (wNum / Math.max(wNum, hNum)));
            const height = Math.round(BASE * (hNum / Math.max(wNum, hNum)));

            const url = meta?.url || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

            acc.push({
                src:      url,
                width,
                height,
                key:      workflow.id || workflow.name || String(i),
                workflow,
            });
            return acc;
        }, []);
    }, [visibleSheets]);

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

    // Density configuration driven by studio gridSize
    const density = getStudioGridDensity(gridSize);

    const renderPhoto = React.useCallback(
        (_, { photo, width, height }) => (
            <MediaGridItem
                key={photo.key}
                workflow={photo.workflow}
                onClick={handleWorkflowClick}
                className="rounded-xl border-none shadow-xl"
                width={width}
                height={height}
            />
        ),
        [handleWorkflowClick]
    );

    const albumRender = React.useMemo(() => ({
        photo: renderPhoto,
    }), [renderPhoto]);

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
                    className="flex-1 overflow-y-auto pt-[72px] overflow-x-hidden px-3 custom-scrollbar w-full"
                >
                    {/* ── Elements Grid (Full Width 100%) ── */}
                    {visibleSheets.length === 0 ? (
                        <div className="w-full flex flex-col items-center justify-center py-28 text-center col-span-full">
                            <p className="text-[18px] text-white/35 font-normal tracking-wide">
                                No elements yet
                            </p>
                            <p className="text-[13px] text-white/20 mt-1">
                                Click &quot;New element&quot; below to create your first element.
                            </p>
                            <Button
                                type="button"
                                variant="studio-white"
                                onClick={() => setIsNewElementOpen(true)}
                                className="mt-4 rounded-full px-5 py-2.5 font-medium text-sm flex items-center gap-2 border-none"
                            >
                                <Plus className="size-4" />
                                <span>Create element</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 w-full pb-32">
                            <RowsPhotoAlbum
                                photos={photos}
                                targetRowHeight={density.targetRowHeight}
                                spacing={density.spacing}
                                rowConstraints={{ singleRowMaxHeight: density.targetRowHeight * density.maxRowHeightMultiplier }}
                                render={albumRender}
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
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40">
                    <Button
                        type="button"
                        variant="create-element"
                        size="fab"
                        onClick={() => setIsNewElementOpen(true)}
                    >
                        <Plus className="size-5" />
                        <span>New element</span>
                    </Button>
                </div>

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
