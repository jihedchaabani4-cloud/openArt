"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Icon } from "@/shared/ui/Icon";
import { Button } from "@/shared/ui/button";

/**
 * Generic delete confirmation dialog.
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  loading = false,
  children,
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      setIsOpen(false);
    } catch {
      // Keep open on failure
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        variant="small"
        className="max-w-xs p-5"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-3">
            <Icon name="warning" size={32} className="text-[var(--pink-400)]" />
          </div>

          <DialogHeader className="space-y-1">
            <DialogTitle className="sr-only">{title || "Confirm Deletion"}</DialogTitle>
            <DialogDescription className="text-[var(--text-body)] text-sm font-normal text-center leading-snug">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex gap-2 w-full">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                className="flex-1"
              >
                {cancelLabel}
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDeleteDialog;
