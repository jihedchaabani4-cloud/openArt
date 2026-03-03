"use client"

import * as React from "react"
import Buttongeneretd from "@/components/studio/Buttongeneretd"

export default function TestButtonPage() {
  const [loading, setLoading] = React.useState(false)
  const [count, setCount] = React.useState(0)

  const handleClick = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setCount(c => c + 1)
  }

  return (
    <div className="min-h-screen bg-[#0F1113] text-white">
      <div className="max-w-3xl mx-auto py-16 px-6">
        <h1 className="text-2xl font-semibold mb-2">Test Button</h1>
        <p className="text-white/60">
          Click the neon button at the bottom to simulate a generation action. Completed: {count}
        </p>
      </div>

      <Buttongeneretd
        onClick={handleClick}
        loading={loading}
        disabled={false}
        label="Generate"
        credits={2}
      />
    </div>
  )
}
