"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/shared/ui/dialog"

export function DeleteGenerationDialog({ onConfirm, children, itemName = "generation" }) {
    const [open, setOpen] = React.useState(false)

    const handleConfirm = () => {
        onConfirm()
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent 
                className="bg-[#131517] border-[#1C1F23] text-white rounded-2xl max-w-md w-[calc(100vw-1.5rem)] sm:w-full p-6"
                showCloseButton={false}
            >
                <DialogHeader className="space-y-2 text-left">
                    <DialogTitle className="text-xl font-bold">
                        Delete this {itemName}?
                    </DialogTitle>
                    <DialogDescription className="text-white/40 text-[14px] leading-relaxed">
                        This action cannot be undone. The {itemName} will be permanently removed from your workspace.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="mt-6 flex gap-3 justify-end">
                    <DialogClose asChild>
                        <button 
                            type="reset"
                            className="h-11 px-7 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-[14px] transition-colors"
                        >
                            No, keep it
                        </button>
                    </DialogClose>
                    <button 
                        type="button"
                        onClick={handleConfirm}
                        className="h-11 px-7 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold text-[14px] transition-colors"
                    >
                        Yes, delete
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
