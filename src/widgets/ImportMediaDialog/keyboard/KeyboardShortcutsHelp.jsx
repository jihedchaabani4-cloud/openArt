"use client";

import React, { useState } from "react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/shared/ui/hover-card";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

function ShortcutRow({ label, keys }) {
  const list = Array.isArray(keys) ? keys : [keys];
  return (
    <div className="flex items-center justify-between px-2 py-1 rounded-button hover:bg-white/[0.04] transition-colors">
      <span className="text-[12px] text-white/70 font-normal leading-none">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        {list.map((k, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 min-w-[18px] text-[10.5px] font-mono font-medium text-white/85 bg-white/[0.08] rounded-badge border border-white/[0.06] flex items-center justify-center leading-none select-none"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

/**
 * KeyboardShortcutsHelp
 * Compact, simple '?' trigger with a sleek menu-style hover dropdown.
 */
export function KeyboardShortcutsHelp({ className }) {
  const [open, setOpen] = useState(false);

  return (
    <HoverCard
      open={open}
      onOpenChange={setOpen}
      openDelay={80}
      closeDelay={180}
    >
      <HoverCardTrigger asChild>
        <Button
          type="button"
          variant={open ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          className={cn("font-mono text-sm shrink-0", className)}
          aria-label="Keyboard Shortcuts"
          title="Keyboard Shortcuts"
        >
          ?
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        align="end"
        side="bottom"
        sideOffset={6}
        className="z-[999999] w-[236px] p-2 bg-[rgba(22,23,24,0.88)] backdrop-blur-[80px] saturate-[180%] border border-white/[0.08] rounded-card shadow-[0_16px_36px_rgba(0,0,0,0.55)] text-white select-none font-['Google_Sans_Text',sans-serif]"
      >
        {/* Minimal Header */}
        <div className="flex items-center justify-between px-2 pt-0.5 pb-1.5 mb-1 border-b border-white/[0.06]">
          <span className="text-[12px] font-medium text-white/90">Shortcuts</span>
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Help</span>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-0.5">
          {/* Assets Section */}
          <div className="text-[10px] font-medium text-white/40 px-2 pt-1 pb-0.5 uppercase tracking-wider">
            Assets
          </div>
          <ShortcutRow label="Navigate" keys={["↑", "↓", "←", "→"]} />
          <ShortcutRow label="Multi-select" keys="Space" />
          <ShortcutRow label="Add to prompt" keys="↵" />
          <ShortcutRow label="To sidebar" keys="←" />

          <div className="my-1 border-t border-white/[0.06]" />

          {/* Categories Section */}
          <div className="text-[10px] font-medium text-white/40 px-2 pt-0.5 pb-0.5 uppercase tracking-wider">
            Categories
          </div>
          <ShortcutRow label="Switch" keys={["↑", "↓"]} />
          <ShortcutRow label="Enter" keys={["→", "Tab"]} />

          <div className="my-1 border-t border-white/[0.06]" />

          {/* General Section */}
          <div className="text-[10px] font-medium text-white/40 px-2 pt-0.5 pb-0.5 uppercase tracking-wider">
            General
          </div>
          <ShortcutRow label="Search" keys="/" />
          <ShortcutRow label="Close" keys="Esc" />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
