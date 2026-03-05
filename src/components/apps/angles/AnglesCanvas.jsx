"use client"
import * as React from "react"

export function AnglesCanvas({ previewImageUrl }) {
    return (
        <div className="flex-1 flex items-center justify-center bg-gray-800 p-4">
            <div className="w-full max-w-md aspect-[9/16] bg-gray-700 rounded-lg overflow-hidden">
                {previewImageUrl && (
                    <img src={previewImageUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
            </div>
        </div>
    )
}
