"use client"
 
import * as React from "react"
import { useEffect } from "react"
import { useGenerationsStudioStore } from "@/store/useGenerationsStudioStore"
import { GenerationsStudio } from "@/components/studio/GenerationsStudio/GenerationsStudio"
 
export default function ProjectDetailPage({ params }) {
    const { projectId } = React.use(params)
    const { init: initGenerations } = useGenerationsStudioStore()
    
    useEffect(() => {
        if (projectId) {
            initGenerations(projectId)
        }
    }, [projectId, initGenerations])
 
    return <GenerationsStudio />;
}
