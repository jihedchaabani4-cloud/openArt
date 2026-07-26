"use client";

import React from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, Sparkles } from "lucide-react";

const CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "character", label: "Character" },
  { id: "location", label: "Location" },
  { id: "object", label: "Object" },
  { id: "logo", label: "Logo" },
  { id: "font", label: "Font" },
  { id: "style", label: "Style" },
  { id: "other", label: "Other" },
  { id: "color", label: "Color" },
];

export function ElementFilterBar({
  activeCategory = "all",
  onSelectCategory,
  onManageBrandKits,
}) {
  return (
    <div className="w-full py-4 px-4 sm:px-8">
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Pills Tabs Container */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#141417] border border-white/10 rounded-full overflow-x-auto max-w-full custom-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectCategory(tab.id)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "text-black font-bold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilterPill"
                    className="absolute inset-0 bg-white rounded-full shadow-md z-0"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Action: Manage Brand Kits */}
        <button
          onClick={onManageBrandKits}
          className="bg-[#18181b] hover:bg-[#27272a] text-white/90 border border-white/15 rounded-full px-4 py-2 text-xs font-medium flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer whitespace-nowrap"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-white/70" />
          <span>Manage Brand Kits</span>
        </button>

      </div>
    </div>
  );
}

export default ElementFilterBar;
