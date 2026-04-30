import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePromptBar } from "./usePromptBar";
import { useElementStore } from "./useElementStore";
import { usePromptStore } from "./usePromptStore";
import { extractFeaturesFromPrompt } from "./feature-constants";
import { useCreateElementSheetMutation } from "@/features/workflows/api/workflowsApi";
import { useWorkflowsStore } from "@/features/workflows";
import { getElementSheetConfig, isElementSheetMode } from "@/features/workflows/model/elementSheetConfig";
import { buildReferencesPayload } from "@/shared/lib/referenceUtils";
import { queryKeys } from "@/shared/api/queryKeys";

export function useElementPrompt() {
    const s = usePromptBar({ isNewProject: false });
    const [variationsOpen, setVariationsOpen] = React.useState(false);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [internalMode, setInternalMode] = React.useState("image");
    const [targetRole, setTargetRole] = React.useState("normal");
    const [mentionCallback, setMentionCallback] = React.useState(null);
    const queryClient = useQueryClient();

    const { selectedProjectId: projectId } = useWorkflowsStore();
    const { mutateAsync: runCreateElementSheet, isPending: creatingSheet } = useCreateElementSheetMutation();

    const {
        prompts,
        setPrompt,
        elementMode,
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

    const isDraggingGalleryItem = usePromptStore((state) => state.isDraggingGalleryItem);
    const draggedItem = usePromptStore((state) => state.draggedItem);

    const prompt = prompts[elementMode] || "";
    const referenceImages = references[elementMode] || [];
    const sheetConfig = React.useMemo(() => getElementSheetConfig(elementMode), [elementMode]);
    const fallbackSelectedModel = React.useMemo(() => ({
        key: sheetConfig.model || "elements_default",
        support: sheetConfig.support,
    }), [sheetConfig]);
    const maxRefs = isElementSheetMode(elementMode)
        ? sheetConfig.maxReferences
        : (s.selectedModel?.support?.references?.max ?? fallbackSelectedModel.support.references.max);
    const normalizedFeatures = React.useMemo(() => extractFeaturesFromPrompt(prompt), [prompt]);
    const hasPromptFeatures = React.useMemo(() => {
        const sections = [normalizedFeatures.identity, normalizedFeatures.head, normalizedFeatures.details];
        if (normalizedFeatures.era || normalizedFeatures.renderingStyle || normalizedFeatures.outfit) {
            return true;
        }
        return sections.some((section) => Object.values(section || {}).some(Boolean));
    }, [normalizedFeatures]);

    const placeholder = React.useMemo(() => {
        if (elementMode === "character") return "Describe your character...";
        if (elementMode === "location") return "Describe your location...";
        return "Describe your element...";
    }, [elementMode]);

    const dragError = React.useMemo(() => {
        if (!isDraggingGalleryItem || !draggedItem) return null;
        if (referenceImages.length >= maxRefs) {
            return `Reference limit reached (max ${maxRefs})`;
        }
        return null;
    }, [isDraggingGalleryItem, draggedItem, referenceImages.length, maxRefs]);

    const handleGalleryDrop = (role) => {
        if (!draggedItem || dragError) return;
        addReference(draggedItem, role, maxRefs);
        usePromptStore.getState().setIsDraggingGalleryItem(false);
        usePromptStore.getState().setDraggedItem(null);
    };

    const openDialog = (mode = "image", role = "normal", callback = null) => {
        setInternalMode(mode);
        setTargetRole(role);
        setMentionCallback(() => callback);
        setDialogOpen(true);
        s.handleOpenLibrary?.(mode);
    };

    const handleAddClick = () => {
        if (dialogOpen) {
            setDialogOpen(false);
            return;
        }
        openDialog("image", "normal");
    };

    const handleSelectMedia = (assets) => {
        const items = Array.isArray(assets) ? assets : [assets];
        items.forEach((asset) => addReference(asset, targetRole, maxRefs));
        if (mentionCallback) mentionCallback(items);
        setDialogOpen(false);
        setMentionCallback(null);
    };

    const resetCurrentDraft = () => {
        setPrompt("");
        clearReferences();
        clearFeatures();
        if (s.textareaRef.current) {
            s.textareaRef.current.style.height = "auto";
        }
    };

    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        if (!prompt.trim() || creatingSheet || s.generating) return;

        if (isElementSheetMode(elementMode)) {
            const payload = {
                type: elementMode,
                prompt,
                features: elementMode === "character"
                    ? (hasPromptFeatures ? normalizedFeatures : features)
                    : {},
                references: buildReferencesPayload(referenceImages),
                project_id: projectId,
            };

            try {
                await runCreateElementSheet({ payload });
                if (projectId) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
                }
                resetCurrentDraft();
                return;
            } catch (err) {
                console.error(`Failed to create ${elementMode} sheet:`, err);
                return;
            }
        }

        return s.handleGenerate(e);
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
        elementMode,
        setElementMode,
        placeholder,
        referenceImages,
        selectedModel: isElementSheetMode(elementMode) ? fallbackSelectedModel : (s.selectedModel || fallbackSelectedModel),
        isDraggingGalleryItem,
        draggedItem,
        dragError,
        handleGalleryDrop,
        internalMode,
        handleAddClick,
        handleSelectMedia,
        openDialog,
        generating: creatingSheet || s.generating,
        handleAddReference: (asset, role = "normal") => {
            if (!asset?.url) return;
            return addReference(asset, role, maxRefs);
        },
        handleRemoveReference: (assetId) => {
            removeReference(assetId);
        },
        handleClearReferences: clearReferences,
        handleReset: resetCurrentDraft,
        handleGenerate,
        maxRefs,
        features: normalizedFeatures,
        rawFeatures: features,
        updateFeature,
        toggleTagInPrompt,
        toggleMediaTag,
    };
}
