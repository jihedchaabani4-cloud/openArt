"use client"

import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/ui/input"

export function StudioNavbarCenter({
    searchExpanded,
    searchInputRef,
    handleCloseSearch,
    handleOpenSearch,
    filters,
    setFilter
}) {
    return (
        <div className={cn(
            "min-w-0 flex items-center px-2 sm:px-4 justify-center gap-2 relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            searchExpanded ? "flex-[1_1_auto]" : "flex-[1_1_38%]"
        )}>
            <div className="flex items-center gap-4 w-full min-w-0 relative">
                <Input
                    ref={searchInputRef}
                    variant="search"
                    googleIcon="search"
                    placeholder="Rechercher des médias..."
                    onClear={filters.prompt ? () => { setFilter('prompt', ''); handleCloseSearch?.(); } : undefined}
                    type="search"
                    value={filters.prompt || ""}
                    onChange={(e) => setFilter('prompt', e.target.value)}
                    onBlur={() => !filters.prompt && handleCloseSearch?.()}
                    onFocus={handleOpenSearch}
                />
            </div>
        </div>
    )
}
