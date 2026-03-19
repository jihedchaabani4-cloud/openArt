"use client"

import * as React from "react"
import { ChevronLeft, Image as ImageIcon, Video, Music, Heart, ChevronDown, LayoutGrid, Settings, Plus, Clock } from "lucide-react"
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
import { useProjectStore } from "@/store/useProjectStore"
import { useGenerationsStudioStore } from "@/store/useGenerationsStudioStore"
import { WorkspaceSettingsDialog } from "../dialogs/WorkspaceSettingsDialog"

export function StudioNavbar() {
    const { 
        projects, fetchProjects, createProject,
        sessions: projectSessions, fetchSessions, createSession
    } = useProjectStore()

    const { 
        projectId: activeProjectId, init: initStudio,
        activeSessionId, setActiveSessionId,
        activeFilter, setActiveFilter,
        studioMode, setStudioMode 
    } = useGenerationsStudioStore()

    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [newProjectName, setNewProjectName] = React.useState("")
    const [newSessionName, setNewSessionName] = React.useState("")
    const [isCreateSessionOpen, setIsCreateSessionOpen] = React.useState(false)

    React.useEffect(() => {
        fetchProjects()
    }, [fetchProjects])

    React.useEffect(() => {
        if (activeProjectId) {
            fetchSessions(activeProjectId)
        }
    }, [activeProjectId, fetchSessions])

    const activeProject = projects.find(p => p.project_id === activeProjectId)
    const selectedProjectName = activeProject?.project_name || "Select Project"
    const selectedSessionName = projectSessions.find(s => s.session_id === activeSessionId)?.session_name || "Select Session"

    const handleCreateProject = async () => {
        if (newProjectName.trim()) {
            const newProject = await createProject({ project_name: newProjectName.trim() })
            if (newProject) {
                initStudio(newProject.project_id)
            }
            setNewProjectName("")
            setIsCreateDialogOpen(false)
        }
    }

    const handleCreateSession = async () => {
        if (!activeProjectId) return

        // 🛡️ Security Check: If the latest session is empty, just use it
        const latestSession = projectSessions[0]
        const isEmpty = latestSession && !latestSession.thumbnail

        if (isEmpty) {
            setActiveSessionId(latestSession.session_id)
            setNewSessionName("")
            setIsCreateSessionOpen(false)
            return
        }

        if (newSessionName.trim()) {
            const newSession = await createSession({
                session_name: newSessionName.trim(),
                project_id: activeProjectId
            })
            if (newSession) {
                setActiveSessionId(newSession.session_id)
            }
            setNewSessionName("")
            setIsCreateSessionOpen(false)
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
                            <p className="text-sm font-normal text-white truncate max-w-[150px]">{selectedProjectName}</p>
                            <ChevronDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-[#131517] border-white/10 text-white rounded-xl p-1.5 shadow-2xl z-100">
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-white/30 px-3 py-2 font-normal">Select Project</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5 mx-1.5" />
                        <div className="py-1 max-h-[300px] overflow-y-auto">
                            {projects.map((p) => (
                                <DropdownMenuItem 
                                    key={p.project_id}
                                    onClick={() => initStudio(p.project_id)}
                                    className={cn(
                                        "flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors focus:bg-white/5 focus:text-white",
                                        activeProjectId === p.project_id ? "bg-white/5 text-white" : "text-white/60"
                                    )}
                                >
                                    <span className="text-sm font-normal">{p.project_name}</span>
                                    {activeProjectId === p.project_id && <div className="size-1.5 rounded-full bg-[#D4FF00]" />}
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
                                    <span className="text-sm font-normal">Create New Project</span>
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="bg-[#131517] border-white/10 text-white rounded-2xl sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="text-lg font-normal uppercase tracking-widest text-white/80">
                                        New Project
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="py-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-white/30 px-1">Project Name</label>
                                        <Input
                                            value={newProjectName}
                                            onChange={(e) => setNewProjectName(e.target.value)}
                                            placeholder="Enter name..."
                                            className="h-12 bg-white/5 border-white/10 rounded-xl focus:ring-[#D4FF00] focus:border-[#D4FF00] text-white placeholder:text-white/20"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateProject()
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
                                        onClick={handleCreateProject}
                                        disabled={!newProjectName.trim()}
                                        className="flex-2 h-12 rounded-xl shadow-[0_0_20px_rgba(212,255,0,0.15)]"
                                    >
                                        Create Project
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                    </DropdownMenuContent>
                </DropdownMenu>


                <div className="h-4 w-px bg-white/10 mx-1" />

                {/* Projects & New Project Area */}
                <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 pr-1">
                    <a 
                        href="/project"
                        className="flex h-7 items-center justify-center gap-2 rounded-full px-4 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Projects
                    </a>
                    <button 
                        type="button" 
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="flex h-7 items-center justify-center gap-2 rounded-full bg-[#D4FF00] px-4 text-xs font-semibold text-black transition hover:bg-[#c4eb00] group shadow-[0_0_15px_rgba(212,255,0,0.1)]"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New project</span>
                    </button>
                </div>

            </div>

            {/* Right side placeholder or actions if needed */}
            <div className="flex items-center gap-4">
                {/* Could add user profile or share button here */}
            </div>
        </div>
    )
}
