"use client";

import React from "react";
import { cn } from "@/shared/lib/utils";

function KeyPill({ keys, label }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-white/50 select-none">
      <div className="flex items-center gap-0.5">
        {(Array.isArray(keys) ? keys : [keys]).map((k, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 min-w-[18px] text-[10.5px] font-mono font-semibold text-white/80 bg-white/10 rounded-md border border-white/10 shadow-xs flex items-center justify-center leading-none"
          >
            {k}
          </kbd>
        ))}
      </div>
      <span className="text-white/60 text-[11px]">{label}</span>
    </div>
  );
}

/**
 * KeyboardFooterHints
 * Dynamic contextual shortcut pill bar rendered at the bottom of the popover.
 * Adapts in real time depending on whether the user is in "sidebar", "gallery", or "search".
 */
export function KeyboardFooterHints({ activeZone = "gallery", className }) {
  return (
    <div
      className={cn(
        "px-4 py-2 border-t border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between gap-4 text-xs shrink-0 select-none",
        className
      )}
    >
      <div className="flex items-center gap-3.5 flex-wrap">
        {activeZone === "sidebar" && (
          <>
            <KeyPill keys={["↑", "↓"]} label="Categories" />
            <KeyPill keys="→" label="Open Gallery" />
            <KeyPill keys="/" label="Search" />
          </>
        )}

        {activeZone === "gallery" && (
          <>
            <KeyPill keys={["↑", "↓", "←", "→"]} label="Navigate" />
            <KeyPill keys="↵" label="Select" />
            <KeyPill keys="/" label="Search" />
            <KeyPill keys="←" label="Sidebar (at edge)" />
          </>
        )}

        {activeZone === "search" && (
          <>
            <KeyPill keys="Type" label="Filter items" />
            <KeyPill keys="↓" label="Enter Gallery" />
            <KeyPill keys="Esc" label="Clear" />
          </>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <KeyPill keys="Esc" label="Close" />
      </div>
    </div>
  );
}

export { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
