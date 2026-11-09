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
            "flex items-center justify-center transition-[max-width,width] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] px-1 sm:px-2 z-30 absolute left-1/2 -translate-x-1/2 w-full mx-auto h-full max-h-full",
            searchExpanded
                ? "max-w-full"
                : "max-w-[360px] sm:max-w-[420px] md:max-w-[460px]"
        )}>
            <div className="flex items-center gap-4 w-full min-w-0 h-full max-h-full relative">
                <Input
                    ref={searchInputRef}
                    variant="search"
                    googleIcon="search"
                    placeholder=""
                    containerClassName="h-full max-h-full justify-center flex"
                    className="max-h-full"
                    onClear={searchExpanded ? () => { setFilter('prompt', ''); handleCloseSearch?.(); } : undefined}
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
