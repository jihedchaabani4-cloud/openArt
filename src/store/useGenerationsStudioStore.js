// ============================================================
//  CINEMA STUDIO STORE
//  Zustand store — manages project-based and session-based assets/generations
// ============================================================

import { create } from 'zustand'
import { api } from '@/lib/api'

export const useGenerationsStudioStore = create((set, get) => ({

  // ── State ──
  projectId:            null,
  activeSessionId:      null,
  loading:              false,
  error:                null,

  // Assets (Images/Videos)
  assets:               [],
  generations:          [],
  allGenerations:       [],
  allGenerationsPage:   1,
  allGenerationsHasMore: true,
  allGenerationsLoading: false,
  activeFilter:         'all', // 'all' or 'liked'
  studioMode:           'image', // 'image', 'video', 'cinema', 'audio'
  studioLayoutMode:     'grouped', // 'grouped' or 'grid'
  gridSize:             'lg', // 'sm', 'md', 'lg'

  setStudioLayoutMode: (mode) => set({ studioLayoutMode: mode }),
  setGridSize: (size) => set({ gridSize: size }),

  // Models
  studioModels:         [],
  studioModelsLoading:  true,

  // Characters
  characters:           [],

  // ── Init: load everything for a project ──
  init: async (projectId) => {
    set({ 
      projectId, 
      loading: true, 
      error: null,
      assets: [],
      generations: [],
      allGenerations: [],
      allGenerationsPage: 1,
      allGenerationsHasMore: true,
      activeFilter: 'all',
      characters: []
    })
    try {
      await Promise.all([
        get().fetchCharacters(projectId),
        get().fetchAssets(projectId),
        get().fetchAllGenerations(true),
        get().fetchStudioModels(),
      ])
    } catch (err) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  setActiveSessionId: (sessionId) => {
    set({ activeSessionId: sessionId })
    if (sessionId) {
      get().fetchGenerations(get().projectId, sessionId)
      get().fetchAssets(get().projectId, sessionId)
    } else {
      set({ generations: [], assets: [] })
    }
  },

  // ══════════════════════════════════════
  // ASSETS & GENERATIONS
  // ══════════════════════════════════════

  fetchAssets: async (projectId, sessionId) => {
    try {
      let url = `/generations/assets/${projectId}`
      if (sessionId) url += `?session_id=${sessionId}`
      const res = await api.get(url)
      if (res.ok) set({ assets: res.data ?? [] })
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  fetchGenerations: async (projectId, sessionId) => {
    try {
      let url = `/generations/generations/${projectId}`
      if (sessionId) url += `?session_id=${sessionId}`
      
      const res = await api.get(url)
      if (res.ok) set({ generations: res.data ?? [] })
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  fetchStudioModels: async () => {
    try {
      set({ studioModelsLoading: true })
      // Currently defaults to plan=free. Could be extended to read user profile.
      const res = await api.get('/models')
      if (res.models) set({ studioModels: res.models, studioModelsLoading: false })
      else throw new Error("No models returned")
    } catch (err) {
      console.error("Failed to fetch studio models:", err)
      set({ studioModelsLoading: false })
    }
  },

  addGenerationGroup: (group) => {
    if (!group) return;
    set((s) => ({
      generations: [group, ...s.generations]
    }));
  },

  fetchAllGenerations: async (reset = false) => {
    const { allGenerationsPage, allGenerations, allGenerationsLoading, allGenerationsHasMore } = get();
    
    if (allGenerationsLoading || (!reset && !allGenerationsHasMore)) return;
    
    const pageToFetch = reset ? 1 : allGenerationsPage;
    
    set({ allGenerationsLoading: true });
    try {
      const res = await api.get(`/generations/generations?page=${pageToFetch}&limit=10`)
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
  setStudioMode: (mode) => set({ studioMode: mode }),

  removeGeneration: async (group_id) => {
    try {
      const res = await api.delete(`/generations/generations/${group_id}`)
      if (res.ok) {
        set((s) => ({
          generations: s.generations.filter((g) => g.id !== group_id),
          allGenerations: s.allGenerations.filter((g) => g.id !== group_id)
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  removeGenerationItem: async (item_id, group_id) => {
    try {
      const res = await api.delete(`/generations/items/${item_id}`);
      if (res.ok) {
        set((s) => ({
          generations: s.generations.map((g) => {
            if (g.id !== group_id) return g;
            return { ...g, items: (g.items || []).filter(i => i.id !== item_id) };
          }).filter(g => g.items && g.items.length > 0),
          allGenerations: s.allGenerations.map((g) => {
            if (g.id !== group_id) return g;
            return { ...g, items: (g.items || []).filter(i => i.id !== item_id) };
          }).filter(g => g.items && g.items.length > 0)
        }));
      } else throw new Error(res.message);
    } catch (err) { set({ error: err.message }); }
  },

  retryGeneration: async (group) => {
    if (!group?.params) return;
    const { projectId, activeSessionId, removeGeneration, fetchAssets, fetchGenerations } = get();
    
    try {
      let endpoint = "/generations/generate";
      if (group.section === 'audio_generator' || group.section === 'audio_gen') {
        endpoint = "/audio/generate";
      } else if (!group.section || group.section === 'image_generator' || group.section === 'image_gen' || group.section === 'cinema_studio') {
        endpoint = "/images/generate"; 
      }

      const promptToUse = group.params?.prompt || group.items?.[0]?.prompt || "";
      const payload = { ...group.params, prompt: promptToUse, project_id: projectId, session_id: activeSessionId };
      const res = await api.post(endpoint, payload);
      
      if (res.ok) {
        await removeGeneration(group.id);
        await fetchAssets(projectId, activeSessionId);
        await fetchGenerations(projectId, activeSessionId);
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      set({ error: err.message });
      console.error("Retry failed:", err);
    }
  },

  generateMore: async (group) => {
    if (!group?.id) return;
    const { addGenerationGroup, fetchAssets } = get();
    
    try {
      const res = await api.post("/generations/show-more", { group_id: group.id });
      
      if (res.ok) {
        if (res.data) {
          addGenerationGroup(res.data);
        }
        await fetchAssets(get().projectId, get().activeSessionId);
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      set({ error: err.message });
      console.error("Generate more failed:", err);
    }
  },

  toggleLike: async (item_id, currentStatus) => {
    try {
      const res = await api.patch(`/generations/items/${item_id}/like`)
      if (res.ok) {
        set((s) => ({
          generations: s.generations.map((g) => ({
            ...g,
            items: g.items ? g.items.map((item) => 
              item.id === item_id ? { ...item, is_liked: !currentStatus } : item
            ) : []
          }))
        }))
      } else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  // ══════════════════════════════════════
  // CHARACTERS
  // ══════════════════════════════════════

  fetchCharacters: async (projectId) => {
    try {
      const res = await api.get(`/generations/characters/${projectId}`)
      if (res.ok) set({ characters: res.data ?? [] })
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  updateCharacter: async (id, updates) => {
    try {
      const res = await api.patch(`/generations/characters/${id}`, updates)
      if (res.ok) set((s) => ({
        characters: s.characters.map((c) => c.id === id ? { ...c, ...res.data } : c)
      }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  },

  removeCharacter: async (id) => {
    try {
      const res = await api.delete(`/generations/characters/${id}`)
      if (res.ok) set((s) => ({
        characters: s.characters.filter((c) => c.id !== id)
      }))
      else throw new Error(res.message)
    } catch (err) { set({ error: err.message }) }
  }

}))
