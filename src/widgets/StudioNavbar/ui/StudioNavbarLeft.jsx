"use client"

import * as React from "react"
import { ChevronLeft, ChevronDown, Pencil, Check, X, Layers, Plus } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

export function StudioNavbarLeft({
    searchExpanded,
    activeProjectId,
    isEditingName,
    editInputRef,
    editedName,
    setEditedName,
    handleSaveEdit,
    handleCancelEdit,
    handleStartEdit,
    selectedProjectName,
    projectSessions,
    activeSessionId,
    setActiveSessionId,
    selectedSessionName,
    setIsCreateSessionOpen
}) {
    return (
        <div className={cn(
            "shrink-0 flex items-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            searchExpanded ? "basis-[0%] opacity-0 pointer-events-none" : "basis-[30%] opacity-100"
        )}>
            {/* Back Button */}
            <a
                href="/project"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
                title="Back to Projects"
            >
                <ChevronLeft className="size-4" />
            </a>

            <div className="w-px h-4 bg-white/10 shrink-0" />

            {/* Project name / edit */}
            {activeProjectId && (
                <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                    {isEditingName ? (
                        <>
                            <Input
                                ref={editInputRef}
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter")  handleSaveEdit()
                                    if (e.key === "Escape") handleCancelEdit()
                                }}
                                className="h-8 bg-white/5 border border-[#D4FF00]/40 rounded-xl px-2.5 text-sm text-white outline-none w-[140px] focus:border-[#D4FF00]/70"
                            />
                            <Button
                                onClick={handleSaveEdit}
                                className="size-7 rounded-xl bg-[#D4FF00]/10 flex items-center justify-center text-[#D4FF00] hover:bg-[#D4FF00]/20 transition-all"
                            >
                                <Check className="size-3.5" />
                            </Button>
                            <Button
                                onClick={handleCancelEdit}
                                className="size-7 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 transition-all"
                            >
                                <X className="size-3.5" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleStartEdit}
                            className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors group/edit shrink-0"
                            title="Edit project name"
                        >
                            <span className="text-sm truncate max-w-[100px]">{selectedProjectName}</span>
                            <Pencil className="size-3 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                        </Button>
                    )}
                </div>
            )}

            {/* Session dropdown */}
            {activeProjectId && (
                <>
                    <div className="h-4 bg-white/10 shrink-0" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                            >
                                <Layers className="size-3.5" />
                                <span className="text-sm truncate max-w-[90px]">
                                    {selectedSessionName || "Select Session"}
                                </span>
                                <ChevronDown className="size-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent className="w-56 bg-black/40 backdrop-blur-xl border-white/10 text-white rounded-xl p-1.5 shadow-2xl z-50">
                            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-white/30 px-3 py-2 font-normal">
                                Sessions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5 mx-1.5" />

                            <div className="py-1 max-h-[260px] overflow-y-auto">
                                {projectSessions.length === 0 ? (
                                    <div className="px-3 py-4 text-center">
                                        <p className="text-xs text-white/30">No sessions found</p>
                                    </div>
                                ) : (
                                    projectSessions.map((s) => (
                                        <DropdownMenuItem
                                            key={s.session_id}
                                            onClick={() => setActiveSessionId(s.session_id)}
                                            className={cn(
                                                "flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors focus:bg-white/5 focus:text-white",
                                                activeSessionId === s.session_id
                                                    ? "bg-white/5 text-white"
                                                    : "text-white/60"
                                            )}
                                        >
                                            <span className="text-sm truncate">{s.session_name}</span>
                                            {activeSessionId === s.session_id && (
                                                <div className="size-1.5 rounded-full bg-[#D4FF00]" />
                                            )}
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </div>

                            <DropdownMenuSeparator className="bg-white/5 mx-1.5" />
                            <DropdownMenuItem
                                onSelect={(e) => { e.preventDefault(); setIsCreateSessionOpen(true) }}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-[#D4FF00]/60 hover:text-[#D4FF00] focus:bg-[#D4FF00]/5 focus:text-[#D4FF00]"
                            >
                                <Plus className="size-4" />
                                <span className="text-sm">New Session</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            )}
        </div>
    )
}
