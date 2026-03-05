"use client"
import * as React from "react"
import CinemaPromptBar from "@/components/features/CinemaPromptBar"
import { useCinemaStore } from "@/store/useCinemaStudioStore"
import { useEffect } from "react"

export function CinemaStudioView() {
    const { init, workspaceId, activeProjectId, projects, setActiveProject, setActiveScene, scenes, fetchScenes } = useCinemaStore()

    // Example: Initialize with a dummy workspace if none exists
    useEffect(() => {
        const wsId = "ws_test_123" // In real app, get from context
        init(wsId)
    }, [])

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a0a0a] text-white">
            <main className="flex-1 flex flex-col relative min-w-0">
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 scrollbar-hide">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-normal">Cinema Studio</h1>
                            <p className="text-white/50">Create your cinematic masterpiece with AI.</p>
                        </div>
                        
                        {/* Simple Project Selector for Demo */}
                        <div className="flex gap-4">
                            <select 
                                className="bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-sm"
                                value={activeProjectId || ""}
                                onChange={(e) => setActiveProject(e.target.value)}
                            >
                                <option value="" disabled>Select Project</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Scenes List */}
                    {activeProjectId && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(scenes[activeProjectId] || []).map(scene => (
                                <div 
                                    key={scene.id}
                                    onClick={() => setActiveScene(scene.id)}
                                    className="bg-[#111] border border-white/5 p-4 rounded-2xl cursor-pointer hover:border-white/20 transition-all"
                                >
                                    <h3 className="text-lg font-medium">{scene.title || `Scene ${scene.scene_order}`}</h3>
                                    <p className="text-xs text-white/40 mt-1">{scene.mood} • {scene.time_of_day}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Floating Prompt Bar */}
                <div className="absolute bottom-8 inset-x-0 z-30 flex justify-center px-6 pointer-events-none">
                    <div className="w-full max-w-[850px] pointer-events-auto">
                        <div className="shadow-[0_24px_80px_rgba(0,0,0,0.8)] rounded-[24px]">
                            <CinemaPromptBar hideBackground={true} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
