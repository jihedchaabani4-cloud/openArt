import { create } from 'zustand'
import { api } from '@/lib/api'

export const useAudioStore = create((set, get) => ({
  audios: [],
  loading: false,
  error: null,
  activeWorkspaceId: null,

  fetchAudios: async (workspaceId) => {
    set({ loading: true, activeWorkspaceId: workspaceId })
    try {
      const res = await api.get(`/audio?workspace_id=${workspaceId}`)
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
