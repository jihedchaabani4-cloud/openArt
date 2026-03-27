"use client"

import { ArrowLeft, Check, X } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export function StudioNavbarLeft({
    searchExpanded,
    isEditingName,
    editedName,
    setEditedName,
    handleSaveEdit,
    handleCancelEdit,
    handleStartEdit,
    selectedProjectName,
}) {
    return (
        <div className={cn(
            // Zedt 'overflow-hidden' bech k tesghar tet9ass w mato5rejch l'barra
            "flex items-center gap-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden",
            // 7attina 'w-0' w na7ina 'shrink-0' w hiya msakra bech bel7a9 twalli 0
            searchExpanded ? "basis-0 w-0 opacity-0 pointer-events-none" : "basis-[30%] shrink-0 opacity-100"
        )}>
            {/* ── Back Button (arrow_back) ── */}
            <a
                href="/project"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/50 hover:bg-white/5 hover:text-white transition-all"
                title="Back to Projects"
            >
                <ArrowLeft className="size-[22px]" />
            </a>

            {/* ── Collection Title (Dynamic Input) ── */}
            <div className="flex items-center gap-2 px-1 min-w-0">
                <input
                    type="text"
                    value={editedName || selectedProjectName || "Untitled Collection"}
                    onChange={(e) => setEditedName(e.target.value)}
                    onFocus={handleStartEdit}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.currentTarget.blur();
                        }
                        if (e.key === "Escape") {
                            handleCancelEdit();
                            e.currentTarget.blur();
                        }
                    }}
                    className={cn(
                        "bg-transparent border-none outline-none px-2 py-1 rounded-md transition-all text-[18px] font-medium text-white/90 hover:bg-white/5 focus:bg-white/5 focus:text-white w-full min-w-[120px]",
                        isEditingName ? "text-white" : "text-white/80"
                    )}
                    aria-label="Collection title"
                    placeholder="Collection sans titre"
                />

                {/* ── Action Buttons (Save / Cancel) ── */}
                {isEditingName && (
                    <div className="flex items-center gap-1.5 shrink-0 animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onMouseDown={(e) => {
                                e.preventDefault(); 
                                handleSaveEdit();
                            }}
                            className="p-1.5  text-white hover:bg-white/30 rounded-xl transition-all flex items-center justify-center"
                            title="Save changes"
                        >
                            <Check className="size-6" strokeWidth={2.5} />
                        </button>

                        <button
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleCancelEdit();
                            }}
                            className="p-1.5 text-white  hover:bg-white/30 rounded-xl transition-all flex items-center justify-center"
                            title="Cancel changes"
                        >
                            <X className="size-6" strokeWidth={2.5} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}