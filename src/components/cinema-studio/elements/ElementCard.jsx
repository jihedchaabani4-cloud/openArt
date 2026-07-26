"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Compass, Package, User, MapPin, Palette, Trash2, Tag } from "lucide-react";

/**
 * Helper to pick icon badge based on category or element name
 */
function getCategoryIcon(category, name = "") {
  const cat = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();

  if (cat === "character" || n.includes("character") || n.includes("man") || n.includes("woman") || n.includes("portrait")) {
    return <User className="w-3.5 h-3.5 text-white/90" />;
  }
  if (cat === "location" || n.includes("location") || n.includes("mountain") || n.includes("vista") || n.includes("scenic") || n.includes("overlook")) {
    return <Compass className="w-3.5 h-3.5 text-white/90" />;
  }
  if (cat === "color" || cat === "style" || n.includes("style")) {
    return <Palette className="w-3.5 h-3.5 text-white/90" />;
  }
  // Default for Product / Object / Props
  return <Package className="w-3.5 h-3.5 text-white/90" />;
}

export function ElementCard({
  element,
  onClick,
  onDelete,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const name = element.name || element.display_name || element.metadata?.displayName || "Untitled Element";
  const coverUrl = element.primary_media_url || element.url || element.items?.[0]?.url || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600";
  const category = element.category || "object";

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick(element);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(element.id || element.name);
  };

  return (
    <motion.div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative group aspect-[4/3] w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-white/25 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer select-none"
    >
      {/* Background Image Cover */}
      <img
        src={coverUrl}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />

      {/* Gradient Mask Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

      {/* Top-Left Category Icon Badge */}
      <div className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md">
        {getCategoryIcon(category, name)}
      </div>

      {/* Top-Right Delete Action Button (Hover Only) */}
      {onDelete && (
        <button
          onClick={handleDeleteClick}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-red-600/90 text-white/70 hover:text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
          title="Delete Element"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Bottom-Left Element Name Label */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-col items-start pointer-events-none">
        <h3 className="text-sm font-bold text-white tracking-wide truncate max-w-full drop-shadow-md">
          {name}
        </h3>
        {element.description && (
          <p className="text-[11px] text-white/70 truncate max-w-full font-normal">
            {element.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default ElementCard;
