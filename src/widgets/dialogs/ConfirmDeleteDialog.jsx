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
      variant="small"
        className="bg-[#1B1B1BBF] border-[#1C1F23] text-white rounded-2xl max-w-md w-[200px] sm:w-full p-6"
        showCloseButton={false}
      >
        <DialogHeader className="text-left mb-6">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="text-white/90 text-[14px] font-medium text-center leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex gap-3 justify-center">
          <DialogClose asChild>
            <button
              type="button"
              disabled={loading}
              className="h-11 px-7 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-[14px] transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          </DialogClose>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="h-11 px-7 rounded-xl bg-white hover:bg-white/80 text-black font-medium text-[14px] transition-colors disabled:opacity-50 flex items-center gap-2"
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
