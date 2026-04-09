"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Share2, MoreVertical, LayoutGrid, Layers, Trash2, Heart } from "lucide-react"
import { useWorkflowsStore } from "@/features/workflows"
import { useFilteredWorkflows } from "@/features/workflows/model/useFilteredWorkflows"
import { WorkflowMediaPreview } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem/WorkflowMediaPreview"
import { WorkflowMediaGallery } from "@/features/workflows/ui/WorkflowMediaGallery"
import { EditNavbar } from "@/widgets/EditNavbar/EditNavbar"
import { EditPromptBarImage } from "@/features/prompt-bar/ui/edit/EditPromptBarImage"
import { EditPromptBarVideo } from "@/features/prompt-bar/ui/edit/EditPromptBarVideo"
import { useEditStore } from "@/features/prompt-bar/model/useEditStore"
import { cn } from "@/shared/lib/utils"
import { getPrimaryMedia, getItemMetadata } from "@/shared/lib/generationUtils"
import { Button } from "@/shared/ui/button"
import { useSetPrimaryMedia } from "@/features/workflows/api/workflowsApi"

/**
 * Workflow Edit Page
 * Displays a preview of the workflow media and its metadata.
 */
export default function WorkflowEditPage() {
    const { projectId, workflowId } = useParams()
    const router = useRouter()
    
    const { activeSessionId } = useWorkflowsStore()
    const setEditTarget = useEditStore((s) => s.setEditTarget)
    const resetEditStore = useEditStore((s) => s.resetEditStore)
    const setPrimaryMediaMutation = useSetPrimaryMedia()
    
    // Use the existing hook to find the workflow in the cache
    const { data: fetchResult } = useFilteredWorkflows(projectId, activeSessionId)
    
    const workflows = fetchResult?.filteredWorkflows || []
    const workflow = workflows.find(w => (w.id || w.name) === workflowId)

    const [activeItem, setActiveItem] = React.useState(null)
    const [showHistory, setShowHistory] = React.useState(true)

    // Determine if the active item is a video
    const activeItemMeta = activeItem ? getItemMetadata(activeItem) : null
    const isVideoItem = activeItemMeta?.isVideo ?? false

    // Sync activeItem and edit store when workflow is loaded or active item changes
    React.useEffect(() => {
        if (workflow) {
            const currentItem = activeItem || getPrimaryMedia(workflow);
            if (!activeItem) setActiveItem(currentItem);

            // Set edit target in the independent edit store
            const meta = getItemMetadata(currentItem);
            const primaryMedia = getPrimaryMedia(workflow);
            const primaryMeta = getItemMetadata(primaryMedia);
            
            setEditTarget({
                project_id: projectId,
                session_id: activeSessionId,
                workflow_id: workflow.id || workflow.name,
                media_id: currentItem?.id || currentItem?.name,
                media_status: meta.status,
                primaryMediaId: workflow.metadata?.primaryMediaId,
                primaryMediaUrl: primaryMeta.url,
                url: meta.url,
                ratio: currentItem?.params?.ratio || meta.ratioStr,
                quality: currentItem?.params?.quality || "standard",
                prompt: currentItem?.params?.prompt || "",
                isVideo: isVideoItem,
            });
        }

        // Cleanup: clear edit store when leaving the page
        return () => {
            resetEditStore();
        };
    }, [workflow, activeItem, setEditTarget, resetEditStore]);

    if (!workflow) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#050505]">
                <div className="animate-pulse text-white/20">Loading workflow...</div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full w-full bg-[#050505] text-white overflow-hidden">
            <EditNavbar 
                workflow={workflow} 
                showHistory={showHistory} 
                onToggleHistory={() => setShowHistory(!showHistory)} 
            />
            
            <div className="flex-1 flex flex-col overflow-hidden p-4 pt-20">
                {/* ── Main Content Area ── */}
                <main className="flex-1 flex overflow-hidden relative rounded-2xl border border-white/5 bg-black/20">
                    
                    {/* Left Side - Preview (Flexible Width) */}
                    <div className="flex-1 flex flex-col gap-6 relative h-full">
                       
                                <WorkflowMediaPreview 
                                    workflow={workflow} 
                                    className="max-w-fit-content"
                                    externalActiveItem={activeItem}
                                    onActiveItemChange={setActiveItem}
                                    projectId={projectId}
                                    sessionId={activeSessionId}
                                />
                   

                        {/* Floating Edit Prompt Bar — image or video */}
                        <div className="bottom-8 inset-x-0 z-30 flex justify-center px-6 pointer-events-none">
                            <div className="w-full max-w-[600px] pointer-events-auto">
                                {isVideoItem ? (
                                    <EditPromptBarVideo />
                                ) : (
                                    <EditPromptBarImage />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Gallery Sidebar */}
                    {showHistory && (
                        <aside className="w-[300px] shrink-0 border-l border-white/5 flex flex-col overflow-hidden">
                            <WorkflowMediaGallery 
                                items={workflow.items}
                                activeItem={activeItem}
                                primaryMediaId={workflow.metadata?.primaryMediaId}
                                projectId={projectId}
                                sessionId={activeSessionId}
                                blockSelectWhenNotCompleted
                                onSelect={(item) => {
                                    // Security/UX guard: don't allow setting primary media
                                    // to an item that isn't fully generated yet.
                                    const meta = getItemMetadata(item);
                                    if (meta?.status !== "completed" || !meta?.url) return;

                                    setActiveItem(item);
                                    const mediaId = item?.id || item?.name;
                                    const workflowId = workflow.id || workflow.name;
                                    if (mediaId && workflowId) {
                                        setPrimaryMediaMutation.mutate({
                                            workflowId,
                                            mediaId,
                                            projectId,
                                            sessionId: activeSessionId,
                                        });
                                    }
                                }}
                                className="bg-transparent border-none rounded-none shadow-none max-h-none w-full"
                            />
                        </aside>
                    )}

                </main>
            </div>
        </div>
    )
}
