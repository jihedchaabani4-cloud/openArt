"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

/**
 * Universal Rename Dialog for Workflows, Uploads, Characters, and Elements.
 */
export function RenameDialog({
  open,
  onOpenChange,
  initialName = "",
  title = "Rename",
  onRename,
}) {
  const [name, setName] = React.useState(initialName);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setName(initialName || "");
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [open, initialName]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) {
      onOpenChange?.(false);
      return;
    }

    try {
      setLoading(true);
      await onRename?.(trimmed);
      onOpenChange?.(false);
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="small"
        className="bg-[var(--mat-dialog-container-color,var(--background-state-90))] border border-[var(--mat-sys-outline-variant,rgba(255,255,255,0.08))] text-[var(--mat-sys-on-surface,#e3e3e3)] rounded-[var(--mat-dialog-container-shape,24px)] max-w-[340px] p-5 shadow-[var(--mat-dialog-container-elevation-shadow)] backdrop-blur-xl"
        showCloseButton={false}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-[var(--mat-sys-on-surface,#e3e3e3)] text-[15px] font-semibold tracking-tight text-left">
              {title}
            </DialogTitle>
          </DialogHeader>

          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name..."
            disabled={loading}
            className="h-10 text-[13px] bg-[var(--foreground-state-05)] border-[var(--mat-sys-outline-variant,#444746)] focus:border-[var(--mat-sys-primary,#a8c7fa)] text-[var(--mat-sys-on-surface,#e3e3e3)] rounded-[var(--mat-sys-corner-medium,12px)]"
          />

          <div className="flex gap-2 justify-end w-full pt-1">
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={loading}
                className="text-[var(--mat-sys-on-surface-variant,#8e918f)] hover:text-[var(--mat-sys-on-surface,#e3e3e3)]"
              >
                Cancel
              </Button>
            </DialogClose>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading || !name.trim()}
              className="min-w-[70px]"
            >
              {loading ? (
                <GoogleIcon iconName="progress_activity" className="text-[14px] animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RenameDialog;
