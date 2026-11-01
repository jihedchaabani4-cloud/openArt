"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useFilteredWorkflows } from "@/features/workflows/model/useFilteredWorkflows"
import { EditMediaView } from "@/widgets/EditMediaView"
import { WorkflowMediaGallery } from "@/features/workflows/ui/WorkflowMediaGallery"
import { EditNavbar } from "@/widgets/EditNavbar/EditNavbar"
import { getItemMetadata } from "@/shared/lib/generationUtils"
import { resolveMainMedia } from "@/features/workflows/core/resolveMediaRef"
import { useSetPrimaryMedia } from "@/features/workflows/api/workflowsApi"
import { LoadingScreen } from "@/shared/ui/LoadingScreen"

/**
 * Asset Edit Page
 * Displays a preview of the asset/workflow media and its metadata.
 */
export default function AssetEditPage() {
    const { projectId, workflowId } = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const queryCollectionId = searchParams?.get("collectionId") || searchParams?.get("folderId") || null
    
    const setPrimaryMediaMutation = useSetPrimaryMedia()
    
    // Find workflow in the project cache
    const { data: fetchResult, isLoading } = useFilteredWorkflows(projectId)
    
    const workflows = fetchResult?.filteredWorkflows || []
    const workflow = workflows.find(w => (w.id || w.name) === workflowId)

    // Redirect back to collection or assets if workflow is not found after loading
    React.useEffect(() => {
        if (!isLoading && !workflow && workflows.length > 0) {
            const fallback = queryCollectionId
                ? `/cinema-studio/${projectId}/collection/${queryCollectionId}`
                : `/cinema-studio/${projectId}/assets`;
            router.replace(fallback);
        }
    }, [isLoading, workflow, workflows.length, router, projectId, queryCollectionId]);

    const [activeItem, setActiveItem] = React.useState(null)
    const [showHistory, setShowHistory] = React.useState(true)

    // Sync activeItem when workflow is loaded
    React.useEffect(() => {
        if (workflow) {
            const resolved = resolveMainMedia(workflow);
            const primaryItem = resolved
                ? (resolved.raw || resolved)
                : {
                    id: workflow.id || workflow.name,
                    status: workflow.status || "processing",
                    url: null,
                };
            const currentItem = activeItem || primaryItem;
            if (!activeItem) setActiveItem(currentItem);
        }
    }, [workflow, activeItem]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!workflow) return null; // Let the redirect handle it

    return (
        <div className="flex flex-col h-full w-full text-white overflow-hidden bg-black">
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
                    <div className="flex-1 flex items-center justify-center relative h-full overflow-hidden">
                        <EditMediaView
                            workflow={workflow}
                            item={activeItem}
                        />
                    </div>

                    {/* Right Side - Gallery Sidebar */}
                    {showHistory && (
                        <aside className="w-[300px] shrink-0 flex flex-col overflow-hidden">
                            <WorkflowMediaGallery 
                                items={workflow.items}
                                activeItem={activeItem}
                                primaryMediaId={workflow.metadata?.primaryMediaId}
                                projectId={projectId}
                                onSelect={(item) => {
                                    // Allow switching even if processing
                                    const meta = getItemMetadata(item, workflow);
                                    if (!meta?.url && meta?.status !== "processing") return;

                                    setActiveItem(item);
                                    const mediaId = item?.id || item?.name;
                                    const currentWfId = workflow.id || workflow.name;
                                    if (mediaId && currentWfId) {
                                        setPrimaryMediaMutation.mutate({
                                            workflowId: currentWfId,
                                            mediaId,
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
