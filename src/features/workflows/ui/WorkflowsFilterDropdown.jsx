"use client"

import { ListFilter, CheckSquare, Square, Circle, CircleCheck } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { useWorkflowsStore } from "../model/useWorkflowsStore"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/shared/ui/dropdown-menu"

function CheckboxRow({ label, checked, onChange }) {
  return (
    <DropdownMenuItem onClick={(e) => { e.preventDefault(); onChange(!checked); }} className="justify-between">
      <span>{label}</span>
      {checked ? (
        <CheckSquare className="size-4 text-white" />
      ) : (
        <Square className="size-4 text-white/30" />
      )}
    </DropdownMenuItem>
  )
}

function RadioRow({ label, checked, onChange }) {
  return (
    <DropdownMenuItem onClick={(e) => { e.preventDefault(); !checked && onChange(); }} className="justify-between">
      <span>{label}</span>
      {checked ? (
        <CircleCheck className="size-4 text-white fill-white/10" />
      ) : (
        <Circle className="size-4 text-white/30" />
      )}
    </DropdownMenuItem>
  )
}

/**
 * [FSD Layer: features/workflows]
 * A sleek, modern filter dropdown for the studio Navbar.
 */
export function WorkflowsFilterDropdown({ filteredCount = 0, total = 0 }) {
  const { filters, setFilter, toggleArrayFilter, clearFilters, activeStudioTab } = useWorkflowsStore()
  const isElements = activeStudioTab === "elements"

  // Calculate active filters to show a notification badge based on mode
  const activeCount = isElements
    ? (filters.sort !== 'newest' ? 1 : 0) + (filters.gender?.length || 0) + (filters.renderingStyles?.length || 0) + (filters.elementTypes?.length || 0) + (filters.liked ? 1 : 0)
    : (filters.showGenerated ? 1 : 0) +
      (filters.showImported ? 1 : 0) +
      (filters.liked ? 1 : 0) +
      (filters.types?.length || 0) +
      (filters.sort !== 'newest' ? 1 : 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="studio-ghost" size="icon" className={cn("relative", activeCount > 0 && "text-white bg-white/10")}>
          <ListFilter className="size-4.5" />
          {activeCount > 0 && (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-white" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold text-white/40 uppercase tracking-widest">
          Trier par
        </DropdownMenuLabel>
        <RadioRow label="Le plus récent" checked={filters.sort === 'newest'} onChange={() => setFilter("sort", "newest")} />
        <RadioRow label="Le plus ancien" checked={filters.sort === 'oldest'} onChange={() => setFilter("sort", "oldest")} />
        
        <DropdownMenuSeparator className="my-1.5 bg-white/5" />

        {isElements ? (
          <>
            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold text-white/40 uppercase tracking-widest">
              Type d'Élément
            </DropdownMenuLabel>
            <CheckboxRow label="Personnage" checked={filters.elementTypes?.includes("character")} onChange={() => toggleArrayFilter("elementTypes", "character")} />
            <CheckboxRow label="Produit" checked={filters.elementTypes?.includes("product")} onChange={() => toggleArrayFilter("elementTypes", "product")} />
            <CheckboxRow label="Lieu" checked={filters.elementTypes?.includes("location")} onChange={() => toggleArrayFilter("elementTypes", "location")} />
            
            <DropdownMenuSeparator className="my-1.5 bg-white/5" />

            {filters.elementTypes?.includes("character") && (
              <>
                <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                  Genre
                </DropdownMenuLabel>
                <CheckboxRow label="Homme" checked={filters.gender?.includes("male")} onChange={() => toggleArrayFilter("gender", "male")} />
                <CheckboxRow label="Femme" checked={filters.gender?.includes("female")} onChange={() => toggleArrayFilter("gender", "female")} />

                <DropdownMenuSeparator className="my-1.5 bg-white/5" />

                <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                  Style de rendu
                </DropdownMenuLabel>
                <CheckboxRow label="Hyper-réalisme" checked={filters.renderingStyles?.includes("hyper-realistic")} onChange={() => toggleArrayFilter("renderingStyles", "hyper-realistic")} />
                <CheckboxRow label="Anime" checked={filters.renderingStyles?.includes("anime")} onChange={() => toggleArrayFilter("renderingStyles", "anime")} />
                <CheckboxRow label="Cartoon" checked={filters.renderingStyles?.includes("cartoon")} onChange={() => toggleArrayFilter("renderingStyles", "cartoon")} />
                <CheckboxRow label="2D Illustration" checked={filters.renderingStyles?.includes("2d-illustration")} onChange={() => toggleArrayFilter("renderingStyles", "2d-illustration")} />
                
                <DropdownMenuSeparator className="my-1.5 bg-white/5" />
              </>
            )}
            
            <CheckboxRow label="Favoris" checked={filters.liked} onChange={() => setFilter("liked", !filters.liked)} />
          </>
        ) : (
          <>
            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold text-white/40 uppercase tracking-widest">
              Type
            </DropdownMenuLabel>
            <CheckboxRow label="Images" checked={filters.types?.includes("image")} onChange={() => toggleArrayFilter("types", "image")} />
            <CheckboxRow label="Vidéos" checked={filters.types?.includes("video")} onChange={() => toggleArrayFilter("types", "video")} />

            <DropdownMenuSeparator className="my-1.5 bg-white/5" />

            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-semibold text-white/40 uppercase tracking-widest">
              Création
            </DropdownMenuLabel>
            <CheckboxRow label="Généré" checked={filters.showGenerated} onChange={() => setFilter("showGenerated", !filters.showGenerated)} />
            <CheckboxRow label="Importé" checked={filters.showImported} onChange={() => setFilter("showImported", !filters.showImported)} />
            
            
            <CheckboxRow label="Favoris" checked={filters.liked} onChange={() => setFilter("liked", !filters.liked)} />
          </>
        )}

      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const GenerationsFilterDropdown = WorkflowsFilterDropdown;
