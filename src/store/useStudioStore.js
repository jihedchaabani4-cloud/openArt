"use client"

import { create } from "zustand"
import builderData from "@/data/builderData.json"
import { io } from "socket.io-client"
import { api } from "@/lib/api"

// ─── Utils ───────────────────────────────────────────────────────
const mergeDeep = (target, source) => {
    const isObject = (obj) => obj && typeof obj === 'object' && !Array.isArray(obj)
    if (!isObject(target) || !isObject(source)) return source

    Object.keys(source).forEach(key => {
        const targetValue = target[key]
        const sourceValue = source[key]
        if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = mergeDeep({ ...targetValue }, sourceValue)
        } else {
            target[key] = sourceValue
        }
    })
    return target
}

// ─── DNA v4.0 Schema (Selector DNA) ──────────────────────────
export const DEFAULT_DNA = {
  version: 4,
  identity_dna: {
    core: {
      character_type: "Human",
      gender: "Female",
      ethnicity: "Caucasian",
      eye_color: "Blue",
      age_stage: "Adult"
    },
    sculpt: {
      eye_details: "Normal",
      mouth_teeth: "Normal",
      ears: "Human",
      horns: "None",
      face_skin_material: "Normal",
      surface_pattern: "None"
    }
  },
  physical_dna: {
    body_type: "Slim",
    left_arm: "Normal arm",
    right_arm: "Normal arm",
    left_leg: "Normal leg",
    right_leg: "Normal leg"
  },
  style_dna: {
    hair: {
      style: "Long hair"
    },
    rendering_style: "Photorealistic",
    accessories: []
  }
}

// ─── Store ─────────────────────────────────────────────────────────────────────
export const useStudioStore = create((set, get) => ({
    characters: [], // List of characters from backend
    workspaces: [], // List of workspaces from backend
    nodes: {},      // Flattened node map { [nodeId]: node }
    activeCharacterId: null,
    activeNodeId: null,
    activeWorkspaceId: null,
    selectedNodeId: null, // Single ID of node dragged into the prompt bar
    studioMode: "image", // "image" or "cinema"
    stagedDna: { ...DEFAULT_DNA }, // Local staging area for edits
    creationPrompt: "",
    creationTab: "builder",
    isCreating: false,
    characterName: "New Character",
    socket: null,
    isConnected: false,

    initSocket: () => {
        if (get().socket) return

        const socket = io("http://localhost:5000")
        
        socket.on("connect", () => {
            console.log("🔌 Connected to WebSocket")
            set({ isConnected: true })
            socket.emit("join_creation_room")
            
            // If we have an active character, rejoin its room
            const charId = get().activeCharacterId
            if (charId) {
                socket.emit("join_character_room", charId)
            }
        })

        socket.on("disconnect", () => {
            console.log("🔌 Disconnected from WebSocket")
            set({ isConnected: false })
        })

        socket.on("node_update", (updatedNode) => {
            console.log("🔌 Received node update:", updatedNode)
            
            set((state) => {
                const newNodes = { ...state.nodes }
                
                // Remove any temp nodes for this character if we get a real one
                Object.keys(newNodes).forEach(id => {
                    if (id.startsWith('temp-') && newNodes[id].character_id === updatedNode.character_id) {
                        delete newNodes[id]
                    }
                })

                newNodes[updatedNode.id] = {
                    ...newNodes[updatedNode.id],
                    ...updatedNode
                }

                const isCurrentNode = state.activeNodeId === updatedNode.id || state.activeNodeId?.startsWith('temp-')
                const newState = { nodes: newNodes }

                // If this is the active node and it just finished, update staged DNA to reflect new reality
                if (isCurrentNode && updatedNode.status === "completed") {
                    newState.activeNodeId = updatedNode.id
                    newState.stagedDna = JSON.parse(JSON.stringify(updatedNode.dna || DEFAULT_DNA))
                }

                // If a node is completed or error, refresh the character list to get the latest thumbnail/status
                if (updatedNode.status === "completed" || updatedNode.status === "error") {
                    // Update locally first for immediate feedback
                    newState.characters = state.characters.map(c => {
                        if (c.id === updatedNode.character_id) {
                            return { 
                                ...c, 
                                status: updatedNode.status,
                                imageUrl: updatedNode.image_url || c.imageUrl
                            }
                        }
                        return c
                    })
                    
                    // Then fetch from server to be sure
                    // get().fetchCharacters()
                }

                return newState
            })
        })

        set({ socket })
    },

    setIsCreating: (val) => set({ isCreating: val }),
    setStudioMode: (mode) => set({ studioMode: mode }),
    setCreationPrompt: (prompt) => set({ creationPrompt: prompt }),
    setCreationTab: (tab) => set({ creationTab: tab }),
    setStagedDna: (dna) => set({ stagedDna: dna }),
    setActiveWorkspaceId: (id) => {
        // Clear workspace-specific data to avoid showing old data
        set({ 
            activeWorkspaceId: id,
            characters: [],
            nodes: {},
            activeCharacterId: null,
            activeNodeId: null,
            selectedNodeId: null
        })
        get().fetchCharacters()
    },

    // ─── Selection Actions ──────────────────────────────────────────
    setNodeSelection: (nodeId) => set({ selectedNodeId: nodeId }),
    
    clearNodeSelection: () => set({ selectedNodeId: null }),

    updateStagedDna: (path, value) => {
        set((state) => {
            const newDna = JSON.parse(JSON.stringify(state.stagedDna))
            const keys = path.split('.')
            let current = newDna
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {}
                current = current[keys[i]]
            }
            current[keys[keys.length - 1]] = value
            console.log(`🧬 DNA Staged Update [${path}]:`, value);
            return { stagedDna: newDna }
        })
    },

    // ─── Selectors ───────────────────────────────────────────────────

    getFullContext: (nodeId) => {
        const { nodes } = get()
        const path = []
        let currentId = nodeId
        while (currentId) {
            const node = nodes[currentId]
            if (!node) break
            path.unshift(node)
            currentId = node.parentId || node.parent_id
        }
        // Merge DNA from root to this node
        const mergedDna = path.reduce((acc, node) => {
            const nodeDna = node.dna || node.data || {}
            return mergeDeep(acc, nodeDna)
        }, { ...DEFAULT_DNA })

        return { path, mergedDna }
    },

    getChanges: () => {
        const { nodes, activeNodeId, stagedDna } = get()
        const activeNode = nodes[activeNodeId]
        if (!activeNode) return {}

        const baseDna = activeNode.dna || activeNode.data || { ...DEFAULT_DNA }
        const diff = {}
        const compare = (obj1, obj2, target) => {
            for (const key in obj2) {
                if (typeof obj2[key] === 'object' && !Array.isArray(obj2[key])) {
                    const subDiff = {}
                    compare(obj1[key] || {}, obj2[key], subDiff)
                    if (Object.keys(subDiff).length > 0) target[key] = subDiff
                } else if (obj1[key] !== obj2[key]) {
                    target[key] = obj2[key]
                }
            }
        }
        compare(baseDna, stagedDna, diff)
        return diff
    },

    // ─── Actions ─────────────────────────────────────────────────────

    selectCharacter: async (characterId) => {
        const { socket, activeCharacterId } = get()

        // 1. Leave old character room if exists
        if (socket && activeCharacterId) {
            socket.emit("leave_character_room", activeCharacterId)
        }

        if (!characterId) {
            set({ activeCharacterId: null, activeNodeId: null, stagedDna: { ...DEFAULT_DNA } })
            return
        }

        // 2. Join new character room
        if (socket) {
            socket.emit("join_character_room", characterId)
        }

        set({ activeCharacterId: characterId, isCreating: false })
        await get().fetchTree(characterId)
    },

    selectNode: (nodeId) => {
        const node = get().nodes[nodeId]
        set({
            activeNodeId: nodeId,
            stagedDna: JSON.parse(JSON.stringify(node?.dna || node?.data || DEFAULT_DNA))
        })
    },

    /** fetchWorkspaces — pull all workspaces */
    fetchWorkspaces: async () => {
        try {
            const json = await api.get("/workspaces")
            if (json.ok) {
                set({ workspaces: json.data })
                if (!get().activeWorkspaceId && json.data.length > 0) {
                    get().setActiveWorkspaceId(json.data[0].id)
                }
            }
        } catch (error) {
            console.error("❌ fetchWorkspaces failed:", error.message)
        }
    },

    /** createWorkspace — create new workspace in DB */
    createWorkspace: async (name) => {
        try {
            const json = await api.post("/workspaces", { 
                name
            })
            if (json.ok) {
                set(state => ({
                    workspaces: [...state.workspaces, json.data]
                }))
                get().setActiveWorkspaceId(json.data.id)
                return json.data
            }
        } catch (error) {
            console.error("❌ createWorkspace failed:", error.message)
        }
    },

    /** updateWorkspace — rename workspace */
    updateWorkspace: async (id, name) => {
        try {
            const json = await api.patch(`/workspaces/${id}`, { name })
            if (json.ok) {
                set(state => ({
                    workspaces: state.workspaces.map(ws => ws.id === id ? json.data : ws)
                }))
                return json.data
            }
        } catch (error) {
            console.error("❌ updateWorkspace failed:", error.message)
        }
    },

    /** deleteWorkspace — remove workspace */
    deleteWorkspace: async (id) => {
        try {
            const json = await api.delete(`/workspaces/${id}`)
            if (json.ok) {
                const newWorkspaces = get().workspaces.filter(ws => ws.id !== id)
                set({ workspaces: newWorkspaces })
                if (get().activeWorkspaceId === id) {
                    if (newWorkspaces.length > 0) {
                        get().setActiveWorkspaceId(newWorkspaces[0].id)
                    } else {
                        set({ activeWorkspaceId: null, characters: [], nodes: {} })
                    }
                }
                return true
            }
        } catch (error) {
            console.error("❌ deleteWorkspace failed:", error.message)
        }
    },

    /** emptyWorkspace — clear all assets and generations */
    emptyWorkspace: async (id) => {
        try {
            const json = await api.post(`/workspaces/${id}/empty`)
            if (json.ok) {
                // Refresh characters and nodes if this is the active workspace
                if (get().activeWorkspaceId === id) {
                    get().fetchCharacters()
                    // If you have a cinema store, you might need to refresh it too
                    // But here we just clear local state for simplicity
                    set({ nodes: {}, activeCharacterId: null, activeNodeId: null })
                }
                return true
            }
        } catch (error) {
            console.error("❌ emptyWorkspace failed:", error.message)
        }
    },

    /** fetchCharacters — pull all characters summary */
    fetchCharacters: async () => {
        const { activeWorkspaceId } = get()
        if (!activeWorkspaceId) return;

        try {
            const url = `/characters?workspace_id=${activeWorkspaceId}`
            const json = await api.get(url)
            if (json.ok) {
                set({ characters: json.data })
                if (!get().activeCharacterId && !get().isCreating && json.data.length > 0) {
                    await get().selectCharacter(json.data[0].id)
                }
            }
        } catch (error) {
            console.error("❌ fetchCharacters failed:", error.message)
        }
    },

    /** fetchTree — pull all nodes for a specific character */
    fetchTree: async (characterId) => {
        try {
            const json = await api.get(`/characters/${characterId}/tree`)
            const nodesMap = {}
            json.nodes.forEach(node => {
                nodesMap[node.id] = node
            })
            set({ nodes: nodesMap })

            // Auto-select newest node if none active
            if (json.nodes.length > 0) {
                const newest = json.nodes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                get().selectNode(newest.id)
            }
        } catch (error) {
            console.error("fetchTree failed:", error)
        }
    },

    /** createCharacter — Operation A */
    createCharacter: async (name, dna, prompt) => {
        const { activeWorkspaceId } = get()
        console.log("🧬 Sending DNA to Backend (Create):", JSON.stringify(dna, null, 2));
        try {
            const json = await api.post("/characters/create-character", { 
                name, 
                dna, 
                prompt,
                workspace_id: activeWorkspaceId
            })
            if (json.character_id) {
                // Add the character and its root node to the store immediately as "processing"
                set(state => ({
                    characters: [
                        {
                            id: json.character_id,
                            name: name,
                            status: "processing",
                            root_node_id: json.root_node_id,
                            timestamp: Date.now()
                        },
                        ...state.characters
                    ],
                    nodes: {
                        ...state.nodes,
                        [json.root_node_id]: {
                            id: json.root_node_id,
                            character_id: json.character_id,
                            dna: dna,
                            status: "processing",
                            created_at: new Date().toISOString()
                        }
                    },
                    activeCharacterId: json.character_id,
                    activeNodeId: json.root_node_id,
                    isCreating: false // Creation dialog is done, now we show the "Generating" state in the panel
                }))

                // Join the character room for updates
                const socket = get().socket
                if (socket) {
                    socket.emit("join_character_room", json.character_id)
                }

                return json.character_id
            }
        } catch (error) {
            console.error("createCharacter failed:", error)
        }
    },

    /** editNode — Operation B */
    editActiveNode: async (command, targetNodeId = null) => {
        const { activeCharacterId, activeNodeId, nodes, getChanges, selectNode } = get()
        if (!activeCharacterId) return

        // Use provided targetNodeId or fall back to activeNodeId
        let parentId = targetNodeId || activeNodeId
        
        // If we switched targetNodeId, we should select it first to ensure DNA context is right
        if (targetNodeId && targetNodeId !== activeNodeId) {
            selectNode(targetNodeId)
        }

        // Fallback to latest node if parentId is still missing
        if (!parentId) {
            const charNodes = Object.values(nodes).filter(n => (n.character_id || n.characterId) === activeCharacterId)
            if (charNodes.length > 0) {
                parentId = charNodes[charNodes.length - 1].id
            }
        }

        if (!parentId) {
            console.error("No parent node found for edit")
            return
        }

        const changes = getChanges()
        console.log("🧬 Sending DNA Changes to Backend:", JSON.stringify(changes, null, 2));
        if (Object.keys(changes).length === 0 && !command) {
            console.log("No changes to apply")
            return
        }

        // Temporary "Processing" state
        const tempId = `temp-${Date.now()}`
        set(state => ({
            characters: state.characters.map(c => 
                c.id === activeCharacterId ? { ...c, status: "processing" } : c
            ),
            nodes: {
                ...state.nodes,
                [tempId]: {
                    id: tempId,
                    character_id: activeCharacterId,
                    status: "processing",
                    edit_command: command || "Edit traits",
                    parent_id: parentId,
                    created_at: new Date().toISOString()
                }
            },
            activeNodeId: tempId
        }))

        try {
            const json = await api.post("/characters/edit-node", {
                character_id: activeCharacterId,
                parent_node_id: parentId.startsWith('temp') ? get().nodes[parentId].parent_id : parentId,
                edit_command: command || "Edit traits",
                changes: changes
            })
            if (json.status === "success") {
                return json.new_node_id
            }
        } catch (error) {
            console.error("editNode failed:", error)
            alert(error.message || "Failed to start edit generation")
            set(state => {
                const newNodes = { ...state.nodes }
                delete newNodes[tempId]
                return { nodes: newNodes, activeNodeId: parentId } // Fallback to parent
            })
        }
    },

    regenerateNode: async (nodeId) => {
        const node = get().nodes[nodeId];
        console.log(`🧬 Regenerating Node ${nodeId} with DNA:`, JSON.stringify(node?.dna, null, 2));
        try {
            const json = await api.post("/characters/regenerate-node", { node_id: nodeId })
            return json.status === "success"
        } catch (error) {
            console.error("regenerateNode failed:", error)
            alert(error.message || "Failed to regenerate node")
            return false
        }
    },

    /** updateActiveNodeData — updates stagedDna instead of the node! */
    updateActiveNodeData: (path, value) => {
        set((state) => {
            const newStaged = JSON.parse(JSON.stringify(state.stagedDna))
            const parts = path.split('.')
            let current = newStaged

            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {}
                current = current[parts[i]]
            }
            current[parts[parts.length - 1]] = value

            return { stagedDna: newStaged }
        })
    },

    /** removeNode — Delete specific node from tree */
    removeNode: async (nodeId) => {
        try {
            const json = await api.post(`/characters/delete-node`, { node_id: nodeId })
            if (json.status === "success") {
                const charId = get().activeCharacterId
                if (charId) {
                    await get().fetchTree(charId) // Refresh tree to see remaining nodes
                }
            } else if (json.status === "character_deleted") {
                // If the whole character was deleted (last node), refresh character list
                set({ 
                    activeCharacterId: null, 
                    activeNodeId: null, 
                    nodes: {}, 
                     characterName: "New Character",
                     isCreating: true,
                     creationPrompt: "",
                     creationTab: "builder",
                     stagedDna: JSON.parse(JSON.stringify(DEFAULT_DNA))
                  })
                 await get().fetchCharacters()
            }
        } catch (error) {
            console.error("removeNode failed:", error)
            alert(error.message || "Failed to delete node")
        }
    },

    renameCharacter: async (characterId, newName) => {
        try {
            const json = await api.post(`/characters/${characterId}/rename`, { name: newName })
            if (json.status === "success") {
                set(state => ({
                    characters: state.characters.map(c => 
                        c.id === characterId ? { ...c, name: newName } : c
                    ),
                    characterName: characterId === state.activeCharacterId ? newName : state.characterName
                }))
            }
        } catch (error) {
            console.error("renameCharacter failed:", error)
        }
    },

    /** removeCharacter — Operation C */
    removeCharacter: async (characterId) => {
        try {
            // First hit for confirmation/info, then with confirmed=true
            const json = await api.delete(`/characters/${characterId}?confirmed=true`)
            if (json.status === "deleted") {
                // If the deleted character was the active one, reset state
                if (get().activeCharacterId === characterId) {
                    set({ 
                        activeCharacterId: null, 
                        activeNodeId: null, 
                        nodes: {}, 
                        characterName: "New Character",
                        isCreating: true,
                        creationPrompt: "",
                        creationTab: "builder",
                        stagedDna: JSON.parse(JSON.stringify(DEFAULT_DNA))
                    })
                }
                await get().fetchCharacters()
            }
        } catch (error) {
            console.error("removeCharacter failed:", error)
            alert(error.message || "Failed to delete character")
        }
    },

    /** randomizeDna — Randomizes all selector fields using builderData */
    randomizeDna: () => {
        const getRandom = (key) => {
            const items = builderData[key] || []
            if (items.length === 0) return null
            return items[Math.floor(Math.random() * items.length)].name
        }
        
        const dna = JSON.parse(JSON.stringify(DEFAULT_DNA))
        
        // Identity Core
        dna.identity_dna.core.character_type = getRandom("Character_Type") || "Human"
        dna.identity_dna.core.gender = getRandom("Gender") || "Female"
        dna.identity_dna.core.ethnicity = getRandom("Ethnicity_-_Origin_Base") || "Caucasian"
        dna.identity_dna.core.eye_color = getRandom("Eye_Color") || "Blue"
        dna.identity_dna.core.age_stage = ["Young", "Adult", "Mature", "Senior"][Math.floor(Math.random() * 4)]

        // Sculpt
        dna.identity_dna.sculpt.eye_details = getRandom("Eyes_-_Type") || "Normal"
        dna.identity_dna.sculpt.mouth_teeth = getRandom("Mouth_&_Teeth") || "Normal"
        dna.identity_dna.sculpt.ears = getRandom("Ears") || "Human"
        dna.identity_dna.sculpt.horns = getRandom("Horns") || "None"
        dna.identity_dna.sculpt.face_skin_material = getRandom("Face_Skin_Material") || "Normal"
        dna.identity_dna.sculpt.surface_pattern = getRandom("Surface_Pattern") || "None"

        // Physical
        dna.physical_dna.body_type = getRandom("Body_Type") || "Slim"
        dna.physical_dna.left_arm = getRandom("Right_Arm") || "Normal arm" // Using Right_Arm pool for both
        dna.physical_dna.right_arm = getRandom("Right_Arm") || "Normal arm"
        dna.physical_dna.left_leg = getRandom("Right_Leg") || "Normal leg"
        dna.physical_dna.right_leg = getRandom("Right_Leg") || "Normal leg"

        // Style
        dna.style_dna.hair.style = getRandom("Hair_-_Head_Growth") || "Long hair"
        dna.style_dna.rendering_style = getRandom("Rendering_Style") || "Photorealistic"
        
        // Accessories (randomly pick 0-2)
        const accs = builderData["Accessories_&_Markings"] || []
        if (accs.length > 0) {
            const count = Math.floor(Math.random() * 3)
            const picked = []
            for(let i=0; i<count; i++) {
                picked.push(accs[Math.floor(Math.random() * accs.length)].name)
            }
            dna.style_dna.accessories = [...new Set(picked)]
        }

        set({ stagedDna: dna })
    }
}))
