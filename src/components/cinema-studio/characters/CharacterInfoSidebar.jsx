"use client";

import React from "react";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { Check, Copy } from "lucide-react";

/**
 * CharacterInfoSidebar
 * Renders the editable character name input, character info textarea,
 * features tags, and prompt preview box.
 */
export function CharacterInfoSidebar({
  draftTitle,
  setDraftTitle,
  onSaveTitle,
  draftDesc,
  setDraftDesc,
  onSaveDescription,
  features = [],
  prompt = "",
  promptCopied = false,
  onCopyPrompt,
}) {
  return (
    <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-5">
      {/* Editable Character Name Input */}
      <Input
        prefix="@"
        placeholder="Character Name"
        value={draftTitle}
        onChange={(e) => setDraftTitle(e.target.value)}
        onBlur={() => onSaveTitle(draftTitle)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className="text-[2rem] leading-[2.5rem] font-normal text-white"
        containerClassName="w-full"
      />

      {/* Character Info Box */}
      <Textarea
        label="Character Info"
        labelExtra="(optional)"
        placeholder="Describe how your character acts..."
        value={draftDesc}
        onChange={(e) => setDraftDesc(e.target.value)}
        onBlur={() => onSaveDescription(draftDesc)}
        minHeight={160}
        maxHeight={300}
        hint="The Flow agent can use this information to help craft scenes with your character."
        containerClassName="pt-1"
      />

      {/* Additional metadata tags (Features / Prompt) if available */}
      {(features.length > 0 || prompt) && (
        <div className="flex flex-col gap-3 pt-3 mt-1">
          {features.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-white/70">Features</span>
              <div className="flex flex-wrap gap-1.5">
                {features.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs bg-white/5 text-white/80"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {prompt && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Prompt</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={onCopyPrompt}
                  className="text-white/40 hover:text-white"
                >
                  {promptCopied ? (
                    <Check className="size-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-white/50 leading-relaxed line-clamp-3">{prompt}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CharacterInfoSidebar;
