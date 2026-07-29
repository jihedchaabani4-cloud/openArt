import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePromptBar } from "./usePromptBar";
import { useElementStore } from "./useElementStore";
import { usePromptStore } from "./usePromptStore";
import { extractFeaturesFromPrompt } from "./feature-constants";
import { useCreateCharacterMutation } from "@/features/workflows/api/workflowsApi";
import { useWorkflowsStore } from "@/features/workflows";
import { buildReferencesPayload } from "@/shared/lib/referenceUtils";
import { useRouter, useParams } from "next/navigation";
import { queryKeys } from "@/shared/api/queryKeys";

/**
 * Dedicated Character Prompt Bar Hook
 * Handles prompt state, traits, reference images, and API submission for Character creation.
 */
export function useCharacterPrompt() {
    const router = useRouter();
    const params = useParams();
    const s = usePromptBar({ isNewProject: false });
    const [variationsOpen, setVariationsOpen] = React.useState(false);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [internalMode, setInternalMode] = React.useState("image");
    const [targetRole, setTargetRole] = React.useState("normal");
    const [mentionCallback, setMentionCallback] = React.useState(null);
    const queryClient = useQueryClient();

    const { selectedProjectId: storeProjectId } = useWorkflowsStore();
    const projectId = params?.projectId || storeProjectId;
    const { mutateAsync: runCreateCharacter, isPending: creatingCharacter } = useCreateCharacterMutation();

    const {
        prompts,
        setPrompt,
        setElementMode,
        references,
        addReference,
        removeReference,
        clearReferences,
        features,
        updateFeature,
        toggleTagInPrompt,
        toggleMediaTag,
        clearFeatures,
    } = useElementStore();

    React.useEffect(() => {
        setElementMode("character");
    }, [setElementMode]);

    const isDraggingGalleryItem = usePromptStore((state) => state.isDraggingGalleryItem);
    const draggedItem = usePromptStore((state) => state.draggedItem);

    const prompt = prompts["character"] || "";
    const referenceImages = references["character"] || [];
    const maxRefs = 4;

    const normalizedFeatures = React.useMemo(() => extractFeaturesFromPrompt(prompt), [prompt]);
    const hasPromptFeatures = React.useMemo(() => {
        const sections = [normalizedFeatures.identity, normalizedFeatures.head, normalizedFeatures.details];
        if (normalizedFeatures.era || normalizedFeatures.renderingStyle || normalizedFeatures.outfit) {
            return true;
        }
        return sections.some((section) => Object.values(section || {}).some(Boolean));
    }, [normalizedFeatures]);

    const placeholder = "Describe your character (e.g. A cybernetic ronin with white hair and neon mask)...";

    const handleGalleryDrop = (role) => {
        if (!draggedItem) return;
        addReference(draggedItem, role, maxRefs);
        usePromptStore.getState().setIsDraggingGalleryItem(false);
        usePromptStore.getState().setDraggedItem(null);
    };

    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        if (!prompt.trim() || creatingCharacter || s.generating) return;

        const payload = {
            type: "character",
            prompt,
            features: hasPromptFeatures ? normalizedFeatures : features,
            references: buildReferencesPayload(referenceImages),
            project_id: projectId,
        };

        try {
            const res = await runCreateCharacter(payload);
            if (projectId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
                queryClient.refetchQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
            }
            setPrompt("");
            clearReferences();
            clearFeatures();
            if (projectId) {
                router.push(`/cinema-studio/${projectId}/characters`);
            }
        } catch (err) {
            console.error("Failed to create character sheet:", err);
        }
    };

    return {
        ...s,
        variationsOpen,
        setVariationsOpen,
        toggleVariations: () => setVariationsOpen((prev) => !prev),
        dialogOpen,
        setDialogOpen,
        prompt,
        setPrompt,
        placeholder,
        referenceImages,
        isDraggingGalleryItem,
        draggedItem,
        handleGalleryDrop,
        internalMode,
        handleGenerate,
        maxRefs,
        features: normalizedFeatures,
        rawFeatures: features,
        updateFeature,
        toggleTagInPrompt,
        toggleMediaTag,
        generating: creatingCharacter || s.generating,
    };
}
