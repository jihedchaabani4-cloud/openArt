"use client"
import * as React from "react"
import { StudioLayoutV2 } from "../StudioLayoutV2"
import { useStudioStore } from "@/store/useStudioStore"

import { CinemaStudio } from "../CinemaStudio/CinemaStudio"

export function CinemaStudioView() {
    const { studioMode, setStudioMode } = useStudioStore()

    React.useEffect(() => {
        // Only set default if nothing is set
        if (!studioMode) {
            setStudioMode("cinema")
        }
    }, [studioMode, setStudioMode])

    return <CinemaStudio />
}
