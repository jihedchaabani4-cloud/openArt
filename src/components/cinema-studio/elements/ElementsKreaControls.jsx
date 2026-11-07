"use client";

import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";

const CATEGORY_TABS = [
  { id: "all", label: "All", googleIcon: "grid_view" },
  { id: "object", label: "Objects", googleIcon: "category" },
  { id: "style", label: "Styles", googleIcon: "palette" },
  { id: "font", label: "Fonts", googleIcon: "match_case" },
  { id: "logo", label: "Logos", googleIcon: "token" },
];

export function ElementsKreaControls({
  selectedCategory = "all",
  onCategoryChange,
}) {
  return (
    <div className="w-full mb-6 flex items-center justify-start">
      {/* Category Type Filter Tablist matching Google Sans tablist specs */}
      <div
        role="tablist"
        aria-orientation="horizontal"
        tabIndex={0}
        className="flex items-center gap-1 h-[2.125rem] bg-white/5 p-1 rounded-md overflow-x-auto w-full md:w-auto custom-scrollbar select-none outline-none font-sans text-xs font-medium leading-4 text-white"
      >
        {CATEGORY_TABS.map((tab) => {
          const isSelected = selectedCategory === tab.id;
          return (
            <Button
              key={tab.id}
              type="button"
              variant={isSelected ? "primary" : "ghost"}
              role="tab"
              aria-selected={isSelected}
              data-state={isSelected ? "active" : "inactive"}
              onClick={() => onCategoryChange && onCategoryChange(tab.id)}
              className="gap-1.5 h-full rounded-md"
            >
              <GoogleIcon iconName={tab.googleIcon} className="text-[1rem]" />
              <span>{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export default ElementsKreaControls;
