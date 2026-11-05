"use client";
import { logger } from "@/shared/lib/logger";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

/**
 * InlineRenamePill
 * Compact floating rename capsule matching Google Flow / studio design.
 * Positioned under the media card with check and cancel buttons.
 */
export function InlineRenamePill({
  initialName = "",
  onSave,
  onCancel,
  className,
  maxLength = 120,
}) {
  const [name, setName] = useState(initialName || "");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);
  const isClosingRef = useRef(false);

  // Auto-focus + select all text on mount
  useEffect(() => {
    setName(initialName || "");
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [initialName]);

  const handleSave = useCallback(async () => {
    if (isSaving || isClosingRef.current) return;
    const trimmed = name.trim();

    if (!trimmed || trimmed === (initialName || "").trim()) {
      isClosingRef.current = true;
      onCancel?.();
      return;
    }

    try {
      setIsSaving(true);
      await onSave?.(trimmed);
      isClosingRef.current = true;
      onCancel?.();
    } catch (err) {
      logger.error("inline_rename_save_failed", { error: err });
      setIsSaving(false);
    }
  }, [name, initialName, isSaving, onSave, onCancel]);

  const handleCancel = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    onCancel?.();
  }, [onCancel]);

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
      className={cn(
        "flex items-center gap-3.5",
        "bg-(--background-base-pri) backdrop-blur-[80px] rounded-2xl",
        "px-5 py-3",
        "shadow-2xl shadow-black/80",
        "min-w-[400px] max-w-[min(92vw,560px)]",
        "select-none",
        className
      )}
    >
      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        value={name}
        maxLength={maxLength}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Untitled"
        disabled={isSaving}
        className={cn(
          "flex-1 min-w-0 bg-transparent border-none outline-none",
          "text-white text-[15px] font-medium leading-normal",
          "placeholder-white/35 focus:outline-none focus:ring-0",
          isSaving && "opacity-50"
        )}
      />

      {/* Action buttons (Check ✓ and Close ✕) */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          onClick={handleSave}
          disabled={isSaving}
          title="Save (Enter)"
          aria-label="Save"
          className="size-7 p-0"
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin text-white" />
          ) : (
            <Check className="size-4 stroke-[2.5]" />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
          title="Cancel (Esc)"
          aria-label="Cancel"
          className="size-7 p-0"
        >
          <X className="size-4 stroke-[2.5]" />
        </Button>
      </div>
    </div>
  );
}

export default InlineRenamePill;
