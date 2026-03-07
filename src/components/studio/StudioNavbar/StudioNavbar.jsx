"use client"

import * as React from "react"
import { ChevronLeft, Image as ImageIcon, Video, Music, Heart, ChevronDown, LayoutGrid, Settings, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStudioStore } from "@/store/useStudioStore"
import { useCinemaStore } from "@/store/useCinemaStudioStore"
import { WorkspaceSettingsDialog } from "../dialogs/WorkspaceSettingsDialog"

export function StudioNavbar() {
    const { 
        workspaces, fetchWorkspaces, createWorkspace, 
        activeWorkspaceId, setActiveWorkspaceId,
        studioMode, setStudioMode, fetchCharacters
    } = useStudioStore()

    const { activeFilter, setActiveFilter } = useCinemaStore()
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
    const [newWorkspaceName, setNewWorkspaceName] = React.useState("")

    React.useEffect(() => {
        fetchWorkspaces()
    }, [fetchWorkspaces])

    React.useEffect(() => {
        if (activeWorkspaceId) {
            fetchCharacters()
        }
    }, [activeWorkspaceId, fetchCharacters])

    const selectedWorkspace = workspaces.find(ws => ws.id === activeWorkspaceId)?.name || "Select Workspace"

    const handleCreateWorkspace = async () => {
        if (newWorkspaceName.trim()) {
            await createWorkspace(newWorkspaceName.trim())
            setNewWorkspaceName("")
            setIsCreateDialogOpen(false)
        }
    }

    return (
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/20 backdrop-blur-md">
            <div className="w-max flex flex-row items-center gap-4">
                {/* Workspace Select Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button 
                            type="button" 
                            className="flex h-9 items-center justify-center gap-2.5 rounded-full bg-white/5 px-4 py-1 transition hover:bg-white/10 group border border-white/5 outline-none"
                        >
                            <div className="size-5 rounded bg-[#D4FF00] flex items-center justify-center">
                                <LayoutGrid className="size-3 text-black" />
                            </div>
                            <p className="text-sm font-normal text-white truncate max-w-[150px]">{selectedWorkspace}</p>
                            <ChevronDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-[#131517] border-white/10 text-white rounded-xl p-1.5 shadow-2xl">
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-white/30 px-3 py-2 font-normal">Select Workspace</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5 mx-1.5" />
                        <div className="py-1">
                            {workspaces.map((ws) => (
                                <DropdownMenuItem 
                                    key={ws.id}
                                    onClick={() => setActiveWorkspaceId(ws.id)}
                                    className={cn(
                                        "flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors focus:bg-white/5 focus:text-white",
                                        activeWorkspaceId === ws.id ? "bg-white/5 text-white" : "text-white/60"
                                    )}
                                >
                                    <span className="text-sm font-normal">{ws.name}</span>
                                    {activeWorkspaceId === ws.id && <div className="size-1.5 rounded-full bg-[#D4FF00]" />}
                                </DropdownMenuItem>
                            ))}
                        </div>
                        <DropdownMenuSeparator className="bg-white/5 mx-1.5" />
                        
                        {/* Create Workspace Dialog Trigger */}
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-white/40 hover:text-white focus:bg-white/5 focus:text-white"
                                >
                                    <Plus className="size-4" />
                                    <span className="text-sm font-normal">Create New Workspace</span>
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="bg-[#131517] border-white/10 text-white rounded-2xl sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-normal uppercase tracking-widest text-white/80">
                                        New Workspace
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="py-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-white/30 px-1">Workspace Name</label>
                                        <Input
                                            value={newWorkspaceName}
                                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                                            placeholder="Enter name..."
                                            className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-[#D4FF00] focus:border-[#D4FF00] text-white placeholder:text-white/20"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateWorkspace()
                                            }}
                                        />
                                    </div>
                                </div>
                                <DialogFooter className="flex items-center gap-3">
                                    <Button 
                                        variant="studio-normal" 
                                        onClick={() => setIsCreateDialogOpen(false)}
                                        className="flex-1 h-12 rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        variant="studio-neon" 
                                        onClick={handleCreateWorkspace}
                                        disabled={!newWorkspaceName.trim()}
                                        className="flex-[2] h-12 rounded-xl shadow-[0_0_20px_rgba(212,255,0,0.15)]"
                                    >
                                        Create Workspace
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <DropdownMenuItem 
                            onClick={() => setIsSettingsOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-white/40 hover:text-white focus:bg-white/5 focus:text-white"
                        >
                            <Settings className="size-4" />
                            <span className="text-sm font-normal">Workspace Settings</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-4 w-px bg-white/10 mx-1" />

                {/* New Project Button */}
                <button 
                    type="button" 
                    className="flex h-9 items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-1 transition hover:bg-white/10 group"
                >
                    <ChevronLeft className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                    <p className="text-sm font-normal text-white">New project</p>
                </button>

                {/* Main Content Type Tabs */}
                <div className="flex items-center bg-white/2 border border-white/5 rounded-xl p-0.5 gap-1">
                    <button
                        onClick={() => setStudioMode("image")}
                        className={cn(
                            "relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-normal transition-all",
                            studioMode === "image" 
                                ? "bg-white/5 text-white border border-white/10 shadow-sm" 
                                : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <ImageIcon className="w-4 h-4" />
                        <span>Image</span>
                    </button>
                    <button
                        onClick={() => setStudioMode("cinema")}
                        className={cn(
                            "relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-normal transition-all",
                            studioMode === "cinema" 
                                ? "bg-white/5 text-white border border-white/10 shadow-sm" 
                                : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <Video className="w-4 h-4" />
                        <span>Video</span>
                    </button>
                    <button
                        onClick={() => setStudioMode("audio")}
                        className={cn(
                            "relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-normal transition-all",
                            studioMode === "audio" 
                                ? "bg-white/5 text-white border border-white/10 shadow-sm" 
                                : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <Music className="w-4 h-4" />
                        <span>Audio</span>
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center bg-white/2 border border-white/5 rounded-xl p-0.5 gap-1">
                    <button
                        onClick={() => setActiveFilter("all")}
                        className={cn(
                            "relative px-4 py-1.5 rounded-lg text-xs font-normal transition-all",
                            activeFilter === "all" 
                                ? "bg-white/5 text-white border border-white/10 shadow-sm" 
                                : "text-white/40 hover:text-white/60"
                        )}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setActiveFilter("liked")}
                        className={cn(
                            "relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-normal transition-all",
                            activeFilter === "liked" 
                                ? "bg-white/5 text-white border border-white/10 shadow-sm" 
                                : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <Heart className={cn("w-3.5 h-3.5", activeFilter === "liked" ? "fill-white" : "")} />
                        <span>Liked</span>
                    </button>
                </div>
            </div>

            {/* Right side placeholder or actions if needed */}
            <div className="flex items-center gap-4">
                {/* Could add user profile or share button here */}
            </div>

            <WorkspaceSettingsDialog 
                open={isSettingsOpen} 
                onOpenChange={setIsSettingsOpen} 
            />
        </div>
    )
}
