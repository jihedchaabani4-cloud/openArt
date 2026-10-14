"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkflowsStore } from "@/features/workflows";
import { useProjectData, useSetPrimaryMedia } from "@/features/workflows/api/workflowsApi";
import { EditMediaView } from "@/widgets/EditMediaView";
import { WorkflowMediaGallery } from "@/features/workflows/ui/WorkflowMediaGallery";
import { EditNavbar } from "@/widgets/EditNavbar/EditNavbar";
import { useElementStore } from "@/features/prompt-bar/model/useElementStore";
import { usePromptStore } from "@/features/prompt-bar/model/usePromptStore";
import { buildElementSheetDraft } from "@/features/workflows/model/elementSheetConfig";
import { getPrimaryMedia, getItemMetadata } from "@/shared/lib/generationUtils";
import { LoadingScreen } from "@/shared/ui/LoadingScreen";

export default function ElementWorkflowEditPage() {
    const { projectId, workflowId } = useParams();
    const router = useRouter();

    const hydrateElementDraft = useElementStore((state) => state.hydrateElementDraft);
    const resetElementStore = useElementStore((state) => state.resetElementStore);
    const setGenerationMode = usePromptStore((state) => state.setGenerationMode);
    const setModelId = usePromptStore((state) => state.setModelId);
    const setRatio = usePromptStore((state) => state.setRatio);
    const setQuality = usePromptStore((state) => state.setQuality);
    const setVideoResolution = usePromptStore((state) => state.setVideoResolution);
    const setPrimaryMediaMutation = useSetPrimaryMedia();

    const { data: projectData, isLoading } = useProjectData(projectId);
    const workflow = React.useMemo(() => {
        const rawWorkflows = projectData?.projectContents?.workflows ?? [];
        const rawMedia = projectData?.projectContents?.media ?? [];
        const foundWorkflow = rawWorkflows.find((item) => (item.id || item.name) === workflowId);
        if (!foundWorkflow) return null;

        const items = rawMedia
            .filter((item) => item.workflowId === foundWorkflow.name)
            .map((item) => ({
                ...item,
                asset_id: item.name || item.id,
                workflowStepId: item.workflowStepId || item.asset_type || "generation",
            }));

        return {
            ...foundWorkflow,
            id: foundWorkflow.name,
            items,
        };
    }, [projectData, workflowId]);

    // Redirect back if workflow not found after loading
    React.useEffect(() => {
        if (!isLoading && !workflow && projectData) {
            router.replace(`/cinema-studio/${projectId}/elements`);
        }
    }, [isLoading, workflow, projectData, router, projectId]);

    const [activeItem, setActiveItem] = React.useState(null);
    const [showHistory, setShowHistory] = React.useState(true);

    React.useEffect(() => {
        if (!workflow) return undefined;

        const currentItem = activeItem || getPrimaryMedia(workflow);
        if (!currentItem) return undefined;
        if (!activeItem) setActiveItem(currentItem);

        const draft = buildElementSheetDraft(workflow, currentItem);

        if (draft) {
            hydrateElementDraft({
                mode: draft.mode,
                prompt: "",
                references: draft.references,
                features: draft.features,
            });

            setGenerationMode(draft.isVideo ? "video" : "image");
            if (draft.promptConfig.model) setModelId(draft.promptConfig.model);
            if (draft.promptConfig.ratio) setRatio(draft.promptConfig.ratio);
            if (draft.promptConfig.quality) setQuality(draft.promptConfig.quality);
            if (draft.promptConfig.videoResolution) setVideoResolution(draft.promptConfig.videoResolution);
        } else {
            resetElementStore();
        }

        return () => {
            resetElementStore();
        };
    }, [
        workflow,
        activeItem,
        hydrateElementDraft,
        projectId,
        resetElementStore,
        setGenerationMode,
        setModelId,
        setQuality,
        setRatio,
        setVideoResolution,
    ]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!workflow) return null; // Let redirect handle it

    return (
        <div className="flex flex-col h-full w-full bg-black text-white overflow-hidden">
            <EditNavbar
                workflow={workflow}
                showHistory={showHistory}
                onToggleHistory={() => setShowHistory(!showHistory)}
                fallbackBackUrl={`/cinema-studio/${projectId}/elements`}
                fallbackBackLabel="Back to elements"
            />

            <div className="flex-1 flex flex-col overflow-hidden p-4 pt-20">
                <main className="flex-1 flex overflow-hidden relative">
                    <div className="flex-1 flex items-center justify-center relative h-full overflow-hidden">
                        <EditMediaView
                            workflow={workflow}
                            item={activeItem}
                        />
                    </div>

                    {showHistory && (
                        <aside className="w-[300px] shrink-0 border-l border-white/5 flex flex-col overflow-hidden">
                            <WorkflowMediaGallery
                                items={workflow.items}
                                activeItem={activeItem}
                                primaryMediaId={workflow.metadata?.primaryMediaId}
                                projectId={projectId}
                                onSelect={(item) => {
                                    const meta = getItemMetadata(item, workflow);
                                    if (!meta?.url && meta?.status !== "processing") return;

                                    setActiveItem(item);
                                    const mediaId = item?.id || item?.name;
                                    const currentWorkflowId = workflow.id || workflow.name;
                                    if (mediaId && currentWorkflowId) {
                                        setPrimaryMediaMutation.mutate({
                                            workflowId: currentWorkflowId,
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
    );
}
