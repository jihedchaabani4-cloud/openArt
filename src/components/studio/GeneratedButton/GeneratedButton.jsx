"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export default function GeneratedButton({
  onClick,
  disabled = false,
  loading = false,
  label = "Generate",
  credits
}) {
  return (
    <div
      data-tour-anchor="tour-image-form"
      className="hidden md:flex fixed bottom-4 inset-x-1/2 -translate-x-1/2 w-full max-w-[70rem] z-50 pointer-events-none"
    >
      <div
        className="flex flex-col items-center justify-center p-0.5 rounded-[26px] w-full"
        style={{
          background:
            "linear-gradient(115deg, rgba(36, 43, 50, 0.12) 27.54%, rgba(219, 219, 219, 0.12) 85.5%), rgba(15, 17, 19, 0.96)",
          backdropFilter: "blur(10.45px)",
        }}
      >
        <div className="w-full border rounded-3xl border-white/10 p-4 flex items-center justify-center">
          <Button
            onClick={onClick}
            disabled={disabled || loading}
            variant="studio-neon"
            className="h-12 px-6 rounded-xl pointer-events-auto"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span className="text-[12px] tracking-widest">{label}</span>
                <Sparkles className="w-4 h-4 fill-black" />
                {typeof credits === "number" ? (
                  <span className="text-[10px] opacity-60">{credits}</span>
                ) : null}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
