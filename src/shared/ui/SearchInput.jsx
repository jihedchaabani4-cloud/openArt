import * as React from "react";
import { Icon } from "./Icon";
import { cn } from "@/shared/lib/utils";

/**
 * SearchInput Primitive — design-system.md §5.1
 * - Height: 36px, gap: 6px, padding: 4px 6px
 * - Background: #1C1E21 (--bg-surface-2)
 * - Border: 1px solid rgba(255,255,255,.10) (--border-default)
 * - Radius: 12px (--r-lg)
 * - Shadow: --sh-input
 * - Leading search icon 16px, trailing clear button
 */
export const SearchInput = React.forwardRef(function SearchInput(
  {
    value,
    onChange,
    onClear,
    placeholder = "Search...",
    className,
    ...props
  },
  ref
) {
  return (
    <div
      className={cn(
        "flex h-[36px] items-center gap-[6px] px-[6px] py-[4px] bg-[var(--bg-surface-2)] border border-[var(--border-default)] rounded-[var(--r-lg)] shadow-[var(--sh-input)]",
        className
      )}
    >
      <Icon name="search" size={16} className="text-[var(--text-tertiary)] shrink-0 ml-1" />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-0 outline-none text-[var(--text-primary)] font-medium text-[14px] leading-[16px] placeholder:text-[var(--text-tertiary)]"
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center justify-center size-[24px] rounded-[var(--r-xs)] text-[var(--text-secondary)] hover:bg-[var(--overlay-10)] hover:text-[var(--text-primary)] transition-colors"
        >
          <Icon name="close" size={14} />
        </button>
      )}
    </div>
  );
});

SearchInput.displayName = "SearchInput";
export default SearchInput;
