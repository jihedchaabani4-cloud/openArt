"use client"

import { Check, X, ChevronDown, Layers } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import * as React from "react"

export function StudioNavbarLeft({
    searchExpanded,
    isEditingName,
    editedName,
    setEditedName,
    handleSaveEdit,
    handleCancelEdit,
    handleStartEdit,
    selectedProjectName,
    projectSessions = [],
    activeSessionId,
    setActiveSessionId,
    selectedSessionName,
    setIsCreateSessionOpen,
}) {
    const [sessionsOpen, setSessionsOpen] = React.useState(false)
    const dropdownRef = React.useRef(null)

    // Close dropdown on outside click
    React.useEffect(() => {
        if (!sessionsOpen) return
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setSessionsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [sessionsOpen])

    return (
        <div className={cn(
            "flex items-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden",
            searchExpanded ? "basis-0 w-0 opacity-0 pointer-events-none" : "basis-[30%] shrink-0 opacity-100"
        )}>
            {/* ── Project Title ── */}
            <div className="flex items-center gap-2 min-w-0">
                <input
                    type="text"
                    value={editedName || selectedProjectName || "Untitled"}
                    onChange={(e) => setEditedName(e.target.value)}
                    onFocus={handleStartEdit}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur()
                        if (e.key === "Escape") { handleCancelEdit(); e.currentTarget.blur() }
                    }}
                    className={cn(
                        "bg-transparent border-none outline-none px-2 py-1 rounded-md transition-all text-md font-medium hover:bg-white/5 focus:bg-white/5 focus:text-white w-full min-w-[80px] max-w-[160px]",
                        isEditingName ? "text-white" : "text-white"
                    )}
                    aria-label="Project title"
                />

                {isEditingName && (
                    <div className="flex items-center gap-1.5 shrink-0 animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onMouseDown={(e) => { e.preventDefault(); handleSaveEdit() }}
                            className="p-1.5 text-white hover:bg-white/30 rounded-xl transition-all flex items-center justify-center"
                            title="Save"
                        >
                            <Check className="size-5" strokeWidth={2.5} />
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); handleCancelEdit() }}
                            className="p-1.5 text-white hover:bg-white/30 rounded-xl transition-all flex items-center justify-center"
                            title="Cancel"
                        >
                            <X className="size-5" strokeWidth={2.5} />
                        </button>
                    </div>
                )}
            </div>

        </div>
    )
}