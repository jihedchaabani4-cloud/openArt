import { create } from 'zustand'
import { api } from '@/lib/api'

export const useAudioStore = create((set, get) => ({
  audios: [],
  loading: false,
  error: null,
  activeProjectId: null,

  fetchAudios: async (projectId) => {
    set({ loading: true, activeProjectId: projectId })
    try {
      const res = await api.get(`/audio?project_id=${projectId}`)
      if (res.ok) set({ audios: res.data ?? [] })
      else set({ audios: [] })
    } catch (err) {
      console.error("❌ fetchAudios error:", err)
      set({ audios: [] })
    } finally {
      set({ loading: false })
    }
  }
}))
