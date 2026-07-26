"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, HelpCircle, Download, Sparkles } from "lucide-react";

/**
 * ElementsHeroHeader Component
 * Top hero section for the Elements page matching OpenArt mockup.
 */
export function ElementsHeroHeader({
  projectName = "Water Bottle",
  onOpenCreateModal,
  onOpenHowTo,
  onImportBrandKit,
}) {
  return (
    <div className="relative w-full py-8 px-4 sm:px-8 bg-transparent">
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Hero Text & Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-6 flex flex-col items-start gap-4 z-10"
        >
          {/* Badge Category */}
          <div className="text-white/50 text-xs sm:text-sm font-medium tracking-wide">
            Elements collection
          </div>

          {/* Project Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {projectName} Assets
          </h1>

          {/* Subtitle Description */}
          <p className="text-white/60 text-xs sm:text-sm font-normal leading-relaxed max-w-md">
            Save characters, props, products, or places you want to reuse, and enhance their consistency throughout this project.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* + New Element Primary Button */}
            <button
              onClick={onOpenCreateModal}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Element</span>
            </button>

            {/* Import Brand Kit Secondary Button */}
            <button
              onClick={onImportBrandKit}
              className="bg-white/10 hover:bg-white/15 text-white/90 border border-white/10 rounded-full px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer backdrop-blur-md"
            >
              <Download className="w-4 h-4 text-white/70" />
              <span>Import Brand Kit</span>
            </button>
          </div>

        </motion.div>

        {/* Right Column: Stacked 3D Card Collage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-6 relative h-[280px] sm:h-[340px] w-full flex items-center justify-center"
        >
          <div className="relative w-full max-w-[440px] h-full flex items-center justify-center">
            
            {/* Back Left Landscape Card */}
            <motion.div
              initial={{ rotate: -8, x: -60, y: -15 }}
              animate={{ rotate: -8, x: -60, y: -15 }}
              className="absolute left-2 top-8 w-32 sm:w-44 h-36 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-900 z-0"
            >
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80"
                alt="Scenic Element"
                className="w-full h-full object-cover filter brightness-90"
              />
            </motion.div>

            {/* Main Center Character/Product Card */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute w-44 sm:w-56 h-56 sm:h-72 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-zinc-900 z-10"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                alt="Character Element"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </motion.div>

            {/* Foreground Right Portrait Card */}
            <motion.div
              initial={{ rotate: 6, x: 80, y: 20 }}
              animate={{ rotate: 6, x: 80, y: 20 }}
              className="absolute right-2 bottom-4 w-28 sm:w-36 h-36 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-zinc-800 z-20"
            >
              <img
                src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80"
                alt="Pet Element"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Foreground Bottom Left Portrait Card */}
            <motion.div
              initial={{ rotate: -4, x: -40, y: 50 }}
              animate={{ rotate: -4, x: -40, y: 50 }}
              className="absolute left-10 bottom-2 w-28 sm:w-36 h-36 sm:h-44 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-zinc-800 z-20"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80"
                alt="Mini Element"
                className="w-full h-full object-cover"
              />
            </motion.div>

          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default ElementsHeroHeader;
