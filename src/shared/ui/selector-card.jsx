"use client";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

/**
 * SelectorCard
 *
 * A reusable visual tile selector component for character traits and options.
 *
 * @param {object} props
 * @param {Array<{ label: string, value: any, mediaLink?: string }>} [props.items=[]]
 * @param {any} props.value - Currently selected value
 * @param {function} props.onChange - Selection change callback
 * @param {string} [props.className] - CSS class overrides
 */
export function SelectorCard({ items = [], value, onChange, className }) {
  return (
    <div className={cn("flex flex-wrap gap-2 w-full", className)}>
      {items.map((item) => {
        const isSelected = item.value === value;
        return (
          <CardItem
            key={String(item.value)}
            label={item.label}
            image={item.mediaLink}
            isSelected={isSelected}
            onClick={() => onChange?.(item.value)}
          />
        );
      })}
    </div>
  );
}

function CardItem({ label, image, isSelected, onClick }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="tile"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-2 transition-all duration-300 p-0 h-auto items-start text-left"
      )}
    >
      <div
        className={cn(
          "relative w-[135px] h-[135px] rounded-lg overflow-hidden transition-all duration-300",
          isSelected && "outline outline-2 outline-white"
        )}
      >
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
        <span
          className={cn(
            "text-[11px] font-bold tracking-wide uppercase transition-colors duration-300 text-white"
          )}
        >
          {label}
        </span>
      )}
    </Button>
  );
}

export default SelectorCard;
