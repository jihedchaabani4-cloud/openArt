"use client";

import React, { useEffect } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { MentionNode } from "./MentionNode";
import { MentionPlugin } from "./MentionPlugin";

const theme = {
  paragraph: "text-white/90 text-[14.5px] leading-relaxed",
};

// Internal plugin to sync external state and handle submission
function SubmissionPlugin({ onSubmit, externalValue }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // This could be used for two-way sync if needed, 
    // but usually Lexical is the source of truth.
  }, [externalValue, editor]);

  return null;
}

export function PromptEditor({ 
  value, 
  onChange, 
  onSubmit, 
  referenceImages,
  textareaRef // We'll try to sync focus to Lexical
}) {
  const initialConfig = {
    namespace: "PromptEditor",
    theme,
    nodes: [MentionNode],
    onError: (error) => {
      console.error(error);
    },
  };

  const handleLexicalChange = (editorState) => {
    editorState.read(() => {
      const text = editorState._nodeMap.get("root").getTextContent();
      // We send the plain text back to parent so ActionButton etc still work
      onChange(text);
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative min-h-[36px] w-full items-start">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="outline-none text-white text-[14.5px] leading-relaxed min-h-[36px] py-1.5"
            />
          }
          placeholder={
            !value && (
              <span className="absolute top-1.5 left-0 text-white/25 text-[14.5px] pointer-events-none">
                Describe the scene you imagine...
              </span>
            )
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        <HistoryPlugin />
        <MentionPlugin images={referenceImages} />
        <OnChangePlugin onChange={handleLexicalChange} />
        <SubmissionPlugin onSubmit={onSubmit} externalValue={value} />
      </div>
    </LexicalComposer>
  );
}
