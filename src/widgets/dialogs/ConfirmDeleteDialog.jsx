"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/shared/ui/dialog";

/**
 * Generic delete confirmation dialog. Use it anywhere you need a simple "Are you sure?" delete flow.
 *
 * @param {boolean} open - Controlled open state
 * @param {function} onOpenChange - (open: boolean) => void
 * @param {string} title - Dialog title (e.g. "Delete element?")
 * @param {string} description - Dialog description (e.g. "This element will be deleted forever.")
 * @param {function} onConfirm - Called when user clicks confirm (e.g. async () => { await api.delete(...) })
 * @param {string} [confirmLabel="Yes, delete"]
 * @param {string} [cancelLabel="No, keep them"]
 * @param {boolean} [loading=false] - Show loading state on confirm button
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Yes, delete",
  cancelLabel = "No, keep them",
  loading = false,
}) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#131517] border-[#1C1F23] text-white rounded-2xl max-w-md w-[calc(100vw-1.5rem)] sm:w-full p-6"
        showCloseButton={false}
      >
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-white/40 text-[14px] leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex gap-3 justify-end">
          <DialogClose asChild>
            <button
              type="button"
              disabled={loading}
              className="h-11 px-7 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-[14px] transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="h-11 px-7 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-[14px] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
