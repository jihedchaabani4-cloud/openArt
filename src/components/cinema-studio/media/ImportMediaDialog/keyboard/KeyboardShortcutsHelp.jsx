"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/primitives/popover";
import { IconButton } from "@/components/base/icon-button";
import { Label } from "@/components/base/label";
import { cn } from "@/shared/lib/utils";

function ShortcutRow({ label, keys }) {
  const list = Array.isArray(keys) ? keys : [keys];
  return (
    <div className="flex items-center justify-between px-2 py-1 rounded-subtle hover:bg-white/5 transition-colors">
      <span className="ds-type-small text-white/70 antialiased">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        {list.map((k, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 min-w-4 ds-type-micro-tag font-mono text-white/90 bg-white/10 rounded-sharp border border-white/10 flex items-center justify-center select-none"
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
          className={cn("size-8 p-0 font-mono ds-type-small shrink-0", className)}
          aria-label="Keyboard Shortcuts"
          title="Keyboard Shortcuts"
        >
          <span className="ds-type-button font-mono">?</span>
        </IconButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        onMouseLeave={() => setOpen(false)}
        className="z-50 w-64 bg-ui-menu-background p-2 [--blur:40px] border border-border-weak rounded-comfortable shadow-none text-text-primary select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 pt-0.5 pb-2 mb-1 border-b border-white/10">
          <span className="ds-type-caption-label text-white/90 antialiased">Shortcuts</span>
          <span className="ds-type-micro-tag text-white/40 font-mono">Help</span>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-0.5">
          {/* Assets Section */}
          <Label as="div" className="px-2 pt-1 pb-0.5">
            Assets
          </Label>
          <ShortcutRow label="Navigate" keys={["↑", "↓", "←", "→"]} />
          <ShortcutRow label="Multi-select" keys="Space" />
          <ShortcutRow label="Add to prompt" keys="↵" />
          <ShortcutRow label="To sidebar" keys="←" />

          <div className="my-1 border-t border-white/10" />

          {/* Categories Section */}
          <Label as="div" className="px-2 pt-0.5 pb-0.5">
            Categories
          </Label>
          <ShortcutRow label="Switch" keys={["↑", "↓"]} />
          <ShortcutRow label="Enter" keys={["→", "Tab"]} />

          <div className="my-1 border-t border-white/10" />

          {/* General Section */}
          <Label as="div" className="px-2 pt-0.5 pb-0.5">
            General
          </Label>
          <ShortcutRow label="Search" keys="/" />
          <ShortcutRow label="Close" keys="Esc" />
        </div>
      </PopoverContent>
    </Popover>
  );
}
