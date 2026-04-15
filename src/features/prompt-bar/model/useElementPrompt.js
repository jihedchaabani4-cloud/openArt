import React from "react";
import { usePromptBar } from "./usePromptBar";
import { useElementStore } from "./useElementStore";
import { useCreateElementSheetMutation } from "@/features/workflows/api/workflowsApi";
import { useWorkflowsStore } from "@/features/workflows";
import { buildReferencesPayload } from "@/shared/lib/referenceUtils";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";

export function useElementPrompt() {
    const s = usePromptBar({ isNewProject: false });
    const [variationsOpen, setVariationsOpen] = React.useState(false);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [internalMode, setInternalMode] = React.useState('image');
    const [targetRole, setTargetRole] = React.useState('normal');
    const [mentionCallback, setMentionCallback] = React.useState(null);
    const queryClient = useQueryClient();

    const { selectedProjectId: projectId, activeSessionId } = useWorkflowsStore();
    
    // Element Sheet Mutation
    const { mutateAsync: runCreateElementSheet, isPending: creatingSheet } = useCreateElementSheetMutation();

    const maxRefs = 5;

    // Mock model to ensure Row1 and other components display correctly for elements
    const mockSelectedModel = {
        key: 'elements_default',
        support: {
            references: { max: maxRefs },
            quality: { items: ['2K'] },
            ratio: { items: ['1:1'] }
        }
    };

    const {
        prompts,
        setPrompt,
        elementMode,
        setElementMode,
        references,
        addReference,
        removeReference,
        clearReferences,
        isDraggingGalleryItem,
        draggedItem,
        setIsDraggingGalleryItem,
        setDraggedItem,
        features,
        updateFeature,
        toggleTagInPrompt,
        toggleMediaTag,
    } = useElementStore();

    // ─── Computed State by Mode ───────────────────────────────────────────────
    const prompt = prompts[elementMode] || "";
    const referenceImages = references[elementMode] || [];

    // ─── Placeholder Logic ────────────────────────────────────────────────────
    const placeholder = React.useMemo(() => {
        if (elementMode === 'character') return "Describe your character...";
        if (elementMode === 'location')  return "Describe your location...";
        return "Describe your element...";
    }, [elementMode]);

    // ─── Drag Error Calculation ──────────────────────────────────────────────
    const dragError = React.useMemo(() => {
        if (!isDraggingGalleryItem || !draggedItem) return null;
        if (referenceImages.length >= maxRefs) {
            return `Reference limit reached (max ${maxRefs})`;
        }
        return null;
    }, [isDraggingGalleryItem, draggedItem, referenceImages.length]);

    // ─── Drop Handlers ───────────────────────────────────────────────────────
    const handleGalleryDrop = (role) => {
        if (!draggedItem || dragError) return;
        addReference(draggedItem, role, maxRefs);
        setIsDraggingGalleryItem(false);
        setDraggedItem(null);
    };

    // ─── Library / Popover Handlers ──────────────────────────────────────────
    const openDialog = (mode = 'image', role = 'normal', callback = null) => {
        setInternalMode(mode);
        setTargetRole(role);
        setMentionCallback(() => callback);
        setDialogOpen(true);
        s.handleOpenLibrary?.(mode);
    };

    const handleAddClick = () => {
        if (dialogOpen) {
            setDialogOpen(false);
        } else {
            openDialog('image', 'normal');
        }
    };

    const handleSelectMedia = (assets) => {
        const items = Array.isArray(assets) ? assets : [assets];
        items.forEach(asset => addReference(asset, targetRole, maxRefs));
        if (mentionCallback) mentionCallback(items);
        setDialogOpen(false);
    };

    // ─── Character Sheet Generation Logic ──────────────────────────────────
    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        
        if (!prompt.trim() || creatingSheet || s.generating) return;

        // Specialized Sheet Generation (Character, Location, Product)
        if (['character', 'location', 'product'].includes(elementMode)) {
            const payload = {
                type: elementMode,
                prompt,
                features: elementMode === 'character' ? features : {}, // Features currently only for character
                references: buildReferencesPayload(referenceImages),
                project_id: projectId,
                session_id: activeSessionId,
            };

            console.log(`📡 [useElementPrompt] Dispatching ${elementMode} request with ${payload.references.length} references:`, payload);

            try {
                await runCreateElementSheet({ payload });
                
                // Success: Invalidate and clear
                if (projectId) {
                    queryClient.invalidateQueries({ queryKey: queryKeys.projectData.byProject(projectId) });
                }
                setPrompt("");
                return;
            } catch (err) {
                console.error(`❌ Failed to create ${elementMode} sheet:`, err);
                return;
            }
        }

        // 'general' Mode: Fallback to standard generation
        console.log("🛠️ Generating Element (Standard):", { prompt, mode: elementMode, refs: referenceImages });
        return s.handleGenerate(e); 
    };

    return {
        ...s,
        // UI State
        variationsOpen,
        setVariationsOpen,
        toggleVariations: () => setVariationsOpen(prev => !prev),
        dialogOpen,
        setDialogOpen,
        
        // Element specific Store state (Overriding s.prompt)
        prompt,
        setPrompt,
        elementMode,
        setElementMode,
        placeholder,
        referenceImages, // Isolated element references
        selectedModel: mockSelectedModel, // Fixes reference visibility in Row1
        
        // Drag & Drop
        isDraggingGalleryItem,
        draggedItem,
        dragError,
        handleGalleryDrop,

        // Media
        internalMode,
        handleAddClick,
        handleSelectMedia,
        openDialog,

        // Actions
        generating: creatingSheet || s.generating,
        handleAddReference: (asset, role = "normal") => {
            if (!asset?.url) return;
            return addReference(asset, role, maxRefs);
        },
        handleRemoveReference: (assetId) => {
            removeReference(assetId);
            toggleMediaTag(assetId); // Also remove the tag from the prompt if it exists
        },
        handleClearReferences: clearReferences,
        handleGenerate,
        maxRefs,

        // Features
        features,
        updateFeature,
        toggleTagInPrompt,
        toggleMediaTag,
    };
}
