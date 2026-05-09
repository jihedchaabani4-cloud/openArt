"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip } from "lucide-react";
import { useElementPrompt } from "../../model/useElementPrompt";
import { PromptBarShell } from "../common/PromptBarShell";
import { PromptBarBase } from "../generation/PromptBarBase";
import { Row1 } from "../generation/Row1";
import { PromptTextarea } from "../common/PromptTextarea";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { ActionButton } from "../common/ActionButton";
import { ElementFeatureEditor } from "../elements/ElementFeatureEditor";
import { useElementStore } from "../../model/useElementStore";

export function EditElementPromptBar({ className }) {
  const s = useElementPrompt();
  const paperclipRef = React.useRef(null);
  const featureEditorOpen = useElementStore((state) => state.featureEditor.open);
  const setFeatureEditorOpen = useElementStore((state) => state.setFeatureEditorOpen);

  return (
    <PromptBarShell
      variant="edit"
      hideBackground
      className={cn("relative w-full max-w-[600px]", className)}
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
            anchorRef={null}
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

      <PromptBarBase s={s} className="p-3 gap-3">
        <div className="flex flex-col gap-3 w-full">
          <PromptTextarea
            value={s.prompt}
            onChange={s.setPrompt}
            onSubmit={s.handleGenerate}
            textareaRef={s.textareaRef}
            referenceImages={s.referenceImages}
            placeholder={s.placeholder}
            onTriggerMentionDialog={s.maxRefs > 0 ? (cb) => s.openDialog("image", "normal", cb) : undefined}
          />

          <div className="flex items-center justify-between gap-3">
            {s.maxRefs > 0 && (
              <Button
                ref={paperclipRef}
                onClick={s.handleAddClick}
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-lg transition-colors shrink-0 w-10 h-10",
                  s.dialogOpen
                    ? "bg-white/10 text-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
                )}
                title="Upload media"
                type="button"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            )}

            <ActionButton
              generating={s.generating}
              onSubmit={() => s.handleGenerate()}
              appOverride={`${s.elementMode}_sheet`}
              generationMode={s.generationMode}
              hasContent={(s.prompt || "").trim().length > 0}
            />
          </div>
        </div>
      </PromptBarBase>
    </PromptBarShell>
  );
}
