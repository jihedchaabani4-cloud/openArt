"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useWorkflowsStore } from "@/features/workflows"
import { useFilteredWorkflows } from "@/features/workflows/model/useFilteredWorkflows"
import { MediaGridItem } from "@/widgets/StudioLayout/GenerationsStudio/MediaGridItem"
import { WorkflowMediaGallery } from "@/features/workflows/ui/WorkflowMediaGallery"
import { EditNavbar } from "@/widgets/EditNavbar/EditNavbar"
import { getPrimaryMedia, getItemMetadata } from "@/shared/lib/generationUtils"
import { useSetPrimaryMedia } from "@/features/workflows/api/workflowsApi"
import { LoadingScreen } from "@/shared/ui/LoadingScreen"

/**
 * Workflow Edit Page
 * Displays a preview of the workflow media and its metadata.
 */
export default function WorkflowEditPage() {
    const { projectId, workflowId } = useParams()
    const router = useRouter()
    
    const { activeSessionId } = useWorkflowsStore()
    const setPrimaryMediaMutation = useSetPrimaryMedia()
    
    // Use the existing hook to find the workflow in the cache
    const { data: fetchResult, isLoading } = useFilteredWorkflows(projectId, activeSessionId)
    
    const workflows = fetchResult?.filteredWorkflows || []
    const workflow = workflows.find(w => (w.id || w.name) === workflowId)

    // Redirect back to project if workflow is not found after loading
    React.useEffect(() => {
        if (!isLoading && !workflow && workflows.length > 0) {
            router.replace(`/cinema-studio/${projectId}/generations`);
        }
    }, [isLoading, workflow, workflows.length, router, projectId]);

    const [activeItem, setActiveItem] = React.useState(null)
    const [showHistory, setShowHistory] = React.useState(true)


    // Sync activeItem when workflow is loaded
    React.useEffect(() => {
        if (workflow) {
            const currentItem = activeItem || getPrimaryMedia(workflow);
            if (!activeItem) setActiveItem(currentItem);
        }
    }, [workflow, activeItem]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!workflow) return null; // Let the redirect handle it

    return (
        <div className="flex flex-col h-full w-full text-white overflow-hidden bg-background" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, #111116 0%, #000000 70%)" }}>
            <EditNavbar 
                workflow={workflow} 
                activeItem={activeItem}
                showHistory={showHistory} 
                onToggleHistory={() => setShowHistory(!showHistory)} 
            />
            
            <div className="flex-1 flex flex-col overflow-hidden p-4 pt-20">
                {/* ── Main Content Area ── */}
                <main className="flex-1 flex overflow-hidden relative">
                    
                    {/* Left Side - Preview (Flexible Width) */}
                    {/* Left Side - Preview (Flexible Width) */}
                    <div className="flex-1 relative overflow-hidden flex items-center justify-center p-6 h-full">
                        <div
                            className="relative max-h-full max-w-full flex items-center justify-center"
                            style={{
                                aspectRatio: getItemMetadata(activeItem || getPrimaryMedia(workflow))?.aspect || "1/1",
                                height: "100%",
                                maxHeight: "100%",
                            }}
                        >
                            <MediaGridItem
                                workflow={workflow}
                                item={activeItem}
                                aspect={getItemMetadata(activeItem || getPrimaryMedia(workflow))?.aspect || "1/1"}
                                className="w-full h-full rounded-2xl shadow-2xl border border-white/10"
                            />
                        </div>
                    </div>

                    {/* Right Side - Gallery Sidebar */}
                    {showHistory && (
                        <aside className="w-[300px] shrink-0  flex flex-col overflow-hidden">
                            <WorkflowMediaGallery 
                                items={workflow.items}
                                activeItem={activeItem}
                                primaryMediaId={workflow.metadata?.primaryMediaId}
                                projectId={projectId}
                                sessionId={activeSessionId}
                                onSelect={(item) => {
                                    // Allow switching even if processing
                                    const meta = getItemMetadata(item);
                                    if (!meta?.url && meta?.status !== "processing") return;

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
