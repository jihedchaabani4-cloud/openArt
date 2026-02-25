"use client"

import { create } from "zustand"

// ─── Full DNA Schema (all keys used by BasicSettings + AdvancedSettings) ──────
const DEFAULT_DATA = {
    // Basic traits
    age: [25],
    Character_Type: "",
    Gender: "",
    "Ethnicity_-_Origin_Base": "",
    skin: null,
    Eye_Color: "",
    Skin_Conditions: "",
    // Advanced — Face
    "Eyes_-_Type": "",
    "Eyes_-_Details": "",
    "Mouth_&_Teeth": "",
    Ears: "",
    Horns: "",
    Face_Skin_Material: "",
    Surface_Pattern: "",
    // Advanced — Body
    Body_Type: "",
    Left_Arm: "",
    Right_Arm: "",
    Left_Leg: "",
    Right_Leg: "",
    // Advanced — Style
    "Hair_-_Head_Growth": "",
    "Accessories_&_Markings": "",
    Rendering_Style: "",
}

// ─── Store ─────────────────────────────────────────────────────────────────────
export const useStudioStore = create((set, get) => ({
    characters: [],
    nodes: {},
    activeCharacterId: null,
    activeNodeId: null,

    // ─── Selectors ───────────────────────────────────────────────────

    /**
     * getFullContext(nodeId)
     * Walks up tree → merges all data (DNA inheritance) + collects prompts
     * Returns: { prompts: string[], mergedData: object, path: node[] }
     */
    getFullContext: (nodeId) => {
        const { nodes } = get()
        const path = []
        let currentId = nodeId
        while (currentId) {
            const node = nodes[currentId]
            if (!node) break
            path.unshift(node)
            currentId = node.parentId
        }
        const prompts = path.map(n => n.prompt).filter(Boolean)
        const mergedData = path.reduce((acc, node) => ({ ...acc, ...node.data }), { ...DEFAULT_DATA })
        return { prompts, mergedData, path }
    },

    /**
     * getFinalPrompt(newInstruction)
     * Root DNA + ancestor path + new instruction → full AI prompt string
     */
    getFinalPrompt: (newInstruction = "") => {
        const { activeNodeId, getFullContext } = get()
        const { prompts, mergedData } = getFullContext(activeNodeId)
        const dnaPart = Object.entries(mergedData)
            .filter(([, v]) => v !== null && v !== "" && !(Array.isArray(v) && v[0] === 0))
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
            .join(", ")
        const historyPart = prompts.join(" → ")
        return [
            `[DNA] ${dnaPart}`,
            `[History] ${historyPart}`,
            newInstruction.trim() ? `[Instruction] ${newInstruction.trim()}` : ""
        ].filter(Boolean).join(" | ")
    },

    // ─── Actions ─────────────────────────────────────────────────────

    selectCharacter: (characterId) => {
        set({ activeCharacterId: characterId, activeNodeId: `${characterId}-root` })
    },

    selectNode: (nodeId) => {
        const { nodes } = get()
        if (nodes[nodeId]) set({ activeNodeId: nodeId })
    },

    /**
     * generateBranch — clones parent data (full DNA inheritance), creates child
     */
    generateBranch: async (params) => {
        const { activeNodeId, activeCharacterId, nodes } = get()
        const parentNode = nodes[activeNodeId]
        if (!parentNode) return

        const { instruction, negativePrompt = "", seed = "" } = params

        // Set a temporary "processing" node locally
        const tempNewId = `node-temp-${Date.now()}`
        const tempNode = {
            id: tempNewId,
            parentId: activeNodeId,
            characterId: activeCharacterId,
            imageUrl: parentNode.imageUrl,
            prompt: instruction,
            negativePrompt,
            seed,
            data: { ...parentNode.data },
            status: "processing",
            timestamp: Date.now()
        }

        set((state) => ({
            nodes: { ...state.nodes, [tempNewId]: tempNode },
            activeNodeId: tempNewId
        }))

        try {
            const response = await fetch(`http://localhost:5000/api/characters/${activeCharacterId}/branch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: null, // API handles name if null
                    traits: { ...parentNode.data },
                    prompt: instruction,
                    negative_prompt: negativePrompt,
                    seed: seed
                })
            })

            const json = await response.json()
            if (json.ok) {
                const backendNode = json.data
                const newId = `node-${backendNode.id}`
                const newNode = {
                    id: newId,
                    backendId: backendNode.id,
                    parentId: activeNodeId,
                    characterId: activeCharacterId,
                    imageUrl: backendNode.imageUrl,
                    prompt: instruction,
                    negativePrompt,
                    seed,
                    data: { ...backendNode.traits },
                    status: backendNode.status || "completed",
                    timestamp: Date.now()
                }
                set((state) => {
                    const newNodes = { ...state.nodes }
                    delete newNodes[tempNewId] // Remove temp node
                    return {
                        nodes: { ...newNodes, [newId]: newNode },
                        activeNodeId: newId
                    }
                })
                return newId
            }
        } catch (error) {
            console.error("Failed to generate branch via API:", error)
            // Update temp node to failed or just remove it
            set((state) => {
                const newNodes = { ...state.nodes }
                if (newNodes[tempNewId]) {
                    newNodes[tempNewId] = { ...newNodes[tempNewId], status: "failed" }
                }
                return { nodes: newNodes }
            })
            return tempNewId
        }
    },

    updateNodeImage: (nodeId, imageUrl) => {
        set((state) => ({
            nodes: { ...state.nodes, [nodeId]: { ...state.nodes[nodeId], imageUrl } }
        }))
    },

    /**
     * updateActiveNodeData — writes a trait directly into nodes[activeNodeId].data
     * Replaces updateCharacterData from the old useCharacterStore
     */
    updateActiveNodeData: (key, value) => {
        const { activeNodeId } = get()
        set((state) => ({
            nodes: {
                ...state.nodes,
                [activeNodeId]: {
                    ...state.nodes[activeNodeId],
                    data: { ...state.nodes[activeNodeId].data, [key]: value }
                }
            }
        }))
    },

    /**
     * createLocalDraft — creates a client-side only character + root node
     */
    createLocalDraft: () => {
        const id = `draft-${Date.now()}`
        const rootId = `${id}-root`
        const newCharacter = {
            id,
            name: "New Character",
            imageUrl: "",
            data: { ...DEFAULT_DATA },
            status: "completed",
            timestamp: Date.now(),
            isDraft: true
        }
        const rootNode = {
            id: rootId,
            parentId: null,
            characterId: id,
            imageUrl: "",
            prompt: "New Character",
            data: { ...DEFAULT_DATA },
            status: "completed",
            timestamp: Date.now()
        }
        set((state) => ({
            characters: [...state.characters, newCharacter],
            nodes: { ...state.nodes, [rootId]: rootNode },
            activeCharacterId: id,
            activeNodeId: rootId
        }))
        return id
    },

    /**
     * finalizeCharacter — syncs a local draft to the backend
     */
    finalizeCharacter: async (draftId, name) => {
        const { characters, nodes } = get()
        const char = characters.find(c => c.id === draftId)
        const rootNode = nodes[`${draftId}-root`]
        if (!char || !rootNode) return

        try {
            const response = await fetch("http://localhost:5000/api/characters/create-character", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    traits: rootNode.data
                })
            })

            const json = await response.json()
            if (json.ok) {
                const backendCharacter = json.data
                const newId = `char-${backendCharacter.id}`
                const newRootId = `${newId}-root`

                set((state) => {
                    // Replace draft with real character
                    const newChars = state.characters.map(c =>
                        c.id === draftId ? {
                            ...c,
                            id: newId,
                            backendId: backendCharacter.id,
                            name: name.trim(),
                            imageUrl: backendCharacter.imageUrl,
                            isDraft: false,
                            timestamp: Date.now()
                        } : c
                    )

                    // Replace root node
                    const newNodes = { ...state.nodes }
                    delete newNodes[`${draftId}-root`]
                    newNodes[newRootId] = {
                        ...rootNode,
                        id: newRootId,
                        characterId: newId,
                        imageUrl: backendCharacter.imageUrl,
                        prompt: `Origin character: ${name.trim()}`,
                        timestamp: Date.now()
                    }

                    return {
                        characters: newChars,
                        nodes: newNodes,
                        activeCharacterId: newId,
                        activeNodeId: newRootId
                    }
                })
                return newId
            }
        } catch (error) {
            console.error("Failed to finalize character:", error)
        }
    },

    /**
     * addCharacter — creates a new blank character + root node via API immediately
     */
    addCharacter: async (name) => {
        if (!name?.trim()) return
        const trimmedName = name.trim()

        try {
            const response = await fetch("http://localhost:5000/api/characters/create-character", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: trimmedName,
                    traits: { ...DEFAULT_DATA }
                })
            })

            const json = await response.json()
            if (json.ok) {
                const backendCharacter = json.data
                const id = `char-${backendCharacter.id}`
                const rootId = `${id}-root`

                const newCharacter = {
                    id,
                    backendId: backendCharacter.id,
                    name: trimmedName,
                    imageUrl: backendCharacter.imageUrl,
                    data: { ...backendCharacter.traits },
                    status: backendCharacter.status || "completed",
                    timestamp: Date.now()
                }

                const rootNode = {
                    id: rootId,
                    parentId: null,
                    characterId: id,
                    imageUrl: backendCharacter.imageUrl,
                    prompt: `Origin character: ${trimmedName}`,
                    data: { ...backendCharacter.traits },
                    status: backendCharacter.status || "completed",
                    timestamp: backendCharacter.created_at || Date.now()
                }

                set((state) => ({
                    characters: [...state.characters, newCharacter],
                    nodes: { ...state.nodes, [rootId]: rootNode },
                    activeCharacterId: id,
                    activeNodeId: rootId
                }))
                return id
            }
        } catch (error) {
            console.error("Failed to add character via API:", error)
            // Fallback to local creation
            const id = `char-${Date.now()}`
            const rootId = `${id}-root`
            const newCharacter = {
                id,
                name: trimmedName,
                imageUrl: "",
                data: { ...DEFAULT_DATA },
                timestamp: Date.now()
            }
            const rootNode = {
                id: rootId,
                parentId: null,
                characterId: id,
                imageUrl: "",
                prompt: `Origin character: ${trimmedName}`,
                data: { ...DEFAULT_DATA },
                timestamp: Date.now()
            }
            set((state) => ({
                characters: [...state.characters, newCharacter],
                nodes: { ...state.nodes, [rootId]: rootNode },
                activeCharacterId: id,
                activeNodeId: rootId
            }))
            return id
        }
    },

    /** removeCharacter — remove a character and all its nodes both locally and on backend */
    removeCharacter: async (characterId) => {
        const { characters } = get()
        const char = characters.find(c => c.id === characterId)

        // 1. Delete from Backend if exists
        if (char?.backendId) {
            try {
                await fetch(`http://localhost:5000/api/characters/${char.backendId}`, {
                    method: "DELETE"
                })
            } catch (error) {
                console.error("Failed to delete character from backend:", error)
            }
        }

        // 2. Update Local State
        set((state) => {
            const newChars = state.characters.filter(c => c.id !== characterId)
            const newNodes = {}
            Object.values(state.nodes).forEach(n => {
                if (n.characterId !== characterId) newNodes[n.id] = n
            })
            // If we removed the active character, fall back to first remaining
            const stillActive = newChars.some(c => c.id === state.activeCharacterId)
            const fallback = newChars[0]
            return {
                characters: newChars,
                nodes: newNodes,
                activeCharacterId: stillActive ? state.activeCharacterId : fallback?.id ?? null,
                activeNodeId: stillActive ? state.activeNodeId : fallback ? `${fallback.id}-root` : null
            }
        })
    },

    /** fetchCharacters — pull all characters from backend */
    fetchCharacters: async () => {
        try {
            const response = await fetch("http://localhost:5000/api/characters")
            const json = await response.json()

            if (json.ok && Array.isArray(json.data)) {
                const backendCharacters = json.data

                const newCharacters = backendCharacters.map(char => ({
                    id: `char-${char.id}`,
                    backendId: char.id,
                    name: char.name,
                    imageUrl: char.imageUrl || "",
                    data: char.traits || { ...DEFAULT_DATA },
                    status: char.status || "completed",
                    timestamp: char.created_at ? new Date(char.created_at).getTime() : Date.now()
                }))

                const newNodes = {}
                newCharacters.forEach((char, index) => {
                    const backendChar = backendCharacters[index]
                    const rootId = `${char.id}-root`
                    newNodes[rootId] = {
                        id: rootId,
                        parentId: null,
                        characterId: char.id,
                        imageUrl: char.imageUrl,
                        prompt: `Origin character: ${char.name}`,
                        data: { ...char.data },
                        status: backendChar.status || "completed",
                        timestamp: backendChar.created_at || Date.now()
                    }
                })

                set({
                    characters: newCharacters,
                    nodes: newNodes,
                    activeCharacterId: newCharacters[0]?.id || null,
                    activeNodeId: newCharacters[0] ? `${newCharacters[0].id}-root` : null
                })
            }
        } catch (error) {
            console.error("Failed to fetch characters from API:", error)
        }
    },

    /** updateCharacterName — rename a character and sync traits to backend */
    updateCharacterName: async (characterId, name) => {
        const { characters, nodes } = get();
        const char = characters.find(c => c.id === characterId);
        const rootNode = nodes[`${characterId}-root`];

        if (char?.backendId) {
            try {
                await fetch(`http://localhost:5000/api/characters/${char.backendId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: name.trim(),
                        traits: rootNode?.data || {}
                    })
                });
            } catch (error) {
                console.error("Failed to sync character update to backend:", error);
            }
        }

        set((state) => ({
            characters: state.characters.map(c =>
                c.id === characterId ? { ...c, name: name.trim() } : c
            )
        }))
    }
}))
