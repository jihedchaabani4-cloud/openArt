"use client"

import { Plus } from "lucide-react"
import { Button } from "@/shared/ui/button"

export function ProjectsFloatingAction({ onCreate }) {
    return (
        <div className="fixed bottom-8 right-8 z-50 lg:hidden">
            <Button
                onClick={onCreate}
                size="icon"
                className="size-14 rounded-full bg-white text-black shadow-2xl transition-transform hover:bg-white/90 active:scale-95"
            >
                <Plus className="size-6" />
            </Button>
        </div>
    )
}
