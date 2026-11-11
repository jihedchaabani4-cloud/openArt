"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Icon } from "@/shared/ui/Icon";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

// Root
function Dialog(props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

// Trigger
function DialogTrigger(props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

// Portal
function DialogPortal(props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

// Close
function DialogClose(props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

// Overlay
function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-200",
        className
      )}
      {...props}
    />
  );
}

// Content
function DialogContent({
  className,
  children,
  showCloseButton = true,
  variant = "default",
  ...props
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />

      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "z-50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 outline-none font-sans antialiased",
          "bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)]",
          "shadow-[0_16px_32px_rgba(0,0,0,0.40),0_4px_8px_rgba(0,0,0,0.24)]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 duration-200",

          variant === "default" && "w-full max-w-[calc(100%-2rem)] sm:max-w-2xl p-6 rounded-[var(--r-xl)]",
          variant === "glass" && "w-full max-w-[calc(100%-2rem)] sm:max-w-lg p-6 rounded-[var(--r-xl)] backdrop-blur-md",
          variant === "small" && "w-full max-w-sm p-4 rounded-[var(--r-lg)]",
          variant === "folder" && "w-96 max-w-full p-6 rounded-[var(--r-xl)]",
          variant === "modal" && "w-112 max-w-[calc(100vw-2rem)] max-h-[85vh] p-0 overflow-hidden rounded-[var(--r-xl)] flex flex-col",
          variant === "floating" && "bottom-1/3 left-1/2 -translate-x-1/2 translate-y-0 w-75 max-w-[95%] h-auto max-h-[60vh] rounded-[var(--r-lg)] overflow-hidden flex flex-col",
          variant === "full" && "fixed inset-0 w-screen h-screen rounded-none p-6",

          className
        )}
        {...props}
      >
        {children}

        {showCloseButton && (
          <DialogPrimitive.Close
            className="absolute top-4 right-4 size-6 rounded-[var(--r-xs)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay-10)] transition flex items-center justify-center cursor-pointer outline-none"
          >
            <Icon name="close" size={16} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

// Header
function DialogHeader({ className, ...props }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-left", className)}
      {...props}
    />
  );
}

// Footer
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex justify-end gap-2", className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">Close</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

// Title
function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg font-semibold text-[var(--text-primary)] tracking-tight font-sans", className)}
      {...props}
    />
  );
}

// Description
function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-[var(--text-tertiary)] leading-relaxed", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};