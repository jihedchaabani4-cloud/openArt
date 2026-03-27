"use client"

import * as React from "react"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { useGenerationsStore } from "../model/useGenerationsStore"

/**
 * FilterTag component with an optional close icon
 */
function FilterTag({ label, onRemove, icon: Icon, isDropdown }) {
    return (
        <button
            type="button"
            onClick={onRemove}
            className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all text-[13px] font-medium whitespace-nowrap border border-white/5",
                isDropdown && "hover:border-white/20"
            )}
        >
            {label}
            {isDropdown ? (
                <ChevronDown className="size-3.5 text-white/50" />
            ) : onRemove ? (
                <X className="size-3.5 text-white/50 hover:text-white" />
            ) : null}
            {Icon && <Icon className="size-3.5 text-white/50" />}
        </button>
    )
}

export function ActiveFilterTags() {
    const { filters, setFilter, toggleArrayFilter } = useGenerationsStore()

    // ── Check if any "real" filter is active ──
    const hasActiveFilters = 
        filters.types.length > 0 || 
        filters.showGenerated || 
        filters.showImported || 
        filters.liked || 
        filters.prompt?.trim().length > 0

    if (!hasActiveFilters) return null

    // ── Generate Tag List ──
    const tags = []

    // 1. Sort Tag (Shown only if other filters are active)
    tags.push({
        id: 'sort',
        label: filters.sort === 'newest' ? 'Le plus récent' : 'Le plus ancien',
        isDropdown: true,
        onRemove: () => {
            // In the user's screenshot this opens a menu. 
            // For now, we'll just toggle it as a simple action or leave it be.
            setFilter('sort', filters.sort === 'newest' ? 'oldest' : 'newest')
        }
    })

    // 2. Types
    if (filters.types.includes('image')) {
        tags.push({ id: 'type-image', label: 'Images', onRemove: () => toggleArrayFilter('types', 'image') })
    }
    if (filters.types.includes('video')) {
        tags.push({ id: 'type-video', label: 'Vidéos', onRemove: () => toggleArrayFilter('types', 'video') })
    }

    // 3. Source
    if (filters.showGenerated) {
        tags.push({ id: 'src-gen', label: 'Généré', onRemove: () => setFilter('showGenerated', false) })
    }
    if (filters.showImported) {
        tags.push({ id: 'src-imp', label: 'Importé', onRemove: () => setFilter('showImported', false) })
    }

    // 4. Favorites
    if (filters.liked) {
        tags.push({ id: 'fav', label: 'Favoris', onRemove: () => setFilter('liked', false) })
    }

    // 5. Prompt (Optional search tag)
    if (filters.prompt?.trim()) {
        tags.push({ 
            id: 'prompt', 
            label: `Search: ${filters.prompt}`, 
            onRemove: () => setFilter('prompt', '') 
        })
    }

    if (tags.length === 0) return null

    return (
        <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
            {tags.map(tag => (
                <FilterTag 
                    key={tag.id}
                    label={tag.label}
                    onRemove={tag.onRemove}
                    isDropdown={tag.isDropdown}
                />
            ))}
        </div>
    )
}
