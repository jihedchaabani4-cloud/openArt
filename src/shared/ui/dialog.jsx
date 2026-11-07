"use client"

import { GoogleIcon } from "@/shared/ui/GoogleIcon";
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
        "fixed inset-0 z-50 bg-black/70 backdrop-blur-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-300",
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
          // GLASS (Controlled translucent glassmorphism)
          variant === "glass" &&
            `
            z-50 fixed top-1/2 left-1/2
            -translate-x-1/2 -translate-y-1/2
            w-full max-w-[calc(100%-2rem)] sm:max-w-lg p-6
            rounded-md border border-white/10 outline-none
            bg-(--background-state-90) backdrop-blur-80 text-white
            shadow-none
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            data-[state=open]:fade-in-0
            data-[state=closed]:fade-out-0
            data-[state=open]:zoom-in-95
            data-[state=closed]:zoom-out-95
          `,

          // FULL SCREEN
          variant === "full" &&
            "fixed inset-0 z-50 w-screen h-screen outline-none bg-(--background-state-90) text-white",

          // FLOATING (above prompt bar)
          variant === "floating" &&
            `
            fixed z-50
            bottom-1/3 left-1/2
            -translate-x-1/2 translate-y-0 
            w-75 max-w-[95%]
            h-auto max-h-[60vh]
            rounded-md bg-(--background-state-90) backdrop-blur-80 text-white shadow-none border border-white/10 overflow-hidden
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
            z-50 bg-(--background-state-90) backdrop-blur-80 text-white
            fixed top-1/2 left-1/2
            -translate-x-1/2 -translate-y-1/2
            w-full max-w-[calc(100%-2rem)]
            sm:max-w-6xl
            rounded-md border border-white/10 p-6 shadow-none
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
          `,
          variant === "small" &&
            `
            z-50 bg-(--background-state-90) backdrop-blur-80 text-white
            fixed top-1/2 left-1/2
            -translate-x-1/2 -translate-y-1/2
            w-full max-w-64 max-h-50
            rounded-md border border-white/10 p-2 shadow-none
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
            className="absolute top-4 right-4 text-cool-slate hover:text-white transition flex items-center justify-center cursor-pointer"
          >
            <GoogleIcon iconName="close" className="text-xl" />
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
      className={cn("text-lg font-semibold text-white tracking-tight", className)}
      {...props}
    />
  )
}

// Description
function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-cool-slate leading-relaxed", className)}
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