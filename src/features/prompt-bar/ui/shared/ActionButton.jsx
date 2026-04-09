// src/components/features/ImagePromptBar/components/Row2/ActionButton.jsx
import React from 'react';
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { ArrowLeft, ArrowUp } from "lucide-react";

// You asked for "flech to left", so here is ArrowLeft as an option, though typically a send button is ArrowUp.
// Feel free to change this to ArrowUp by swapping the component!
const GenerateIcon = ({ size = 18 }) => (
  // <ArrowLeft size={size} strokeWidth={2.5} />
  <ArrowUp size={size} strokeWidth={2.5} />
);

export function ActionButton({ generating, prompt }) {
  const safePrompt = typeof prompt === 'string' ? prompt : '';
  const hasContent = safePrompt.trim().length > 0;

  return (
    <Button
      type="submit"
      disabled={generating}
      className={cn(
        "h-10 w-10 p-0 rounded-xl border text-[14px] transition-all duration-200 flex items-center justify-center shrink-0",
        generating
          ? "bg-white/5 border-white/15 text-white cursor-wait"
          : !hasContent
            ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/8 hover:text-white/60"
            : "bg-white border-white/15 text-black hover:bg-white/90"
      )}
    >
      {generating ? (
        <div className="w-[16px] h-[16px] rounded-md border-[2.5px] border-white/20 border-t-white animate-spin" />
      ) : (
        <GenerateIcon />
      )}
    </Button>
  );
}
