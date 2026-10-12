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
            "flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] px-2",
            searchExpanded ? "flex-1 w-full" : "flex-none w-full max-w-[420px] sm:max-w-[460px] mx-auto"
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
