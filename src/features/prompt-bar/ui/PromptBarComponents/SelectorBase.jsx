"use client"

import React, { useState } from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { cn } from "@/shared/lib/utils"

// ─── Icons ─────────────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M17.7406 7.1827C18.0539 7.45363 18.0882 7.92725 17.8173 8.24057L10.4673 16.7406C10.3305 16.8988 10.1339 16.9926 9.92494 16.9996C9.71594 17.0066 9.51353 16.9259 9.36654 16.7772L6.21654 13.5897C5.92539 13.2951 5.9282 12.8202 6.22282 12.5291C6.51744 12.2379 6.9923 12.2407 7.28346 12.5353L9.86327 15.1458L16.6827 7.25945C16.9536 6.94613 17.4272 6.91177 17.7406 7.1827Z" />
  </svg>
)

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M20 20L16.1265 16.1265M16.1265 16.1265C17.4385 14.8145 18.25 13.002 18.25 11C18.25 6.99594 15.0041 3.75 11 3.75C6.99594 3.75 3.75 6.99594 3.75 11C3.75 15.0041 6.99594 18.25 11 18.25C13.002 18.25 14.8145 17.4385 16.1265 16.1265Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SELECTOR_STYLES = `
  @keyframes selectorDropIn {
    from { opacity: 0; transform: translateY(6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .selector-drop-in { animation: selectorDropIn 160ms cubic-bezier(0.16,1,0.3,1); }
  .selector-scroll::-webkit-scrollbar { width: 4px; }
  .selector-scroll::-webkit-scrollbar-track { background: transparent; }
  .selector-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 20px; }
  .selector-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
`;

const RatioIcon = ({ ratio, isSelected }) => {
  if (!ratio || typeof ratio !== "string" || !ratio.includes(":")) return null;

  const [w, h] = ratio.split(":").map(Number);
  if (isNaN(w) || isNaN(h) || w === 0 || h === 0) return null;

  // Container
  const CW = 32;
  const CH = 24;

  // Normalize
  const maxDim = Math.max(w, h);
  const normW = w / maxDim;
  const normH = h / maxDim;

  // أقل padding => icon أكبر
  const PAD = 2;
  const maxW = CW - PAD * 2;
  const maxH = CH - PAD * 2;

  // Scale أقوى
  const scale = Math.min(maxW / normW, maxH / normH);

  // minimum size باش ما يكونش صغير برشة
  const rw = Math.max(Math.round(normW * scale), 6);
  const rh = Math.max(Math.round(normH * scale), 6);

  // Center
  const x = (CW - rw) / 2;
  const y = (CH - rh) / 2;

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md transition-all duration-150",
        "w-8 h-6",
        isSelected ? "text-white scale-105" : "text-white/40"
      )}
    >
      <svg width={CW} height={CH} viewBox={`0 0 ${CW} ${CH}`} fill="none">
        <rect
          x={x + 0.5}
          y={y + 0.5}
          width={rw - 1}
          height={rh - 1}
          rx="2"
          stroke="currentColor"
          strokeWidth={isSelected ? "2" : "1.4"}
        />
      </svg>
    </div>
  );
};

// ─── SelectorBase ───────────────────────────────────────────────────────────
export function SelectorBase({
  icon: Icon,
  triggerValue,
  label,
  items = [],
  currentValue,
  onSelect,
  renderTrigger,
  renderItem,
  className,
  contentClassName,
  listClassName,
  itemClassName,
  searchable = false,
  sections,
  side = "top",
  align = "center",
  sideOffset = 8,
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const renderIcon = (I, size = 13) => {
    if (!I) return null;
    if (React.isValidElement(I)) return I;
    const Comp = I;
    return <Comp size={size} />;
  };

  const filterItems = (itemList) => (itemList || []).filter(item => {
    if (item == null) return false;
    const label = (typeof item === "object") ? item.label : String(item)
    return (label || "").toLowerCase().includes(search.toLowerCase())
  })

  // Determine what to render based on sections or plain items
  const activeSections = sections 
    ? sections.map(s => ({ ...s, filteredItems: filterItems(s.items) })).filter(s => s.filteredItems.length > 0)
    : label || items.length > 0 
      ? [{ label, filteredItems: filterItems(items) }]
      : []

  const handleSelect = (value) => {
    onSelect?.(value)
    setSearch("")
    setOpen(false)
  }

  return (
    <div className={className}>
      <style>{SELECTOR_STYLES}</style>

      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          {renderTrigger ? (
            renderTrigger({ triggerValue, open })
          ) : (
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 h-7 px-2 rounded-md",
                "bg-transparent border-none shadow-none",
                "text-[#e3e4e7]",
                "text-[12px] font-medium tracking-[0.01em]",
                "transition-colors duration-100 cursor-pointer outline-none",
                "hover:bg-white/5",
                open && "bg-white/[0.07] text-white",
                className
              )}
            >
              {Icon && (
                <div className="size-4 shrink-0 flex items-center justify-center text-white">
                  {renderIcon(Icon)}
                </div>
              )}
              <span className="text-[#e3e4e7] tracking-tight">{triggerValue}</span>
            </button>
          )}
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            side={side}
            align={align}
            sideOffset={sideOffset}
            className="selector-drop-in outline-none z-[9999]"
            onOpenAutoFocus={e => e.preventDefault()}
          >
            <div className={cn(
              "w-screen max-w-[min(280px,calc(100vw-32px))] max-h-[min(32rem,calc(100vh-60px))]",
              "rounded-lg overflow-hidden flex flex-col",
              "border border-white/[0.07]",
              "bg-[rgba(28,30,32,0.95)] backdrop-blur-[32px]",
              "shadow-[0_16px_48px_-4px_rgba(0,0,0,0.85)]",
              contentClassName
            )}>

              {/* Search bar — shown only if searchable */}
              {searchable && (
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] shrink-0">
                  <span className="text-white"><SearchIcon /></span>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[#e3e4e7] text-[12px] placeholder-white/20"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-white/20 hover:text-white/45 text-[14px] leading-none transition-colors"
                    >×</button>
                  )}
                </div>
              )}

              <div className="overflow-y-auto flex-1 py-1.5 selector-scroll">
                {activeSections.length === 0 ? (
                  <div className="py-8 text-center text-white/20 text-[12px]">No results</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {activeSections.map((section, sIdx) => (
                      <div key={section.label || sIdx} className="flex flex-col">
                        {section.label && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5">
                            {section.icon && (
                              <span className="text-white">
                                <section.icon size={12} />
                              </span>
                            )}
                            <span className="text-[10px] font-medium text-[#e3e4e7] uppercase tracking-widest">
                              {section.label}
                            </span>
                          </div>
                        )}
                        <div className={cn("px-1.5 flex gap-px", listClassName || "flex-col")}>
                          {section.filteredItems.map(item => {
                            const itemValue = (typeof item === "object" && item !== null) ? item.value : item
                            const itemLabel = (typeof item === "object" && item !== null) ? item.label : String(item)
                            const ItemIcon  = (typeof item === "object" && item !== null) ? item.icon : null
                            const isSelected = itemValue === currentValue

                            return (
                              <button
                                key={itemValue}
                                type="button"
                                onClick={() => handleSelect(itemValue)}
                                className={cn(
                                  "w-full transition-colors cursor-pointer outline-none group",
                                  isSelected ? "bg-white/5" : "hover:bg-white/5 focus-visible:bg-white/5",
                                  itemClassName || "flex items-center gap-2.5 pl-1.5 py-1.5 pr-3 rounded-lg text-start"
                                )}
                              >
                                {renderItem ? renderItem({ item, isSelected }) : (
                                  <>
                                    {/* Handle Ratio Type */}
                                    {(item.type === 'ratio' || (typeof itemLabel === 'string' && itemLabel.includes(':') && listClassName?.includes('grid'))) ? (
                                      <div className={cn(
                                        "flex flex-col items-center gap-1.5 w-full py-2 px-1 rounded-lg transition-all duration-150 cursor-pointer",
                                        isSelected
                                          ? "text-white"
                                          : "text-white/40 hover:text-white/80"
                                      )}>
                                        <RatioIcon ratio={itemLabel} isSelected={isSelected} />
                                        <span className={cn(
                                          "text-[11px] font-medium tracking-tight transition-colors",
                                          isSelected ? "text-white" : "text-white/50 group-hover:text-white/80"
                                        )}>
                                          {itemLabel}
                                        </span>
                                      </div>
                                    ) : (
                                      <>
                                        {(ItemIcon || Icon) && (
                                          <div className="size-7 rounded-md bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                                            <div className="size-full flex items-center justify-center text-current/60 group-hover:text-white/80 transition-colors">
                                              {renderIcon(ItemIcon || Icon)}
                                            </div>
                                          </div>
                                        )}
                                        <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5">
                                          <div className="flex items-center gap-1.5 max-w-full">
                                            <span className={cn(
                                              "text-[12px] font-medium transition-colors truncate",
                                              isSelected ? "text-white" : "text-[#e3e4e7] group-hover:text-white"
                                            )}>
                                              {itemLabel}
                                            </span>
                                            {item.badge && (
                                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold uppercase tracking-wider shrink-0 whitespace-nowrap">
                                                {item.badge}
                                              </span>
                                            )}
                                          </div>
                                          {item.subtext && (
                                            <span className="text-[10px] text-[#e3e4e7]/60 truncate w-full">
                                              {item.subtext}
                                            </span>
                                          )}
                                          {(item.quality || item.dur) && (
                                            <div className="flex gap-1 items-center opacity-80 scale-90 origin-left">
                                              {item.quality && (
                                                <span className="text-[10px] px-1 py-0.5 rounded-sm bg-white/5 border border-white/10 text-[#e3e4e7] font-medium">
                                                  {item.quality}
                                                </span>
                                              )}
                                              {item.dur && (
                                                <span className="text-[10px] px-1 py-0.5 rounded-sm bg-white/5 border border-white/10 text-[#e3e4e7] font-medium">
                                                  {item.dur}
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <div className="size-5 shrink-0 flex items-center justify-center ml-auto">
                                          {isSelected && <span className="text-blue-400"><CheckIcon /></span>}
                                        </div>
                                      </>
                                    )}
                                  </>
                                )}
                              </button>
                            )
                          })}
                        </div>
                        {sIdx < activeSections.length - 1 && (
                          <div className="mx-3 my-1 border-t border-white/5" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </div>
  )
}