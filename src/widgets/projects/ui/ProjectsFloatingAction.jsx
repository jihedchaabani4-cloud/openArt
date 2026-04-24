"use client"

import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/shared/ui/button"

export function ProjectsFloatingAction({ onCreate, isLoading }) {
    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
            <button
                onClick={onCreate}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-4 rounded-[24px] bg-[#4a4a4a] hover:bg-[#5a5a5a] text-[#d1d1d1] hover:text-white shadow-2xl shadow-black/50 transition-all active:scale-95 border border-white/5 backdrop-blur-md"
            >
                {isLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                ) : (
                    <Plus className="size-5" />
                )}
                <span className="font-medium text-[15px]">New project</span>
            </button>
        </div>
    )
}
