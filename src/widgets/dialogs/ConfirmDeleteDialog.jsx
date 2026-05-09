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
    await onConfirm();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        variant="small"
        className="bg-[#121212c9] border border-white/5 text-white rounded-[28px] max-w-[250px] p-2 "
        showCloseButton={false}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-3">
            <GoogleIcon iconName="warning" className="text-[32px] text-white" />
          </div>
          
          <DialogHeader className="space-y-1">
            <DialogTitle className="sr-only">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-white/90 text-[14px] font-medium text-center leading-snug">
              {description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex gap-2.5 w-full">
            <DialogClose asChild>
              <button
                type="button"
                disabled={loading}
                className="flex-1 h-10 rounded-xl bg-[#2A2A2A] hover:bg-[#333333] text-white font-semibold text-[10px] transition-all active:scale-95"
              >
                {cancelLabel}
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-white hover:bg-white/90 text-black font-semibold text-[10px] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="size-2.5 rounded-full " />
              )}
              {confirmLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
