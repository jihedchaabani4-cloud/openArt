"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/utils";

/**
 * Modal Primitive — design-system 09-overlays-controls.md
 * Standard dialog modal with backdrop blur and header/content/actions structure
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
  className,
  ...props
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent className={cn("modal", className)}>
        {(title || description) && (
          <DialogHeader className="p-0 mb-4">
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className="flex-1 min-w-0">{children}</div>
        {actions && <DialogFooter className="modal-actions p-0 mt-6">{actions}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export {
  Dialog as ModalRoot,
  DialogContent as ModalContent,
  DialogHeader as ModalHeader,
  DialogTitle as ModalTitle,
  DialogDescription as ModalDescription,
  DialogFooter as ModalActions,
  DialogClose as ModalClose,
};

export default Modal;
