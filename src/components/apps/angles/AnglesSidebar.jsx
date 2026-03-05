"use client"
import * as React from "react"
import AnglesPanel from "../../builder/Angles";

export function AnglesSidebar({ onGenerate, previewImageUrl }) {
    return (
        <div className="w-80 bg-gray-900 p-4">
            <AnglesPanel 
                onGenerate={onGenerate}
                previewImageUrl={previewImageUrl}
            />
        </div>
    )
}
