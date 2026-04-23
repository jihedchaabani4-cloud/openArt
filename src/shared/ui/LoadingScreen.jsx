"use client";

import React from "react";
import { motion } from "framer-motion";

export function LoadingScreen({ message = "Open Art" }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#111111] overflow-hidden">
      
      {/* Central Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Branding Text */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-6 uppercase italic">
          {message}
        </h1>

        {/* Minimal Progress Line Container */}
        <div className="w-48 h-[3px] bg-white/10 rounded-full overflow-hidden relative">
          {/* Animated Progress Fill */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: ["-100%", "0%", "100%"] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 bg-blue-500 w-1/2 rounded-full"
          />
          
          {/* Static progress fill for smoother look if needed, but the above is more dynamic */}
        </div>
      </motion.div>

      {/* Very subtle background glow to keep it premium but minimal */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
