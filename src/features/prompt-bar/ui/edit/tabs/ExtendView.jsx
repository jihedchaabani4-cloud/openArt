import React from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { PromptTextarea } from "../../common/PromptTextarea";
import { ModelSelector } from "../../common/selectors/ModelSelector";

export function ExtendView({ s }) {
    if (!s) return null;

    return (
            <div className="flex flex-col gap-1 min-h-[64px] p-2 bg-(--color-imagine-grey-2) backdrop-blur-[80px] rounded-xl w-full min-w-[400px] ">
                {/* Text Area Input */}
                <div className="flex-1 min-w-0">
                    <PromptTextarea
                        value={s.prompt}
                        onChange={s.setPrompt}
                        onSubmit={() => s.handleExtendVideo()}
                        textareaRef={s.textareaRef}
                        placeholder="Describe how to extend the scene (optional)…"
                        className="flex-1 flex gap-1.5 items-start w-full min-h-[40px] py-2 text-[16px] leading-relaxed placeholder:text-white/20 bg-transparent border-none focus:ring-0"
                    />
                </div>

                {/* Bottom Actions Row */}
                <div className="flex gap-3 items-center shrink-0 mb-0.5 justify-end">
                    <ModelSelector
                        type="motion"
                        onChange={s.setModel}
                        defaultId={s.model?.id}
                        dynamicModels={s.studioModels}
                        loading={s.studioModelsLoading}
                        className="border-none bg-transparent hover:bg-transparent h-8 text-[12px] font-bold text-white/60 hover:text-white transition-colors"
                    />
                    <Button
                        type="submit"
                        onClick={() => s.handleExtendVideo()}
                        disabled={s.extendingVideo}
                        variant="studio-white"
                        className="size-10 rounded-full p-0 flex items-center justify-center shadow-xl active:scale-95 transition-all bg-[#3E3E3E] hover:bg-[#4E4E4E] text-white border-none"
                        title="Extend Video"
                    >
                        {s.extendingVideo ? (
                            <Loader2 className="size-5 animate-spin" />
                        ) : (
                            <ArrowRight className="size-5" />
                        )}
                    </Button>
                </div>
            </div>
    
    );
}
