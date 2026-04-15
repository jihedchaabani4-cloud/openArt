"use client"

import React from "react"
import { cn } from "@/shared/lib/utils"

/**
 * SelectorCard
 *
 * A reusable grid-based visual selector component.
 *
 * @param {Object[]} items       - Array of { label, value, mediaLink }.
 * @param {*}        value       - Currently selected value.
 * @param {Function} onChange    - Called with `item.value` on selection.
 * @param {number}   columns     - Number of grid columns (default 2).
 * @param {string}   className   - Optional additional classes for the grid.
 */
export function SelectorCard({ items = [], value, onChange, className }) {

  return (
    <div className={cn("flex flex-wrap gap-2 w-full", className)}>
      {items.map((item) => {
        const isSelected = item.value === value
        return (
          <CardItem
            key={String(item.value)}
            label={item.label}
            image={item.mediaLink}
            isSelected={isSelected}
            onClick={() => onChange?.(item.value)}
          />
        )
      })}
    </div>
  )
}

function CardItem({ label, image, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-2 transition-all duration-300"
      )}
    >
      <div className={cn(
        "relative w-[135px] h-[135px] rounded-xl overflow-hidden transition-all duration-300",
        isSelected && "outline outline-2 outline-white"       )}>
        {image && (
          <img 
            src={image} 
            alt={label} 
            className={cn(
              "w-full h-full object-cover transition-transform duration-500"
            )}
          />
        )}
      </div>
      
      {label && (
        <span className={cn(
          "text-[11px] font-bold tracking-wide uppercase transition-colors duration-300 text-white"
        )}>
          {label}
        </span>
      )}
    </button>
  )
}
