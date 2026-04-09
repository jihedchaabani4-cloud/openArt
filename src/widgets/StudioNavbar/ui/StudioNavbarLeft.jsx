"use client"

import { ArrowLeft, Check, X, ChevronDown, Layers } from "lucide-react"
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
            "flex items-center gap-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden",
            searchExpanded ? "basis-0 w-0 opacity-0 pointer-events-none" : "basis-[30%] shrink-0 opacity-100"
        )}>
            {/* ── Back Button ── */}
            <a
                href="/projects"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/5 hover:text-white transition-all"
                title="Back to Projects"
            >
                <ArrowLeft className="size-[22px]" />
            </a>

            {/* ── Project Title ── */}
            <div className="flex items-center gap-2 px-1 min-w-0">
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
                        "bg-transparent border-none outline-none px-2 py-1 rounded-md transition-all text-[18px] font-medium hover:bg-white/5 focus:bg-white/5 focus:text-white w-full min-w-[80px] max-w-[160px]",
                        isEditingName ? "text-white" : "text-white/80"
                    )}
                    aria-label="Project title"
                    placeholder="Untitled"
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

            {/* ── Separator ── */}
            <div className="h-5 w-px bg-white/10 shrink-0 mx-1" />

            {/* ── Session Switcher ── */}
            <div className="relative shrink-0" ref={dropdownRef}>
                <button
                    onClick={() => setSessionsOpen(v => !v)}
                    className="flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white/70 hover:text-white transition-all group text-xs font-medium"
                >
                    <Layers className="size-3.5 text-white/40 group-hover:text-white/70 transition-colors" />
                    <span className="max-w-[100px] truncate">
                        {selectedSessionName || "All sessions"}
                    </span>
                    <ChevronDown className={cn(
                        "size-3 text-white/30 transition-transform duration-200",
                        sessionsOpen && "rotate-180"
                    )} />
                </button>

                {sessionsOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-52 bg-[#131517] border border-white/10 rounded-xl shadow-2xl z-[999] overflow-hidden py-1">
                        {/* All sessions option */}
                        <button
                            onClick={() => { setActiveSessionId(null); setSessionsOpen(false) }}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/5 transition-colors",
                                !activeSessionId ? "text-white" : "text-white/50"
                            )}
                        >
                            <span>All sessions</span>
                            {!activeSessionId && <Check className="size-3.5 text-[#D4FF00]" />}
                        </button>

                        {projectSessions.length > 0 && (
                            <div className="h-px bg-white/5 my-1 mx-2" />
                        )}

                        {/* Individual sessions */}
                        {projectSessions.map((s) => (
                            <button
                                key={s.session_id}
                                onClick={() => { setActiveSessionId(s.session_id); setSessionsOpen(false) }}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/5 transition-colors",
                                    activeSessionId === s.session_id ? "text-white" : "text-white/50"
                                )}
                            >
                                <span className="truncate">{s.session_name}</span>
                                {activeSessionId === s.session_id && <Check className="size-3.5 text-[#D4FF00] shrink-0" />}
                            </button>
                        ))}

                        {/* New session button */}
                        <div className="h-px bg-white/5 my-1 mx-2" />
                        <button
                            onClick={() => { setSessionsOpen(false); setIsCreateSessionOpen?.(true) }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <span>+ New session</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}