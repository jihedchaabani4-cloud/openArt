"use client"

import * as React from "react"
import { Edit2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

export function RenameCharacterDialog({ currentName, onConfirm, children }) {
    const [name, setName] = React.useState(currentName)
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        if (open) setName(currentName)
    }, [open, currentName])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (name.trim() && name !== currentName) {
            onConfirm(name.trim())
        }
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
                        Rename influencer
                    </DialogTitle>
                    <DialogDescription className="text-white/40 text-[14px]">
                        Give your AI Influencer a new name to better identify them.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    <div className="space-y-2">
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Influencer name..."
                            className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-[#D4FF00]/50 focus:ring-0 text-white placeholder:text-white/20"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <DialogClose asChild>
                            <button 
                                type="button"
                                className="h-11 px-7 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-[14px] transition-colors"
                            >
                                Cancel
                            </button>
                        </DialogClose>
                        <button 
                            type="submit"
                            disabled={!name.trim() || name === currentName}
                            className="h-11 px-7 rounded-xl bg-[#D4FF00] hover:bg-[#D4FF00]/90 text-black font-semibold text-[14px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Name
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
