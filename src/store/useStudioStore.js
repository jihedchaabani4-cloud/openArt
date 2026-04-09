import { create } from "zustand";

/**
 * useStudioStore
 * Mock store to satisfy Angles.jsx dependencies.
 */
export const useStudioStore = create((set) => ({
  stagedDna: {
    camera_dna: {
      rotation: 0,
      tilt: 0,
      zoom: 0
    },
    lighting_dna: {
      angle: 0,
      elevation: 0,
      intensity: 5,
      type: 'soft',
      brightness: 40,
      color: '#ffffff'
    }
  },
  setStagedDna: (stagedDna) => set({ stagedDna }),
  setCameraDna: (cameraDna) => set((state) => ({
    stagedDna: {
      ...state.stagedDna,
      camera_dna: cameraDna
    }
  })),
  setLightingDna: (lightingDna) => set((state) => ({
    stagedDna: {
      ...state.stagedDna,
      lighting_dna: lightingDna
    }
  })),
  characters: [],
  fetchCharacters: async () => {},
  activeCharacterId: null,
  selectCharacter: () => {},
  isCreating: false,
  setIsCreating: () => {},
  initSocket: () => {},
  isConnected: false,
}));
