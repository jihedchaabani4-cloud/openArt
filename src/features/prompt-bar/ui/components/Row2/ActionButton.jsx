// src/components/features/ImagePromptBar/components/Row2/ActionButton.jsx
import React from 'react';
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

const SparkleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor" className="ml-2">
    <path d="M11.8525 4.21651L11.7221 3.2387C11.6906 3.00226 11.4889 2.82568 11.2504 2.82568C11.0118 2.82568 10.8102 3.00226 10.7786 3.23869L10.6483 4.21651C10.2658 7.0847 8.00939 9.34115 5.14119 9.72358L4.16338 9.85396C3.92694 9.88549 3.75037 10.0872 3.75037 10.3257C3.75037 10.5642 3.92694 10.7659 4.16338 10.7974L5.14119 10.9278C8.00938 11.3102 10.2658 13.5667 10.6483 16.4349L10.7786 17.4127C10.8102 17.6491 11.0118 17.8257 11.2504 17.8257C11.4889 17.8257 11.6906 17.6491 11.7221 17.4127L11.8525 16.4349C12.2349 13.5667 14.4913 11.3102 17.3595 10.9278L18.3374 10.7974C18.5738 10.7659 18.7504 10.5642 18.7504 10.3257C18.7504 10.0872 18.5738 9.88549 18.3374 9.85396L17.3595 9.72358C14.4913 9.34115 12.2349 7.0847 11.8525 4.21651Z" />
  </svg>
);

export function ActionButton({ generating, prompt }) {
  const safePrompt = typeof prompt === 'string' ? prompt : '';
  const hasContent = safePrompt.trim().length > 0;

  return (
    <Button
      type="submit"
      disabled={generating}
      className={cn(
        "h-10 px-[20px] rounded-[10px] border text-[14px] font-semibold transition-all duration-200 whitespace-nowrap flex items-center justify-center",
        generating
          ? "bg-white/5 border-white/15 text-white cursor-wait"
          : !hasContent
            ? "bg-white/5 border-white/10 text-white/40 hover:bg-white/8 hover:text-white/60"
            : "bg-white/92 border-white/15 text-[#0a0a0a]"
      )}
    >
      {generating ? (
        <>
          <div className="w-[13px] h-[13px] rounded-full border-2 border-white/15 border-t-white/50 animate-spin mr-2" />
          Generating...
        </>
      ) : (
        <>
          Generate
          <SparkleIcon />
        </>
      )}
    </Button>
  );
}
