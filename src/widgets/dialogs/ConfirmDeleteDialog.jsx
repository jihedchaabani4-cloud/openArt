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
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";

/**
 * Generic delete confirmation dialog. Use it anywhere you need a simple "Are you sure?" delete flow.
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
      // Keep the dialog open when delete fails (e.g. collection not empty).
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        variant="small"
        className="bg-[var(--mat-dialog-container-color,var(--background-state-90))] border border-[var(--mat-sys-outline-variant,rgba(255,255,255,0.08))] text-[var(--mat-sys-on-surface,#e3e3e3)] max-w-[250px] p-4 shadow-none"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-3">
            <GoogleIcon iconName="warning" className="text-[32px] text-[var(--mat-sys-error,#f2b8b5)]" />
          </div>
          
          <DialogHeader className="space-y-1">
            <DialogTitle className="sr-only">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-[var(--mat-sys-on-surface,#e3e3e3)] text-[14px] font-medium text-center leading-snug">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex gap-2.5 w-full">
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
