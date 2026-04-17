import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PromptBarBase } from "../generation/PromptBarBase";
import { Row1 } from "../generation/Row1";
import { PromptTextarea } from "../common/PromptTextarea";
import { PromptBarShell } from "../common/PromptBarShell";
import { ElementsRow2 } from "./ElementsRow2";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";
import { useElementPrompt } from "../../model/useElementPrompt";
import { DragDropOverlay } from "../generation/DragDropOverlay";
import { ElementFeatureEditor } from "./ElementFeatureEditor";
import { useElementStore } from "../../model/useElementStore";

export function ElementsPromptBar({ hideBackground = false }) {
    const s = useElementPrompt();
    const paperclipRef = React.useRef(null);
    const sparklesRef = React.useRef(null);
    const featureEditorOpen = useElementStore((state) => state.featureEditor.open);
    const setFeatureEditorOpen = useElementStore((state) => state.setFeatureEditorOpen);

    return (
        <PromptBarShell
            variant="elements"
            hideBackground={hideBackground}
            isDragging={s.isDraggingGalleryItem}
            dragOverlay={
                <DragDropOverlay mode={s.generationMode} onDrop={s.handleGalleryDrop} error={s.dragError} />
            }
            popover={
                <>
                    <ImportMediaPopover
                        open={s.dialogOpen}
                        onOpenChange={s.setDialogOpen}
                        anchorRef={paperclipRef}
                        onSelect={s.handleSelectMedia}
                        library={s.library}
                        loading={s.libraryLoading}
                        mode={s.internalMode}
                    />
                    <ElementFeatureEditor
                        open={featureEditorOpen}
                        onOpenChange={setFeatureEditorOpen}
                        anchorRef={sparklesRef}
                    />
                </>
            }
        >
            <AnimatePresence>
                {s.referenceImages.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="w-full overflow-hidden p-2"
                    >
                        <Row1
                            referenceImages={s.referenceImages}
                            generationMode={s.generationMode}
                            onRemoveReference={s.handleRemoveReference}
                            openDialog={s.openDialog}
                            showAddButton={false}
                            maxRefs={s.maxRefs}
                            selectedModel={s.selectedModel}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <PromptBarBase s={s} className="p-3 gap-1.5">
                <div className="flex flex-col w-full gap-1.5">
                    <PromptTextarea
                        value={s.prompt}
                        onChange={s.setPrompt}
                        onSubmit={s.handleGenerate}
                        textareaRef={s.textareaRef}
                        referenceImages={s.referenceImages}
                        placeholder={s.placeholder}
                        onTriggerMentionDialog={(cb) => s.openDialog("image", "normal", cb)}
                    />
                    <ElementsRow2
                        paramsProps={{
                            elementMode: s.elementMode,
                            setElementMode: s.setElementMode,
                            featureEditorOpen,
                            setFeatureEditorOpen,
                            sparklesRef,
                        }}
                        actionProps={{
                            generating: s.generating,
                            onSubmit: s.handleGenerate,
                            prompt: s.prompt,
                        }}
                        onToggleVariations={s.toggleVariations}
                        variationsOpen={s.variationsOpen}
                        onAddClick={s.handleAddClick}
                        mediaOpen={s.dialogOpen}
                        paperclipRef={paperclipRef}
                    />
                </div>
            </PromptBarBase>
        </PromptBarShell>
    );
}
