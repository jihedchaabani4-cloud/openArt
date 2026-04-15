import React from "react";
import { cn } from "@/shared/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { PromptBarBase } from "../generation/PromptBarBase";
import { Row1 } from "../generation/Row1";
import { PromptTextarea } from "../common/PromptTextarea";
import { ElementsRow2 } from "./ElementsRow2";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";
import { useElementPrompt } from "../../model/useElementPrompt";
import { DragDropOverlay } from "../generation/DragDropOverlay";
import { ElementFeatureEditor } from "./ElementFeatureEditor";

export function ElementsPromptBar({ hideBackground = false }) {
    const s = useElementPrompt();
    const paperclipRef = React.useRef(null);
    const sparklesRef = React.useRef(null);
    const [featureEditorOpen, setFeatureEditorOpen] = React.useState(false);

    return (
        <div className={cn(
            hideBackground
                ? "relative w-full flex flex-col"
                : "fixed bottom-8 left-1/2 -translate-x-1/2 w-full z-50 flex items-center justify-center px-6"
        )}>
            <div className="w-full flex flex-col items-end justify-end max-w-[750px]">
                {s.isDraggingGalleryItem ? (
                    <DragDropOverlay 
                        mode={s.generationMode} 
                        onDrop={s.handleGalleryDrop}
                        error={s.dragError}
                    />
                ) : (
                    <div className="relative w-full flex flex-col border border-white/5 shadow-[0px_16px_32px_-8px_rgba(0,0,0,0.4)] backdrop-blur-[80px] bg-[#161718e6] rounded-2xl overflow-hidden min-h-[60px]">
                        <div className="w-full flex flex-col">
                            {/* Elements do not use generic Generation Modes/Ratios */}

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
                                        onTriggerMentionDialog={(cb) => s.openDialog('image', 'normal', cb)}
                                    />
                                    <ElementsRow2 
                                        paramsProps={{
                                            elementMode: s.elementMode,
                                            setElementMode: s.setElementMode,
                                            featureEditorOpen,
                                            setFeatureEditorOpen,
                                            sparklesRef
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
                        </div>
                    </div>
                )}
            </div>
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
        </div>
    );
}
