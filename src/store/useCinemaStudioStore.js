// ============================================================
//  CINEMA STUDIO STORE
//  Zustand store — manages:
//    characters, character_versions, environments,
//    cinema_projects, scenes, shots
// ============================================================

import { create } from 'zustand'
import { api } from '@/lib/api'

export const useCinemaStore = create((set, get) => ({

  // ── State ──
  workspaceId:          null,
  loading:              false,
  error:                null,

  // Characters
  characters:           [],
  activeCharacterId:    null,
  characterVersions:    {}, // keyed by character_id

  // Environments
  environments:         [],
  activeEnvironmentId:  null,

  // Projects
  projects:             [],
  activeProjectId:      null,

  // Scenes
  scenes:               {},  // keyed by project_id
  activeSceneId:        null,

  // Shots
  shots:                {},   // keyed by scene_id
  activeShotId:         null,

  // ── Init: load everything ──
  init: async (workspaceId) => {
    set({ workspaceId, loading: true, error: null })
    try {
      await Promise.all([
        get().fetchCharacters(workspaceId),
        get().fetchEnvironments(workspaceId),
        get().fetchProjects(workspaceId),
      ])
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  // ══════════════════════════════════════
  // CHARACTERS
  // ══════════════════════════════════════

  fetchCharacters: async (workspaceId) => {
    try {
      const res = await api.get(`/cinema/characters/${workspaceId}`)
      if (res.ok) set({ characters: res.data ?? [] })
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  setActiveCharacter: (id) => set({ activeCharacterId: id }),

  addCharacter: async (characterData) => {
    try {
      const res = await api.post('/cinema/characters', characterData)
      if (res.ok) set((s) => ({ characters: [res.data, ...s.characters] }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  updateCharacter: async (id, updates) => {
    try {
      const res = await api.patch(`/cinema/characters/${id}`, updates)
      if (res.ok) {
        set((s) => ({
          characters: s.characters.map((c) => c.id === id ? { ...c, ...res.data } : c)
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  removeCharacter: async (id) => {
    try {
      const res = await api.delete(`/cinema/characters/${id}`)
      if (res.ok) {
        set((s) => ({
          characters: s.characters.filter((c) => c.id !== id),
          activeCharacterId: s.activeCharacterId === id ? null : s.activeCharacterId,
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  // ══════════════════════════════════════
  // CHARACTER VERSIONS
  // ══════════════════════════════════════

  fetchVersions: async (characterId) => {
    try {
      const res = await api.get(`/cinema/versions/${characterId}`)
      if (res.ok) {
        set((s) => ({
          characterVersions: { ...s.characterVersions, [characterId]: res.data ?? [] }
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  addVersion: async (versionData) => {
    try {
      const res = await api.post('/cinema/versions', versionData)
      if (res.ok) {
        const v = res.data
        set((s) => ({
          characterVersions: {
            ...s.characterVersions,
            [v.character_id]: [...(s.characterVersions[v.character_id] ?? []), v]
          }
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  updateVersion: async (id, updates) => {
    try {
      const res = await api.patch(`/cinema/versions/${id}`, updates)
      if (res.ok) {
        set((s) => {
          const updated = { ...s.characterVersions }
          for (const charId in updated) {
            updated[charId] = updated[charId].map((v) => v.id === id ? { ...v, ...res.data } : v)
          }
          return { characterVersions: updated }
        })
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  removeVersion: async (id, characterId) => {
    try {
      const res = await api.delete(`/cinema/versions/${id}`)
      if (res.ok) {
        set((s) => ({
          characterVersions: {
            ...s.characterVersions,
            [characterId]: (s.characterVersions[characterId] ?? []).filter((v) => v.id !== id)
          }
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  getVersions: (characterId) => get().characterVersions[characterId] ?? [],

  getActiveVersion: (characterId) => {
    const versions = get().characterVersions[characterId] ?? []
    return (
      versions.find((v) => v.soul_status === 'ready') ??
      versions.find((v) => v.frames?.front !== null) ??
      versions[0] ??
      null
    )
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
      if (res.ok) {
        set((s) => ({
          environments: s.environments.map((e) => e.id === id ? { ...e, ...res.data } : e)
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  removeEnvironment: async (id) => {
    try {
      const res = await api.delete(`/cinema/environments/${id}`)
      if (res.ok) {
        set((s) => ({
          environments: s.environments.filter((e) => e.id !== id),
          activeEnvironmentId: s.activeEnvironmentId === id ? null : s.activeEnvironmentId,
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  // ══════════════════════════════════════
  // PROJECTS
  // ══════════════════════════════════════

  fetchProjects: async (workspaceId) => {
    try {
      const res = await api.get(`/cinema/projects/${workspaceId}`)
      if (res.ok) set({ projects: res.data ?? [] })
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  setActiveProject: (id) => {
    set({ activeProjectId: id, activeSceneId: null, activeShotId: null })
    if (id) get().fetchScenes(id)
  },

  addProject: async (projectData) => {
    try {
      const res = await api.post('/cinema/projects', projectData)
      if (res.ok) set((s) => ({ projects: [res.data, ...s.projects] }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  updateProject: async (id, updates) => {
    try {
      const res = await api.patch(`/cinema/projects/${id}`, updates)
      if (res.ok) {
        set((s) => ({
          projects: s.projects.map((p) => p.id === id ? { ...p, ...res.data } : p)
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  removeProject: async (id) => {
    try {
      const res = await api.delete(`/cinema/projects/${id}`)
      if (res.ok) {
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  // ══════════════════════════════════════
  // SCENES
  // ══════════════════════════════════════

  fetchScenes: async (projectId) => {
    try {
      const res = await api.get(`/cinema/scenes/${projectId}`)
      if (res.ok) {
        set((s) => ({
          scenes: { ...s.scenes, [projectId]: res.data ?? [] }
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  setActiveScene: (id) => {
    set({ activeSceneId: id, activeShotId: null })
    if (id) get().fetchShots(id)
  },

  addScene: async (sceneData) => {
    try {
      const res = await api.post('/cinema/scenes', sceneData)
      if (res.ok) {
        const scene = res.data
        set((s) => ({
          scenes: {
            ...s.scenes,
            [scene.project_id]: [...(s.scenes[scene.project_id] ?? []), scene].sort((a, b) => a.scene_order - b.scene_order)
          }
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  updateScene: async (id, updates) => {
    try {
      const res = await api.patch(`/cinema/scenes/${id}`, updates)
      if (res.ok) {
        set((s) => {
          const updated = { ...s.scenes }
          for (const pid in updated) {
            updated[pid] = updated[pid].map((sc) => sc.id === id ? { ...sc, ...res.data } : sc)
          }
          return { scenes: updated }
        })
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  removeScene: async (id, projectId) => {
    try {
      const res = await api.delete(`/cinema/scenes/${id}`)
      if (res.ok) {
        set((s) => ({
          scenes: {
            ...s.scenes,
            [projectId]: (s.scenes[projectId] ?? []).filter((sc) => sc.id !== id)
          },
          activeSceneId: s.activeSceneId === id ? null : s.activeSceneId,
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  getScenes: (projectId) => get().scenes[projectId] ?? [],

  // ══════════════════════════════════════
  // SHOTS
  // ══════════════════════════════════════

  fetchShots: async (sceneId) => {
    try {
      const res = await api.get(`/cinema/shots/${sceneId}`)
      if (res.ok) {
        set((s) => ({
          shots: { ...s.shots, [sceneId]: res.data ?? [] }
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  setActiveShot: (id) => set({ activeShotId: id }),

  addShot: async (shotData) => {
    try {
      const res = await api.post('/cinema/shots', shotData)
      if (res.ok) {
        const shot = res.data
        set((s) => ({
          shots: {
            ...s.shots,
            [shot.scene_id]: [...(s.shots[shot.scene_id] ?? []), shot].sort((a, b) => a.shot_order - b.shot_order)
          }
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  updateShot: async (id, updates) => {
    try {
      const res = await api.patch(`/cinema/shots/${id}`, updates)
      if (res.ok) {
        set((s) => {
          const updated = { ...s.shots }
          for (const sid in updated) {
            updated[sid] = updated[sid].map((sh) => sh.id === id ? { ...sh, ...res.data } : sh)
          }
          return { shots: updated }
        })
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  removeShot: async (id, sceneId) => {
    try {
      const res = await api.delete(`/cinema/shots/${id}`)
      if (res.ok) {
        set((s) => ({
          shots: {
            ...s.shots,
            [sceneId]: (s.shots[sceneId] ?? []).filter((sh) => sh.id !== id)
          },
          activeShotId: s.activeShotId === id ? null : s.activeShotId,
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  getShots: (sceneId) => get().shots[sceneId] ?? [],

  reorderShots: (sceneId, shots) => set((s) => ({
    shots: { ...s.shots, [sceneId]: shots }
  })),

  // ══════════════════════════════════════
  // COMPUTED
  // ══════════════════════════════════════

  getActiveProject: () => {
    const { projects, activeProjectId } = get()
    return projects.find((p) => p.id === activeProjectId) ?? null
  },

  getActiveScene: () => {
    const { scenes, activeProjectId, activeSceneId } = get()
    if (!activeProjectId || !activeSceneId) return null
    return (scenes[activeProjectId] ?? []).find((s) => s.id === activeSceneId) ?? null
  },

  getActiveShot: () => {
    const { shots, activeSceneId, activeShotId } = get()
    if (!activeSceneId || !activeShotId) return null
    return (shots[activeSceneId] ?? []).find((s) => s.id === activeShotId) ?? null
  },

  getActiveCharacter: () => {
    const { characters, activeCharacterId } = get()
    return characters.find((c) => c.id === activeCharacterId) ?? null
  },

  reset: () => set({
    workspaceId:          null,
    loading:              false,
    error:                null,
    characters:           [],
    activeCharacterId:    null,
    characterVersions:    {},
    environments:         [],
    activeEnvironmentId:  null,
    projects:             [],
    activeProjectId:      null,
    scenes:               {},
    activeSceneId:        null,
    shots:                {},
    activeShotId:         null,
  }),
}))
