"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStudioStore } from "@/store/useStudioStore"
import { useGenerationsStudioStore } from "@/store/useGenerationsStudioStore"
import { Trash2, Eraser, Edit3, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export function WorkspaceSettingsDialog({ open, onOpenChange }) {
    const { 
        workspaces, activeWorkspaceId, updateWorkspace, 
        deleteWorkspace, emptyWorkspace 
    } = useStudioStore()
    
    const { fetchAssets, fetchGenerations } = useGenerationsStudioStore()

    const workspace = workspaces.find(ws => ws.id === activeWorkspaceId)
    const [name, setName] = React.useState("")
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [isEmptying, setIsEmptying] = React.useState(false)
    const [confirmAction, setConfirmAction] = React.useState(null) // 'delete' or 'empty'

    React.useEffect(() => {
        if (workspace) setName(workspace.name)
    }, [workspace])

    const handleRename = async () => {
        if (name.trim() && name !== workspace.name) {
            await updateWorkspace(activeWorkspaceId, name.trim())
        }
    }

    const handleDelete = async () => {
        const success = await deleteWorkspace(activeWorkspaceId)
        if (success) {
            onOpenChange(false)
            setConfirmAction(null)
        }
    }

    const handleEmpty = async () => {
        const success = await emptyWorkspace(activeWorkspaceId)
        if (success) {
            fetchAssets(activeWorkspaceId)
            fetchGenerations(activeWorkspaceId)
            setConfirmAction(null)
        }
    }

    if (!workspace) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#131517] border-white/10 text-white rounded-2xl sm:max-w-[450px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-bold uppercase tracking-widest text-white/90 flex items-center gap-3">
                        Workspace Settings
                    </DialogTitle>
                    <DialogDescription className="text-white/40 text-sm">
                        Manage your workspace name and data.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-8">
                    {/* Rename Section */}
                    <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold px-1">
                            Workspace Name
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-[#D4FF00] focus:border-[#D4FF00] text-white placeholder:text-white/20"
                            />
                            <Button 
                                variant="studio-neon"
                                onClick={handleRename}
                                disabled={!name.trim() || name === workspace.name}
                                className="h-12 w-12 p-0 rounded-xl shrink-0"
                            >
                                <Edit3 className="size-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Danger Zone */}
                    <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-red-500/60 font-bold px-1 flex items-center gap-2">
                            <AlertTriangle className="size-3" />
                            Danger Zone
                        </label>
                        
                        <div className="grid grid-cols-1 gap-3">
                            {/* Empty Workspace */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-semibold text-white/80">Empty Workspace</p>
                                    <p className="text-[11px] text-white/30">Delete all images and history</p>
                                </div>
                                <Button 
                                    onClick={() => setConfirmAction('empty')}
                                    className="h-10 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold text-[11px] uppercase tracking-wider"
                                >
                                    <Eraser className="size-4 mr-2" />
                                    Empty
                                </Button>
                            </div>

                            {/* Delete Workspace */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-semibold text-white/80">Delete Workspace</p>
                                    <p className="text-[11px] text-white/30">This action is irreversible</p>
                                </div>
                                <Button 
                                    onClick={() => setConfirmAction('delete')}
                                    className="h-10 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 font-bold text-[11px] uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                >
                                    <Trash2 className="size-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Confirmation Overlay */}
                {confirmAction && (
                    <div className="absolute inset-0 z-50 bg-[#131517] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
                        <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                            <AlertTriangle className="size-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Are you absolutely sure?</h3>
                        <p className="text-white/40 text-sm mb-8 leading-relaxed">
                            {confirmAction === 'delete' 
                                ? "This will permanently delete the workspace and all its contents. You cannot undo this."
                                : "This will permanently delete all generations and media assets in this workspace."}
                        </p>
                        <div className="flex gap-3 w-full">
                            <Button 
                                variant="studio-normal" 
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 h-12 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={confirmAction === 'delete' ? handleDelete : handleEmpty}
                                className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold"
                            >
                                Yes, Confirm
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter className="p-6 pt-0">
                    <Button 
                        variant="studio-normal" 
                        onClick={() => onOpenChange(false)}
                        className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 border-white/5 text-white/60"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
