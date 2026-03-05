"use client"

import * as React from "react"

export function AppView() {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a] text-white">
            <main className="flex-1 flex flex-col relative min-w-0">
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-hide">
                    <h1 className="text-4xl font-bold">App View</h1>
                    <p className="text-white/50">This is the new app page.</p>
                </div>
            </main>
        </div>
    )
}
