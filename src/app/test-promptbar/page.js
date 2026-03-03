"use client"

import * as React from "react"
import ImagePromptBar from "@/components/features/promptbar"

export default function TestPromptBarPage() {
  return (
    <div className="min-h-screen bg-[#0F1113] text-white relative flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full mb-12 text-center">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Studio Prompt Bar Test View
        </h1>
        <p className="text-white/40 max-w-lg mx-auto">
          Previewing the integrated ImagePromptBar with ModelSelector, 
          Resolution, Aspect Ratio, and Generation controls.
        </p>
      </div>

      <div className="w-full max-w-4xl">
        <ImagePromptBar />
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl opacity-50">
        <div className="p-4 rounded-xl border border-white/5 bg-white/5">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2">Model Sync</h3>
          <p className="text-sm text-white/60">Advanced searchable selector integrated.</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-white/5">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2">Responsive</h3>
          <p className="text-sm text-white/60">Adapts to prompt length and screen size.</p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-white/5">
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2">Interactive</h3>
          <p className="text-sm text-white/60">Real-time count, ratio, and res updates.</p>
        </div>
      </div>
    </div>
  )
}
