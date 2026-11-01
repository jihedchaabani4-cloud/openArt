"use client"

import * as React from "react"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

// Root
function Dialog(props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

// Trigger
function DialogTrigger(props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

// Portal
function DialogPortal(props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

// Close
function DialogClose(props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

// Overlay (transparent)
function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/65 backdrop-blur-[24px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-300",
        className
      )}
      {...props}
    />
  )
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
          // GLASS (border-none, maximum blur)
          variant === "glass" &&
            `
            z-50 fixed top-[50%] left-[50%]
            translate-x-[-50%] translate-y-[-50%]
            w-full max-w-[calc(100%-2rem)]
            rounded-dialog border-none outline-none
            bg-[rgba(20,21,24,0.72)] backdrop-blur-[100px]
            shadow-[0_32px_80px_-16px_rgba(0,0,0,0.85),0_0_50px_-10px_rgba(0,0,0,0.5)]
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            data-[state=open]:fade-in-0
            data-[state=closed]:fade-out-0
            data-[state=open]:zoom-in-95
            data-[state=closed]:zoom-out-95
          `,

          // FULL SCREEN
          variant === "full" &&
            "fixed inset-0 z-50 w-screen h-screen outline-none bg-[var(--mat-dialog-container-color,var(--background-state-90))] backdrop-blur-[80px]",

          // FLOATING (فوق prompt bar)
          variant === "floating" &&
            `
            fixed z-50
            bottom-[30%] left-1/2
            translate-x-[-50%] translate-y-0 
            w-[300px] max-w-[95%]
            h-auto max-h-[60vh]
            rounded-dialog bg-[var(--mat-dialog-container-color,var(--background-state-90))] backdrop-blur-[80px] shadow-[var(--mat-dialog-container-elevation-shadow)] border border-[var(--mat-sys-outline-variant,rgba(255,255,255,0.08))] overflow-hidden
            flex flex-col
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            data-[state=open]:fade-in-0
            data-[state=closed]:fade-out-0
            data-[state=open]:zoom-in-95
            data-[state=closed]:zoom-out-95
          `,

          // DEFAULT (centered)
          variant === "default" &&
            `
            z-50 bg-[var(--mat-dialog-container-color,var(--background-state-90))]
            fixed top-[50%] left-[50%]
            translate-x-[-50%] translate-y-[-50%]
            w-full max-w-[calc(100%-2rem)]
            sm:max-w-6xl
            rounded-dialog border border-[var(--mat-sys-outline-variant,rgba(255,255,255,0.08))] p-6 shadow-[var(--mat-dialog-container-elevation-shadow)]
            data-[state=open]:animate-in
            data-[state=closed]:animate-out

          `,
          variant === "small" &&
            `
            z-50 bg-[var(--mat-dialog-container-color,var(--background-state-90))]
            fixed top-[50%] left-[50%]
            translate-x-[-50%] translate-y-[-50%]
            w-full max-w-[250px] max-h-[200px]
            rounded-dialog border border-[var(--mat-sys-outline-variant,rgba(255,255,255,0.08))] p-2 shadow-[var(--mat-dialog-container-elevation-shadow)]
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
          `,
          className
        )}
        {...props}
      >
        {children}

        {showCloseButton && (
          <DialogPrimitive.Close
            className="absolute top-4 right-4 text-[var(--mat-sys-on-surface-variant,#8e918f)] hover:text-[var(--mat-sys-on-surface,#e3e3e3)] transition flex items-center justify-center"
          >
            <GoogleIcon iconName="close" className="text-[20px]" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

// Header
function DialogHeader({ className, ...props }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-left", className)}
      {...props}
    />
  )
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
  )
}

// Title
function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg font-medium", className)}
      {...props}
    />
  )
}

// Description
function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
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
}