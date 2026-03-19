"use client"
import * as React from "react"
import { useGenerationsStudioStore } from "@/store/useGenerationsStudioStore"
 
import { GenerationsStudio } from "@/components/studio/GenerationsStudio/GenerationsStudio"

export function GenerationsStudioView() {
    const { studioMode, setStudioMode, projectId } = useGenerationsStudioStore()

    React.useEffect(() => {
        if (!studioMode) {
            setStudioMode("image")
        }
    }, [studioMode, setStudioMode])

    return (
        <div className="flex h-full w-full bg-[#050505] overflow-hidden">
            {/* Main Content: Generations */}
            <main className="flex-1 h-full overflow-hidden relative">
                <GenerationsStudio />
            </main>
        </div>
    )
}
