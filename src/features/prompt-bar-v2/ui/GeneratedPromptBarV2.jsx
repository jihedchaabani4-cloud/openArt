"use client";

import React, { useRef, useTransition, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePromptBarV2Store } from "../core/promptBarStore";
import { ModelSelectorV2 } from "./ModelSelectorV2";
import { DynamicParameterRenderer } from "./DynamicParameterRenderer";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

/**
 * GeneratedPromptBarV2
 *
 * Model-agnostic, provider-agnostic Prompt Bar.
 * Exact visual fidelity to the production PromptBar UI:
 * - Rounded 28px frosted glass card container
 * - Animated variations drawer (toggled by tune icon)
 * - Auto-expanding prompt textarea with clean typography
 * - Bottom row with attachment paperclip (left) and ModelSelector + Tune + Generate (right)
 */
export function GeneratedPromptBarV2({ onGenerate, className }) {
  const [isPending, startTransition] = useTransition();
  const [variationsOpen, setVariationsOpen] = useState(false);
  const [mediaShelfOpen, setMediaShelfOpen] = useState(false);
  const textareaRef = useRef(null);

  // Store subscriptions
  const modelsMap = usePromptBarV2Store((state) => state.modelsMap);
  const selectedModelId = usePromptBarV2Store((state) => state.selectedModelId);
  const prompt = usePromptBarV2Store((state) => state.prompt);
  const parameterValues = usePromptBarV2Store((state) => state.parameterValues);
  const validationErrors = usePromptBarV2Store((state) => state.validationErrors);
  const isGenerating = usePromptBarV2Store((state) => state.isGenerating);

  // Store actions
  const selectModel = usePromptBarV2Store((state) => state.selectModel);
  const setParameter = usePromptBarV2Store((state) => state.setParameter);
  const setPrompt = usePromptBarV2Store((state) => state.setPrompt);
  const resetAllParameters = usePromptBarV2Store((state) => state.resetAllParameters);
  const validate = usePromptBarV2Store((state) => state.validate);
  const serialize = usePromptBarV2Store((state) => state.serialize);

  const modelsList = React.useMemo(() => Object.values(modelsMap), [modelsMap]);
  const currentModel = modelsMap[selectedModelId];
  const parameters = currentModel?.parameters || {};

  // Separate media parameters (slots & shelves) from inline generation controls
  const mediaParameters = React.useMemo(() => {
    const result = {};
    for (const [key, def] of Object.entries(parameters)) {
      if (def.isPrompt || key === "prompt") continue;
      if (def.group === "media" || ["image", "video", "image[]", "video[]"].includes(def.type)) {
        result[key] = def;
      }
    }
    return result;
  }, [parameters]);

  const generationParameters = React.useMemo(() => {
    const result = {};
    for (const [key, def] of Object.entries(parameters)) {
      if (def.isPrompt || key === "prompt") continue;
      if (!mediaParameters[key] && def.group !== "advanced") {
        result[key] = def;
      }
    }
    return result;
  }, [parameters, mediaParameters]);

  const advancedParameters = React.useMemo(() => {
    const result = {};
    for (const [key, def] of Object.entries(parameters)) {
      if (def.isPrompt || key === "prompt") continue;
      if (!mediaParameters[key] && def.group === "advanced") {
        result[key] = def;
      }
    }
    return result;
  }, [parameters, mediaParameters]);

  const hasMedia = Object.keys(mediaParameters).length > 0;
  const hasSettings = Object.keys(generationParameters).length > 0 || Object.keys(advancedParameters).length > 0;

  const handleGenerateClick = () => {
    const { isValid, errors } = validate();
    if (!isValid) {
      console.warn("[PromptBarV2] Generation blocked by validation errors:", errors);
      return;
    }

    const payload = serialize();
    onGenerate?.(payload);
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerateClick();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleClear = () => {
    setPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div
      className={cn(
        "relative w-full max-w-[650px] flex flex-col bg-[#121315]/95 backdrop-blur-[80px] rounded-[28px] border border-transparent hover:border-white/10 focus-within:border-white/15 shadow-2xl text-white transition-colors duration-200 overflow-hidden",
        className
      )}
    >
      {/* ── Clear Prompt Button (top right when prompt has text) ── */}
      {prompt.trim().length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleClear}
          className="absolute right-4 top-4 text-white/20 hover:text-white rounded-full z-30"
          title="Clear prompt"
        >
          <GoogleIcon iconName="close" className="text-[13px]" />
        </Button>
      )}

      {/* ── Settings Accordion Drawer (toggled by tune icon) ── */}
      <AnimatePresence>
        {variationsOpen && hasSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="w-full flex flex-col overflow-hidden border-b border-white/5 bg-white/[0.02]"
          >
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-white/40">
                  Model Settings &bull; {currentModel?.name || "Model"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={resetAllParameters}
                  className="text-[11px] text-white/40 hover:text-white gap-1 px-2 py-0.5"
                  title="Reset to default values"
                >
                  <GoogleIcon iconName="restart_alt" className="text-[13px]" />
                  <span>Reset</span>
                </Button>
              </div>

              {/* Dynamic Generation Parameters */}
              <DynamicParameterRenderer
                definitions={generationParameters}
                values={parameterValues}
                onChange={setParameter}
                errors={validationErrors}
              />

              {/* Advanced Parameters if any */}
              {Object.keys(advancedParameters).length > 0 && (
                <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-white/30">
                    Advanced Options
                  </span>
                  <DynamicParameterRenderer
                    definitions={advancedParameters}
                    values={parameterValues}
                    onChange={setParameter}
                    errors={validationErrors}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reference / Media Shelf (toggled by attachment or present media) ── */}
      <AnimatePresence>
        {(mediaShelfOpen || hasMedia) && Object.keys(mediaParameters).length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full overflow-hidden border-b border-white/5 bg-white/[0.01]"
          >
            <div className="px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide">
              <DynamicParameterRenderer
                definitions={mediaParameters}
                values={parameterValues}
                onChange={setParameter}
                errors={validationErrors}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Prompt Form Area ── */}
      <div className="flex flex-col w-full p-3 gap-1">
        {/* Textarea */}
        <div className="flex items-start px-2 pt-1 pb-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={`Describe what you want to create with ${currentModel?.name || "this model"}... (Ctrl+Enter to generate)`}
            className="w-full bg-transparent text-[15px] text-white/95 placeholder:text-white/30 outline-none resize-none leading-relaxed min-h-[48px] max-h-[180px] font-normal tracking-[-0.01em]"
          />
        </div>

        {/* ── Bottom Control Bar (Row2 style) ── */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Left: Paperclip / Attachment */}
          <Button
            type="button"
            variant={mediaShelfOpen ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setMediaShelfOpen((prev) => !prev)}
            title="Add Reference / Media"
          >
            <GoogleIcon iconName="attachment" className="text-[15px] rotate-[-45deg]" />
          </Button>

          {/* Right Controls: ModelSelector + Tune + Generate */}
          <div className="flex items-center gap-2 ml-auto">
            <ModelSelectorV2
              models={modelsList}
              selectedModelId={selectedModelId}
              onSelectModel={(id) => startTransition(() => selectModel(id))}
            />

            {/* Tune / Settings Toggle Button */}
            {hasSettings && (
              <Button
                type="button"
                variant={variationsOpen ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setVariationsOpen((prev) => !prev)}
                title="Model Parameters"
              >
                <GoogleIcon iconName="tune" className="text-[15px]" />
              </Button>
            )}

            {/* Action / Generate Button */}
            <Button
              type="button"
              variant={prompt.trim() ? "primary" : "secondary"}
              onClick={handleGenerateClick}
              disabled={isGenerating || isPending || !prompt.trim()}
              className={cn(
                "h-9 px-4 rounded-xl font-semibold text-[13px] flex items-center gap-2 transition-all cursor-pointer shadow-lg",
                prompt.trim()
                  ? "shadow-white/10"
                  : "bg-white/10 text-white/40 cursor-not-allowed shadow-none"
              )}
            >
              <GoogleIcon iconName="arrow_upward" className="text-[16px]" />
              <span>Generate</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
