"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/primitives/popover";
import { IconButton } from "@/components/base/icon-button";
import { cn } from "@/shared/lib/utils";

function ShortcutRow({ label, keys }) {
  const list = Array.isArray(keys) ? keys : [keys];
  return (
    <div className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
      <span className="text-xs text-white/70 font-normal leading-none font-sans antialiased">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        {list.map((k, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 min-w-4 text-xs font-mono font-medium text-white/90 bg-white/10 rounded border border-white/10 flex items-center justify-center leading-none select-none"
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
 * Click-triggered shortcut help popover:
 * - Opens only on click
 * - Closes on mouse leave or click outside
 * - Positioned on right side (align="end")
 * - Styled with dialog's ui-menu-background at 90% opacity and 2xl glassmorphism
 */
export function KeyboardShortcutsHelp({ className }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton
          variant={open ? "tonal" : "ghost"}
          className={cn("size-8 p-0 font-mono text-sm shrink-0", className)}
          aria-label="Keyboard Shortcuts"
          title="Keyboard Shortcuts"
        >
          <span className="font-mono text-sm font-semibold leading-none">?</span>
        </IconButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        onMouseLeave={() => setOpen(false)}
        className="z-50 w-64 bg-ui-menu-background p-2 [--blur:40px] border border-border-weak rounded-[var(--radius-3xl)] shadow-none text-text-primary select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 pt-0.5 pb-2 mb-1 border-b border-white/10">
          <span className="text-xs font-medium text-white/90 font-sans antialiased">Shortcuts</span>
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono font-semibold">Help</span>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-0.5">
          {/* Assets Section */}
          <div className="text-[10px] font-semibold text-white/40 px-2 pt-1 pb-0.5 uppercase tracking-wider font-sans antialiased">
            Assets
          </div>
          <ShortcutRow label="Navigate" keys={["↑", "↓", "←", "→"]} />
          <ShortcutRow label="Multi-select" keys="Space" />
          <ShortcutRow label="Add to prompt" keys="↵" />
          <ShortcutRow label="To sidebar" keys="←" />

          <div className="my-1 border-t border-white/10" />

          {/* Categories Section */}
          <div className="text-[10px] font-semibold text-white/40 px-2 pt-0.5 pb-0.5 uppercase tracking-wider font-sans antialiased">
            Categories
          </div>
          <ShortcutRow label="Switch" keys={["↑", "↓"]} />
          <ShortcutRow label="Enter" keys={["→", "Tab"]} />

          <div className="my-1 border-t border-white/10" />

          {/* General Section */}
          <div className="text-[10px] font-semibold text-white/40 px-2 pt-0.5 pb-0.5 uppercase tracking-wider font-sans antialiased">
            General
          </div>
          <ShortcutRow label="Search" keys="/" />
          <ShortcutRow label="Close" keys="Esc" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
