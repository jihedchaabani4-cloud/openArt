"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"
import { useCharacterWorkflows } from "@/features/characters"
import { Plus } from "lucide-react"
import { usePromptStore } from "@/features/studio";
import { getPrimaryMedia } from "@/shared/lib/generationUtils"
import { getItemMetadata as getDisplayMeta, getStudioGridDensity, getCachedImageDimensions, setCachedImageDimensions } from "@/shared/lib/displayUtils"
import { LoadingScreen } from "@/shared/ui/LoadingScreen"

import { RowsPhotoAlbum } from 'react-photo-album'
import 'react-photo-album/rows.css'
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
    const density  = getStudioGridDensity(gridSize);
    
    const isDragging = usePromptStore(s => s.isDraggingGalleryItem);
    const router = useRouter();
    
    // Natively fetch character sheet workflows
    const { workflows: existingSheets, isLoading } = useCharacterWorkflows(projectId)

    // Redirect to /characters/new if project has 0 characters
    React.useEffect(() => {
        if (!isLoading && existingSheets.length === 0 && projectId) {
            router.replace(`/cinema-studio/${projectId}/characters/new`);
        }
    }, [isLoading, existingSheets.length, projectId, router]);

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

    const [dimensionsVersion, setDimensionsVersion] = React.useState(0);

    // Probe and cache authentic natural dimensions for character images
    React.useEffect(() => {
        visibleSheets.forEach((workflow) => {
            const primaryItem = getPrimaryMedia(workflow);
            if (!primaryItem) return;
            const meta = getDisplayMeta(primaryItem, workflow);
            const url = meta?.url || primaryItem?.url || primaryItem?.file_url;
            if (!url || url.startsWith("data:image/gif")) return;

            if (getCachedImageDimensions(url)) return;

            const img = new window.Image();
            img.onload = () => {
                if (img.naturalWidth && img.naturalHeight) {
                    setCachedImageDimensions(url, img.naturalWidth, img.naturalHeight);
                    setDimensionsVersion((v) => v + 1);
                }
            };
            img.src = url;
            if (img.complete && img.naturalWidth && img.naturalHeight) {
                setCachedImageDimensions(url, img.naturalWidth, img.naturalHeight);
            }
        });
    }, [visibleSheets]);

    const photos = React.useMemo(() => {
        void dimensionsVersion;
        return visibleSheets.reduce((acc, workflow, i) => {
            const primaryItem = getPrimaryMedia(workflow);
            if (!primaryItem) return acc;

            const meta = getDisplayMeta(primaryItem, workflow);
            const url = meta?.url || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

            // 1. Highest priority: verified authentic image dimensions
            let natural = getCachedImageDimensions(url);

            let aspect = natural?.aspect;
            let wNum = natural?.width;
            let hNum = natural?.height;

            // 2. Second priority: If natural dimensions not yet available, use metadata aspect
            if (!wNum || !hNum) {
                const rawAspect = meta?.aspect;
                if (rawAspect && rawAspect !== "auto") {
                    const [wStr, hStr] = String(rawAspect).split("/");
                    const pw = parseFloat(wStr);
                    const ph = parseFloat(hStr);
                    if (pw && ph && !isNaN(pw) && !isNaN(ph)) {
                        wNum = pw;
                        hNum = ph;
                        aspect = rawAspect;
                    }
                }
            }

            // 3. Fallback: clean 1/1 square instead of forcing 16:9
            if (!wNum || !hNum || isNaN(wNum) || isNaN(hNum)) {
                wNum = 1;
                hNum = 1;
                aspect = "1/1";
            }

            const BASE = 1200;
            const width  = Math.round(BASE * (wNum / Math.max(wNum, hNum)));
            const height = Math.round(BASE * (hNum / Math.max(wNum, hNum)));

            acc.push({
                src:      url,
                width,
                height,
                aspect,
                key:      workflow.id || workflow.name || String(i),
                workflow,
            });
            return acc;
        }, []);
    }, [visibleSheets, dimensionsVersion]);

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

    const renderPhoto = React.useCallback(
        (_, { photo, width, height }) => (
            <MediaGridItem
                key={photo.key}
                workflow={photo.workflow}
                onClick={handleWorkflowClick}
                className="rounded-2xl border-none shadow-xl"
                width={width}
                height={height}
                aspect={photo.aspect}
            />
        ),
        [handleWorkflowClick]
    );

    const albumRender = React.useMemo(() => ({
        photo: renderPhoto,
    }), [renderPhoto]);

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
                    className="flex-1 overflow-y-auto pt-[72px] overflow-x-hidden px-3 py-3 custom-scrollbar w-full"
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
                        <div className="flex flex-col gap-6 w-full pb-32 pt-4">
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
