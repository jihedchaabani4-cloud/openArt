"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/shared/lib/utils";

export function LoadingScreen({ message = "Art", fullScreen = false }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center overflow-hidden bg-background",
      fullScreen ? "fixed inset-0 z-[100]" : "w-full h-full flex-1"
    )}>
      
      {/* Central Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Branding Text */}
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white/70 mb-4 uppercase">
          {message}
        </h1>

        {/* Minimal Progress Line Container */}
        <div className="w-34 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
          {/* Animated Progress Fill */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: ["-100%", "0%", "100%"] }} 
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 bg-white/90 w-1/3 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          />
        </div>
      </motion.div>
    </div>
  );
}

