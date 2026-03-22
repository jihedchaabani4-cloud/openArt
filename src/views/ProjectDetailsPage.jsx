"use client"
 
import * as React from "react"
import { useEffect } from "react"
import { useGenerationsStore } from "@/features/generations/model/useGenerationsStore"
import { GenerationsStudio } from "@/widgets/StudioLayout/GenerationsStudio/GenerationsStudio"
 
export function ProjectDetailsPage({ params }) {
    const { projectId } = React.use(params)
    const { setSelectedProjectId } = useGenerationsStore()
    
    useEffect(() => {
        if (projectId) {
            setSelectedProjectId(projectId)
        }
    }, [projectId, setSelectedProjectId])
 
    return <GenerationsStudio />;
}
