"use client"

import { create } from "zustand"
import builderData from "@/data/builderData.json"
import { io } from "socket.io-client"
import { api } from "@/lib/api"

// ─── Store ─────────────────────────────────────────────────────────────────────
export const useStudioStore = create((set, get) => ({
    workspaces: [], // List of workspaces from backend
    nodes: [],      // Image generations list
    activeWorkspaceId: null,
    selectedNodeId: null, // Single ID of node dragged into the prompt bar
    studioMode: "image", // "image" or "cinema"
    socket: null,
    isConnected: false,

    initSocket: () => {
        if (get().socket) return

        const socket = io("http://localhost:5000")
        
        socket.on("connect", () => {
            console.log("🔌 Connected to WebSocket")
            set({ isConnected: true })
        })

        socket.on("disconnect", () => {
            console.log("🔌 Disconnected from WebSocket")
            set({ isConnected: false })
        })

        socket.on("generation_update", (updatedGen) => {
            console.log("🔌 Received generation update:", updatedGen)
            set((state) => {
                const newNodes = state.nodes.map(n => 
                    n.id === updatedGen.id ? { ...n, ...updatedGen } : n
                )
                return { nodes: newNodes }
            })
        })

        set({ socket })
    },

    setStudioMode: (mode) => set({ studioMode: mode }),
    
    setActiveWorkspaceId: (id) => {
        set({ 
            activeWorkspaceId: id,
            nodes: [],
            selectedNodeId: null
        })
        get().fetchGenerations()
    },

    // ─── Selection Actions ──────────────────────────────────────────
    setNodeSelection: (nodeId) => set({ selectedNodeId: nodeId }),
    
    clearNodeSelection: () => set({ selectedNodeId: null }),

    // ─── API Actions ─────────────────────────────────────────────────

    fetchWorkspaces: async () => {
        try {
            const res = await api.get("/workspaces")
            if (res.ok) {
                set({ workspaces: res.data })
                if (res.data.length > 0 && !get().activeWorkspaceId) {
                    get().setActiveWorkspaceId(res.data[0].id)
                }
            }
        } catch (err) {
            console.error("❌ fetchWorkspaces error:", err)
        }
    },

    fetchGenerations: async () => {
        const workspaceId = get().activeWorkspaceId
        if (!workspaceId) return

        try {
            const res = await api.get(`/cinema/generations/${workspaceId}`)
            if (res.ok) {
                set({ nodes: res.data })
            }
        } catch (err) {
            console.error("❌ fetchGenerations error:", err)
        }
    },

    regenerateNode: async (nodeId) => {
        // Implementation for regeneration if needed
        console.log("Regenerating node:", nodeId)
    },

    removeNode: async (nodeId) => {
        try {
            const res = await api.delete(`/cinema/generations/${nodeId}`)
            if (res.ok) {
                set((state) => ({
                    nodes: state.nodes.filter(n => n.id !== nodeId),
                    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
                }))
            }
        } catch (err) {
            console.error("❌ removeNode error:", err)
        }
    }
}))
