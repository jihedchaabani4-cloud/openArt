"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, HelpCircle, Layers } from "lucide-react";

/**
 * ElementsHeroState Component
 * Matches OpenArt's dark studio mockup for Empty State view.
 */
export function ElementsHeroState({ projectTitle = "Tutorial Project", onOpenCreateModal, onOpenHowTo }) {
  return (
    <div className="relative w-full min-h-[540px] flex items-center justify-center py-12 px-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Hero Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-6 flex flex-col items-start gap-4 z-10"
        >
          {/* Badge Tag */}
          <div className="text-white/45 text-[13px] font-medium tracking-wide">
            Elements collection
          </div>

          {/* Project Title */}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {projectTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-white/60 text-sm sm:text-base font-normal leading-relaxed max-w-md">
            Save characters, props, products, or places you want to reuse, and enhance their consistency throughout this project.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            {/* + New Element Primary Button */}
            <button
              onClick={onOpenCreateModal}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full px-5 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Element</span>
            </button>

            {/* How to Secondary Button */}
            <button
              onClick={onOpenHowTo}
              className="bg-white/10 hover:bg-white/15 text-white/90 border border-white/10 rounded-full px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer backdrop-blur-md"
            >
              <HelpCircle className="w-4 h-4 text-white/70" />
              <span>How to</span>
            </button>
          </div>
        </motion.div>

        {/* Right Column: Stacked Card Collage Graphics (Matching Mockup) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-6 relative h-[380px] w-full flex items-center justify-center"
        >
          {/* Card Container Box */}
          <div className="relative w-full max-w-[420px] h-full flex items-center justify-center">
            
            {/* Card 1: Left Background Landscape Card */}
            <motion.div
              initial={{ rotate: -6, x: -40, y: -10 }}
              animate={{ rotate: -6, x: -40, y: -10 }}
              className="absolute left-4 top-16 w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900/90 z-0"
            >
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80"
                alt="Landscape Element"
                className="w-full h-full object-cover filter brightness-[0.85]"
              />
            </motion.div>

            {/* Card 2: Center Main Character Card */}
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute w-56 h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-900 z-10"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80"
                alt="Character Element"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </motion.div>

            {/* Card 3: Bottom Right Product (Boots/Shoes) Card */}
            <motion.div
              initial={{ rotate: 4, x: 70, y: 40 }}
              animate={{ rotate: 4, x: 70, y: 40 }}
              className="absolute right-4 bottom-8 w-40 h-44 rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-800/95 z-20"
            >
              <img
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80"
                alt="Product Element"
                className="w-full h-full object-cover"
              />
            </motion.div>

          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default ElementsHeroState;
