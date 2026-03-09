// ============================================================
//  CINEMA STUDIO STORE
//  Zustand store — manages:
//    environments, scenes, shots, assets
// ============================================================

import { create } from 'zustand'
import { api } from '@/lib/api'

export const useCinemaStore = create((set, get) => ({

  // ── State ──
  workspaceId:          null,
  loading:              false,
  error:                null,

  // Environments
  environments:         [],
  activeEnvironmentId:  null,

  // Scenes
  scenes:               [],  // Now a simple array for the active workspace
  activeSceneId:        null,

  // Shots
  shots:                {},   // keyed by scene_id
  activeShotId:         null,

  // Assets (Images/Videos)
  assets:               [],
  generations:          [],
  allGenerations:       [],
  allGenerationsPage:   1,
  allGenerationsHasMore: true,
  allGenerationsLoading: false,
  activeFilter:         'all', // 'all' or 'liked'

  // ── Init: load everything ──
  init: async (workspaceId) => {
    // Clear previous workspace state to avoid showing stale data
    set({ 
      workspaceId, 
      loading: true, 
      error: null,
      assets: [],
      generations: [],
      allGenerations: [],
      allGenerationsPage: 1,
      allGenerationsHasMore: true,
      scenes: [],
      shots: {},
      activeFilter: 'all'
    })
    try {
      await Promise.all([
        get().fetchEnvironments(workspaceId),
        get().fetchScenes(workspaceId),
        get().fetchAssets(workspaceId),
        get().fetchGenerations(workspaceId),
        get().fetchAllGenerations(true),
      ])
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  // ══════════════════════════════════════
  // ASSETS & GENERATIONS
  // ══════════════════════════════════════

  fetchAssets: async (workspaceId) => {
    try {
      const res = await api.get(`/cinema/assets/${workspaceId}`)
      if (res.ok) set({ assets: res.data ?? [] })
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  fetchGenerations: async (workspaceId) => {
    try {
      const res = await api.get(`/cinema/generations/${workspaceId}`)
      if (res.ok) set({ generations: res.data ?? [] })
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  fetchAllGenerations: async (reset = false) => {
    const { allGenerationsPage, allGenerations, allGenerationsLoading, allGenerationsHasMore } = get();
    
    if (allGenerationsLoading || (!reset && !allGenerationsHasMore)) return;
    
    const pageToFetch = reset ? 1 : allGenerationsPage;
    
    set({ allGenerationsLoading: true });
    try {
      const res = await api.get(`/cinema/generations?page=${pageToFetch}&limit=10`)
      if (res.ok) {
        set({ 
          allGenerations: reset ? (res.data ?? []) : [...allGenerations, ...(res.data ?? [])],
          allGenerationsPage: pageToFetch + 1,
          allGenerationsHasMore: res.hasMore,
          allGenerationsLoading: false
        })
      } else throw new Error(res.message)
    } catch (err) { 
      set({ error: err.message, allGenerationsLoading: false }) 
    }
  },

  setActiveFilter: (filter) => set({ activeFilter: filter }),

  removeGeneration: async (id) => {
    try {
      const res = await api.delete(`/cinema/generations/${id}`)
      if (res.ok) {
        set((s) => ({
          generations: s.generations.filter((g) => g.id !== id)
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  toggleLike: async (id, currentStatus) => {
    try {
      const res = await api.patch(`/cinema/generations/${id}`, { is_Like: !currentStatus })
      if (res.ok) {
        set((s) => ({
          generations: s.generations.map((g) => g.id === id ? { ...g, is_Like: !currentStatus } : g)
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  // ══════════════════════════════════════
  // ENVIRONMENTS
  // ══════════════════════════════════════

  fetchEnvironments: async (workspaceId) => {
    try {
      const res = await api.get(`/cinema/environments/${workspaceId}`)
      if (res.ok) set({ environments: res.data ?? [] })
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

  addEnvironment: async (envData) => {
    try {
      const res = await api.post('/cinema/environments', envData)
      if (res.ok) set((s) => ({ environments: [res.data, ...s.environments] }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  updateEnvironment: async (id, updates) => {
    try {
      const res = await api.patch(`/cinema/environments/${id}`, updates)
      if (res.ok) set((s) => ({
        environments: s.environments.map((e) => e.id === id ? { ...e, ...res.data } : e)
      }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  removeEnvironment: async (id) => {
    try {
      const res = await api.delete(`/cinema/environments/${id}`)
      if (res.ok) set((s) => ({
        environments: s.environments.filter((e) => e.id !== id),
        activeEnvironmentId: s.activeEnvironmentId === id ? null : s.activeEnvironmentId
      }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  // ══════════════════════════════════════
  // SCENES
  // ══════════════════════════════════════

  fetchScenes: async (workspaceId) => {
    try {
      const res = await api.get(`/cinema/scenes/${workspaceId}`)
      if (res.ok) {
        const scenes = res.data ?? []
        set({ scenes })
        if (scenes.length > 0) {
          get().setActiveScene(scenes[0].id)
        }
      }
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  setActiveScene: (id) => {
    set({ activeSceneId: id })
    if (id) get().fetchShots(id)
  },

  addScene: async (sceneData) => {
    try {
      const res = await api.post('/cinema/scenes', sceneData)
      if (res.ok) set((s) => ({ scenes: [...s.scenes, res.data] }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  updateScene: async (id, updates) => {
    try {
      const res = await api.patch(`/cinema/scenes/${id}`, updates)
      if (res.ok) set((s) => ({
        scenes: s.scenes.map((sc) => sc.id === id ? { ...sc, ...res.data } : sc)
      }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  removeScene: async (id) => {
    try {
      const res = await api.delete(`/cinema/scenes/${id}`)
      if (res.ok) set((s) => ({
        scenes: s.scenes.filter((sc) => sc.id !== id),
        activeSceneId: s.activeSceneId === id ? null : s.activeSceneId
      }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  // ══════════════════════════════════════
  // SHOTS
  // ══════════════════════════════════════

  fetchShots: async (sceneId) => {
    try {
      const res = await api.get(`/cinema/shots/${sceneId}`)
      if (res.ok) set((s) => ({
        shots: { ...s.shots, [sceneId]: res.data ?? [] }
      }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  setActiveShot: (id) => set({ activeShotId: id }),

  getActiveShot: () => {
    const { activeSceneId, activeShotId, shots } = get()
    if (!activeSceneId || !activeShotId) return null
    return (shots[activeSceneId] || []).find(s => s.id === activeShotId)
  },

  addShot: async (shotData) => {
    try {
      const res = await api.post('/cinema/shots', shotData)
      if (res.ok) set((s) => ({
        shots: {
          ...s.shots,
          [shotData.scene_id]: [...(s.shots[shotData.scene_id] || []), res.data]
        }
      }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  updateShot: async (id, updates) => {
    try {
      const res = await api.patch(`/cinema/shots/${id}`, updates)
      if (res.ok) set((s) => {
        const sceneId = res.data.scene_id
        return {
          shots: {
            ...s.shots,
            [sceneId]: s.shots[sceneId].map((sh) => sh.id === id ? { ...sh, ...res.data } : sh)
          }
        }
      })
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  removeShot: async (id, sceneId) => {
    try {
      const res = await api.delete(`/cinema/shots/${id}`)
      if (res.ok) set((s) => ({
        shots: {
          ...s.shots,
          [sceneId]: s.shots[sceneId].filter((sh) => sh.id !== id)
        },
        activeShotId: s.activeShotId === id ? null : s.activeShotId
      }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  }

}))
