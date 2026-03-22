"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"

export function CreateSessionDialog({ 
    isOpen, 
    onOpenChange, 
    onCreate, 
    isCreating 
}) {
    const [name, setName] = React.useState("")

    const handleCreate = () => {
        if (name.trim()) {
            onCreate(name.trim())
            setName("")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-black/60 backdrop-blur-xl border-white/10 text-white rounded-xl sm:max-w-[420px] shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-normal uppercase tracking-widest text-white/80">
                        New Session
                    </DialogTitle>
                </DialogHeader>
                <div className="py-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/30 px-1">
                            Session Name
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter name (e.g. Character Study)..."
                            className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-white/20"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
                        />
                    </div>
                </div>
                <DialogFooter className="flex items-center gap-3">
                    <Button
                        variant="studio-normal"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-12 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="studio-neon"
                        onClick={handleCreate}
                        disabled={!name.trim() || isCreating}
                        className="flex-2 h-12 rounded-xl"
                    >
                        {isCreating ? "Creating..." : "Create Session"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
