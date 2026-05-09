"use client"

import * as React from "react"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/ui/input"
import { WorkflowsFilterDropdown as GenerationsFilterDropdown } from "@/features/workflows/ui/WorkflowsFilterDropdown"
import { useFilteredWorkflows as useFilteredGenerations } from "@/features/workflows/model/useFilteredWorkflows"
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows"

export function StudioNavbarCenter({
    searchExpanded,
    availableModels,
    filteredCount,
    total,
    searchInputRef,
    handleCloseSearch,
    handleOpenSearch,
    filters,
    setFilter
}) {
    return (
        <div className={cn(
            "shrink-0 flex items-center px-4 justify-center gap-2 relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            searchExpanded ? "basis-full" : "basis-[38%]"
        )}>
            <div className="flex items-center gap-4 w-full relative">
                <GenerationsFilterDropdown 
                    availableModels={availableModels}
                    filteredCount={filteredCount}
                    total={total}
                />
                <Input
                    ref={searchInputRef}
                    icon={() => <GoogleIcon iconName="search" className="text-[20px]" />}
                    onClear={searchExpanded ? handleCloseSearch : undefined}
                    clearIcon={() => <GoogleIcon iconName="close" className="text-[20px]" />}
                    type="search"
                    value={filters.prompt}
                    onChange={(e) => setFilter('prompt', e.target.value)}
                    onBlur={() => !filters.prompt && handleCloseSearch()}
                    onFocus={handleOpenSearch}
                />
            </div>
        </div>
    )
}
