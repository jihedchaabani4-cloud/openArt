"use client";

import React from "react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

const CATEGORY_TABS = [
  { id: "all", label: "All", googleIcon: "grid_view" },
  { id: "object", label: "Objects", googleIcon: "directions_car" },
  { id: "style", label: "Styles", googleIcon: "palette" },
  { id: "font", label: "Fonts", googleIcon: "font_download" },
  { id: "logo", label: "Logos", googleIcon: "diamond" },
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
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              data-state={isSelected ? "active" : "inactive"}
              onClick={() => onCategoryChange && onCategoryChange(tab.id)}
              className={`flow_tab_slider_trigger inline-flex items-center gap-1.5 h-full px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer outline-none ${
                isSelected
                  ? "bg-white text-black font-semibold shadow-xs"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <GoogleIcon iconName={tab.googleIcon} className="text-[1rem]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ElementsKreaControls;
