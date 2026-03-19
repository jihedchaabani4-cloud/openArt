"use client"

import * as React from "react"
import { ModelSelector } from "@/components/features/PromptBarComponents/ModelSelector"

export default function TestFeaturedPage() {
  const [selected, setSelected] = React.useState(null)

  return (
    <div className="min-h-screen bg-[#0F1113] text-white relative">
      <div className="max-w-3xl mx-auto py-12 px-6">
        <h1 className="text-2xl font-semibold mb-3">Featured Models Dropdown</h1>
        <p className="text-white/60 mb-6">
          Selected: {selected?.name || "None"}
        </p>
      </div>

      <div className="relative h-[500px] flex justify-center">
        <ModelSelector onChange={setSelected} />
      </div>
    </div>
  )
}
