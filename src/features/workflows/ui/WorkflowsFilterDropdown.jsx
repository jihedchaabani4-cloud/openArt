"use client"

import { ListFilter, CheckSquare, Square, Circle, CircleCheck } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import {
  DropdownShell,
  DropdownSection,
  DropdownFooter,
  DropdownStat,
  DropdownReset,
} from "@/shared/ui/DropdownShell"
import { useWorkflowsStore } from "../model/useWorkflowsStore"

function CheckboxRow({ label, checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between py-2 text-white hover:bg-white/5 px-2 rounded-lg transition-colors"
    >
      <span className="text-sm font-medium">{label}</span>
      {checked ? (
        <CheckSquare className="size-5 text-white" />
      ) : (
        <Square className="size-5 text-white/50" />
      )}
    </button>
  )
}

function RadioRow({ label, checked, onChange }) {
  return (
    <button
      onClick={() => !checked && onChange()}
      className="w-full flex items-center justify-between py-2 text-white hover:bg-white/5 px-2 rounded-lg transition-colors"
    >
      <span className="text-sm font-medium">{label}</span>
      {checked ? (
        <CircleCheck className="size-5 text-white fill-white/10" />
      ) : (
        <Circle className="size-5 text-white/50" />
      )}
    </button>
  )
}

/**
 * [FSD Layer: features/workflows]
 * A sleek, modern filter dropdown for the studio Navbar.
 */
export function WorkflowsFilterDropdown({ filteredCount = 0, total = 0 }) {
  const { filters, setFilter, toggleArrayFilter, clearFilters } = useWorkflowsStore()

  // Calculate active filters to show a notification badge
  const activeCount =
    (filters.showGenerated ? 1 : 0) +
    (filters.showImported ? 1 : 0) +
    (filters.liked ? 1 : 0) +
    (filters.types.length) +
    (filters.sort !== 'newest' ? 1 : 0) +
    (filters.prompt ? 1 : 0)

  return (
    <DropdownShell
      trigger={<ListFilter className="size-5" />}
      isActive={activeCount > 0}
      panelWidth="w-64"
    >
      {/* 1. Sorting */}
      <DropdownSection label="Trier par" className="mb-4 mt-1 border-b border-white/5 pb-4">
        <RadioRow
          label="Le plus récent"
          checked={filters.sort === 'newest'}
          onChange={() => setFilter("sort", "newest")}
        />
        <RadioRow
          label="Le plus ancien"
          checked={filters.sort === 'oldest'}
          onChange={() => setFilter("sort", "oldest")}
        />
      </DropdownSection>

      {/* 2. Type Selection */}
      <DropdownSection label="Type" className="mb-4 border-b border-white/5 pb-4">
        <CheckboxRow
          label="Images"
          checked={filters.types.includes("image")}
          onChange={() => toggleArrayFilter("types", "image")}
        />
        <CheckboxRow
          label="Vidéos"
          checked={filters.types.includes("video")}
          onChange={() => toggleArrayFilter("types", "video")}
        />
      </DropdownSection>

      {/* 3. Source & Favorites */}
      <DropdownSection label="Création" className="mb-2">
        <CheckboxRow
          label="Généré"
          checked={filters.showGenerated}
          onChange={() => setFilter("showGenerated", !filters.showGenerated)}
        />
        <CheckboxRow
          label="Importé"
          checked={filters.showImported}
          onChange={() => setFilter("showImported", !filters.showImported)}
        />
        <CheckboxRow
          label="Favoris"
          checked={filters.liked}
          onChange={() => setFilter("liked", !filters.liked)}
        />
      </DropdownSection>

      {/* 4. Footer & Stats */}
      <DropdownFooter className="flex items-center justify-between pt-2">
        <DropdownStat label="Filtré" count={filteredCount} />
        <DropdownReset onClick={clearFilters} disabled={activeCount === 0} />
      </DropdownFooter>
    </DropdownShell>
  )
}

// ── Alias for compatibility ──────────────────────────────────────────────────
export const GenerationsFilterDropdown = WorkflowsFilterDropdown;
