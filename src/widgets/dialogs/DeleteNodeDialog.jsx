"use client"

import * as React from "react"
import { Trash2, AlertTriangle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"

export function DeleteNodeDialog({ onConfirm, children, itemName = "influencer", isLastNode = false }) {
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
                        {isLastNode ? "Delete AI Influencer?" : `Delete ${itemName}?`}
                    </DialogTitle>
                    <DialogDescription className="text-white/40 text-[14px] leading-relaxed">
                        {isLastNode 
                            ? "This is the last generation for this AI Influencer. Deleting it will permanently remove the AI Influencer and all its data."
                            : `The ${itemName} will be deleted forever.`
                        }
                    </DialogDescription>
                </DialogHeader>
                
                <div className="mt-6 flex gap-3 justify-end">
                    <DialogClose asChild>
                        <button 
                            type="reset"
                            className="h-11 px-7 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-[14px] transition-colors"
                        >
                            No, keep them
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
