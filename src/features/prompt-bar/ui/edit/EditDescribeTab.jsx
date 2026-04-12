"use client";

import React from "react";
import { Paperclip, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { PromptTextarea } from "../common/PromptTextarea";
import { ModelSelector } from "../common/selectors/ModelSelector";
import { EditReferenceList } from "./EditReferenceList";
import { ImportMediaPopover } from "@/widgets/ImportMediaDialog/ImportMediaPopover";

/**
 * EditDescribeTab
 * Unified component for the "Describe" (image) or "Generate" (video) tab.
 */
export function EditDescribeTab({ s }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const isVideo = !!s.editTarget?.isVideo;

  const handleOpenMedia = (e) => {
    e.preventDefault();
    e.stopPropagation();
    s.handleOpenLibrary?.(isVideo ? "video" : "image");
    setDialogOpen(true);
  };

  return (
    <div className="p-2">
      {/* Reference list - renders above the input bar if images exist */}
      {s.referenceImages.length > 0 && (
        <div className="">
          <EditReferenceList
            images={s.referenceImages}
            onRemove={s.handleRemoveReference}
          />
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex flex-col  gap-1 min-h-[64px]">
        {/* Text Area Input */}
        <div className="flex-1 min-w-0">
          <PromptTextarea
            value={s.prompt}
            onChange={s.setPrompt}
            onSubmit={() => s.handleGenerate()}
            textareaRef={s.textareaRef}
            placeholder={isVideo ? "Describe the next scene…" : "What happens next?"}
            className="flex-1 flex gap-1.5 items-start w-full min-h-[40px] py-2 text-[16px] leading-relaxed placeholder:text-white/20 bg-transparent border-none focus:ring-0"
          />
        </div>

        {/* Bottom Actions Row */}
        <div className="flex gap-3 shrink-0 mb-0.5 justify-between">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={handleOpenMedia}
            className="p-2 mb-0.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors shrink-0"
            title="Add Reference"
          >
            <Paperclip className="size-5" />
          </button>

          {/* Right Actions: Model Selector & Submit */}
          <div className="flex items-center gap-3 shrink-0">
            <ModelSelector
              type={isVideo ? "video" : "image"}
              onChange={s.setModel}
              defaultId={s.model?.id}
              dynamicModels={s.studioModels}
              loading={s.studioModelsLoading}
              className="border-none bg-transparent hover:bg-transparent h-8 text-[12px] font-bold text-white/60 hover:text-white transition-colors"
            />

            <Button
              type="submit"
              onClick={() => s.handleGenerate()}
              disabled={s.generating || !s.prompt.trim()}
              variant="studio-white"
              className="size-10 rounded-full p-0 flex items-center justify-center shadow-xl active:scale-95 transition-all bg-[#3E3E3E] hover:bg-[#4E4E4E] text-white border-none"
            >
              {s.generating ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ArrowRight className="size-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <ImportMediaPopover
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        maxAllowed={Math.max(0, (s.maxRefs || 4) - s.referenceImages.length)}
        onSelect={(assets) => {
          const items = Array.isArray(assets) ? assets : [assets];
          items.forEach((asset) => s.handleAddReference?.(asset, "normal"));
          setDialogOpen(false);
        }}
        onUploadFromPC={(files) => {
          const items = Array.isArray(files) ? files : [files];
          items.forEach((file) => s.handleUploadFromPC?.(file, "normal"));
          setDialogOpen(false);
        }}
        library={s.library}
        loading={s.libraryLoading}
        hasMore={s.libraryHasMore}
        onLoadMore={s.handleLoadMoreAssets}
        assetSource={s.assetSource}
        setAssetSource={s.setAssetSource}
        mode={isVideo ? "video" : "image"}
      />
    </div>
  );
}