"use client"

import { create } from "zustand"
import { api } from "@/lib/api"

/**
 * Zustand store for managing projects.
 * Connects to the Express API which interacts with Supabase.
 */
export const useProjectStore = create((set, get) => ({
    projects: [],
    sessions: [],
    isLoading: false,
    isSessionsLoading: false,
    error: null,

    /**
     * Fetch all projects from the backend.
     */
    fetchProjects: async () => {
        set({ isLoading: true, error: null })
        try {
            const res = await api.get("/projects")
            if (res.ok) {
                set({ projects: res.data || [] })
            } else {
                set({ error: res.message || "Failed to fetch projects" })
            }
        } catch (err) {
            console.error("❌ fetchProjects error:", err)
            set({ error: err.message })
        } finally {
            set({ isLoading: false })
        }
    },

    /**
     * Create a new project.
     * @param {Object} projectData - { project_name, description, user_id }
     */
    createProject: async (projectData) => {
        set({ isLoading: true, error: null })
        try {
            const res = await api.post("/projects", projectData)
            if (res.ok) {
                // Add the new project to the list
                set((state) => ({
                    projects: [res.data, ...state.projects]
                }))
                return res.data
            } else {
                set({ error: res.message || "Failed to create project" })
                return null
            }
        } catch (err) {
            console.error("❌ createProject error:", err)
            set({ error: err.message })
            return null
        } finally {
            set({ isLoading: false })
        }
    },

    /**
     * Update a project.
     * @param {string} projectId - UUID
     * @param {Object} updateData - { project_name, description }
     */
    updateProject: async (projectId, updateData) => {
        set({ isLoading: true, error: null })
        try {
            const res = await api.patch(`/projects/${projectId}`, updateData)
            if (res.ok) {
                set((state) => ({
                    projects: state.projects.map(p => p.project_id === projectId ? res.data : p)
                }))
                return res.data
            } else {
                set({ error: res.message || "Failed to update project" })
                return null
            }
        } catch (err) {
            console.error("❌ updateProject error:", err)
            set({ error: err.message })
            return null
        } finally {
            set({ isLoading: false })
        }
    },

    /**
     * Delete a project.
     * @param {string} projectId - UUID of the project to delete
     */
    deleteProject: async (projectId) => {
        set({ isLoading: true, error: null })
        try {
            const res = await api.delete(`/projects/${projectId}`)
            if (res.ok) {
                // Remove from local state
                set((state) => ({
                    projects: state.projects.filter(p => p.project_id !== projectId)
                }))
                return true
            } else {
                set({ error: res.message || "Failed to delete project" })
                return false
            }
        } catch (err) {
            console.error("❌ deleteProject error:", err)
            set({ error: err.message })
            return false
        } finally {
            set({ isLoading: false })
        }
    },

    /**
     * Clear any errors in the store.
     */
    clearError: () => set({ error: null }),

    /**
     * Fetch all sessions for a specific project.
     * @param {string} projectId 
     */
    fetchSessions: async (projectId) => {
        set({ isSessionsLoading: true, error: null })
        try {
            const res = await api.get(`/sessions?project_id=${projectId}`)
            if (res.ok) {
                set({ sessions: res.data || [] })
            } else {
                set({ error: res.message || "Failed to fetch sessions" })
            }
        } catch (err) {
            console.error("❌ fetchSessions error:", err)
            set({ error: err.message })
        } finally {
            set({ isSessionsLoading: false })
        }
    },

    /**
     * Create a new session.
     * @param {Object} sessionData - { session_name, project_id }
     */
    createSession: async (sessionData) => {
        set({ isSessionsLoading: true, error: null })
        try {
            const res = await api.post("/sessions", sessionData)
            if (res.ok) {
                set((state) => ({
                    sessions: [res.data, ...state.sessions]
                }))
                return res.data
            } else {
                set({ error: res.message || "Failed to create session" })
                return null
            }
        } catch (err) {
            console.error("❌ createSession error:", err)
            set({ error: err.message })
            return null
        } finally {
            set({ isSessionsLoading: false })
        }
    },

    /**
     * Update a session name.
     * @param {string} sessionId 
     * @param {Object} updateData - { session_name }
     */
    updateSession: async (sessionId, updateData) => {
        set({ isSessionsLoading: true, error: null })
        try {
            const res = await api.patch(`/sessions/${sessionId}`, updateData)
            if (res.ok) {
                set((state) => ({
                    sessions: state.sessions.map(s => s.session_id === sessionId ? res.data : s)
                }))
                return res.data
            } else {
                set({ error: res.message || "Failed to update session" })
                return null
            }
        } catch (err) {
            console.error("❌ updateSession error:", err)
            set({ error: err.message })
            return null
        } finally {
            set({ isSessionsLoading: false })
        }
    },

    /**
     * Delete a session.
     * @param {string} sessionId 
     */
    deleteSession: async (sessionId) => {
        set({ isSessionsLoading: true, error: null })
        try {
            const res = await api.delete(`/sessions/${sessionId}`)
            if (res.ok) {
                set((state) => ({
                    sessions: state.sessions.filter(s => s.session_id !== sessionId)
                }))
                return true
            } else {
                set({ error: res.message || "Failed to delete session" })
                return false
            }
        } catch (err) {
            console.error("❌ deleteSession error:", err)
            set({ error: err.message })
            return false
        } finally {
            set({ isSessionsLoading: false })
        }
    }
}))
