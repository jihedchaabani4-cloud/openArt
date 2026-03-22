"use client"

import { ListFilter } from "lucide-react"
import {
  DropdownShell,
  DropdownSection,
  DropdownSegmented,
  DropdownChips,
  DropdownFooter,
  DropdownStat,
  DropdownReset,
  DropdownClearAction,
} from "@/shared/ui/DropdownShell"
import { useGenerationsStore } from "../model/useGenerationsStore"

/**
 * [FSD Layer: features/generations]
 * A sleek, modern filter dropdown for the studio Navbar.
 */
export function GenerationsFilterDropdown({ availableModels = [], filteredCount = 0, total = 0 }) {
  const { filters, toggleArrayFilter, setFilter, clearFilters } = useGenerationsStore()

  // Calculate active filters to show a notification badge
  const activeCount =
    filters.models.length +
    filters.types.length +
    filters.aspectRatios.length +
    (filters.sort !== 'newest' ? 1 : 0) +
    (filters.prompt ? 1 : 0) +
    (filters.liked ? 1 : 0)

  const mediaOptions = [
    { value: "all", label: "All" },
    { value: "image", label: "Images" },
    { value: "video", label: "Videos" },
  ]

  const activeMedia = filters.types.length === 0 ? "all" : filters.types[0]

  return (
    <DropdownShell
      trigger={<ListFilter className="size-5" />}
      isActive={activeCount > 0}
      panelWidth="w-80"
    >
      {/* Model Filtering */}
      {availableModels.length > 0 && (
        <DropdownSection
          label="Model"
          action={
            filters.models.length > 0 ? (
              <DropdownClearAction onClick={() => setFilter("models", [])} />
            ) : undefined
          }
        >
          <DropdownChips
            options={availableModels}
            selected={filters.models}
            onToggle={(m) => toggleArrayFilter("models", m)}
            accent="lime"
          />
        </DropdownSection>
      )}

      {/* Media Type */}
      <DropdownSection label="Media Type">
        <DropdownSegmented
          value={activeMedia}
          onChange={(v) => setFilter("types", v === "all" ? [] : [v])}
          options={mediaOptions}
        />
      </DropdownSection>

      {/* Sort Order */}
      <DropdownSection label="Sort Order" className="mb-6">
        <DropdownSegmented
          value={filters.sort}
          onChange={(v) => setFilter("sort", v)}
          options={[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
          ]}
        />
      </DropdownSection>

      {/* Footer Statistics */}
      <DropdownFooter
        left={<DropdownStat count={filteredCount} total={total} />}
        right={
          activeCount > 0 ? <DropdownReset onClick={clearFilters} /> : undefined
        }
      />
    </DropdownShell>
  )
}
