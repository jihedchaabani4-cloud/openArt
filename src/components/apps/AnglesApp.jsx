"use client"
import * as React from "react"
import { AnglesSidebar } from "./angles/AnglesSidebar"
import { AnglesCanvas } from "./angles/AnglesCanvas"
import AnglesPanel from "../builder/Angles";

export function AnglesApp() {
    const [generationData, setGenerationData] = React.useState(null);
    const [previewImage, setPreviewImage] = React.useState("https://picsum.photos/200/300");

    const handleGenerate = (data) => {
        console.log("Generate Clicked:", data);
        setGenerationData(data);
        // Here you would typically call an API to get a new image
        // For now, we'll just use a new random image
        setPreviewImage(`https://picsum.photos/200/300?random=${Math.random()}`);
    }

    return (
        <div className="flex h-screen w-screen bg-[#0a0a0a] text-white">
          
            <AnglesCanvas previewImageUrl={previewImage} /> 
            <div className="p-4">
            <AnglesPanel onGenerate={handleGenerate} previewImageUrl={previewImage} />
            </div>
        </div>
    )
}
