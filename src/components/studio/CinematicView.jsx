"use client"

import * as React from "react"

export function CinematicView() {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a] text-white">
            <main className="flex-1 flex flex-col relative min-w-0">
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-hide">
                    <h1 className="text-4xl font-normal">Cinematic View</h1>
                    <p className="text-white/50">This is the new cinematic page.</p>
                </div>
            </main>
        </div>
    )
}
