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

// ─── DNA v3.0 Schema (Nested Structure) ──────────────────────────
export const DEFAULT_DNA = {
    character_name: "",
    identity_dna: {
        core: {
            character_type: "Human",
            gender: "Female",
            ethnicity: "Caucasian",
            age_stage: "Adult",
            eye_color: "Blue",
            skin_conditions: []
        },
        sculpt: {
            eye_details: "Normal",
            nose: "Default",
            lips: "Natural",
            jawline: "Soft",
            mouth_teeth: "Normal",
            ears: "Human",
            horns: "None",
            face_skin_material: "Normal",
            surface_pattern: "None"
        }
    },
    physical_dna: {
        body_type: "Slim",
        height: "Average",
        left_arm: "Normal arm",
        right_arm: "Normal arm",
        left_leg: "Normal leg",
        right_leg: "Normal leg",
        modifications: []
    },
    style_dna: {
        hair: {
            style: "Long straight",
            color: "Blonde"
        },
        rendering_style: "Photorealistic",
        outfit: "Casual wear",
        accessories: [],
        markings: []
    },
    environment: {
        location: "Outdoor",
        lighting: "Natural sun",
        weather: "",
        time_of_day: "Daytime"
    },
    expression_dna: {
        emotion: "Neutral",
        gaze_direction: "Frontal"
    },
    camera_dna: {
        rotation: 0,
        tilt: 0,
        zoom: 0
    },
    flux_metadata: {
        seed: 0,
        pulid_weight: 0.75,
        edit_type: "text-to-image",
        mask_target: "",
        generated_prompt: ""
    }
}

// ─── Store ─────────────────────────────────────────────────────────────────────
export const useStudioStore = create((set, get) => ({
    characters: [], // List of characters from backend
    nodes: {},      // Flattened node map { [nodeId]: node }
    activeCharacterId: null,
    activeNodeId: null,
    selectedNodeId: null, // Single ID of node dragged into the prompt bar
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
                    get().fetchCharacters()
                }

                return newState
            })
        })

        set({ socket })
    },

    setIsCreating: (val) => set({ isCreating: val }),
    setCreationPrompt: (prompt) => set({ creationPrompt: prompt }),
    setCreationTab: (tab) => set({ creationTab: tab }),
    setStagedDna: (dna) => set({ stagedDna: dna }),

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

    /** fetchCharacters — pull all characters summary */
    fetchCharacters: async () => {
        try {
            const json = await api.get("/characters")
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
        try {
            const json = await api.post("/characters/create-character", { name, dna, prompt })
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

    randomizeDna: () => {
        const dna = JSON.parse(JSON.stringify(DEFAULT_DNA))
        
        const getRandom = (arr) => arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)].name : null

        // Identity Core
        dna.identity_dna.core.character_type = getRandom(builderData["Character_Type"]) || "Human"
        dna.identity_dna.core.gender = getRandom(builderData["Gender"]) || "Female"
        dna.identity_dna.core.ethnicity = getRandom(builderData["Ethnicity_-_Origin_Base"]) || "Caucasian"
        dna.identity_dna.core.eye_color = getRandom(builderData["Eye_Color"]) || "Blue"
        
        const ages = ["Young", "Adult", "Mature", "Senior"]
        const ageMap = { Young: 12, Adult: 25, Mature: 45, Senior: 75 }
        const randomAge = ages[Math.floor(Math.random() * ages.length)]
        dna.identity_dna.core.age_stage = randomAge
        dna.identity_dna.core.age = ageMap[randomAge]

        // Sculpt
        dna.identity_dna.sculpt.eye_details = getRandom(builderData["Eyes_-_Type"]) || "Normal"
        dna.identity_dna.sculpt.mouth_teeth = getRandom(builderData["Mouth_&_Teeth"]) || "Normal"
        dna.identity_dna.sculpt.ears = getRandom(builderData["Ears"]) || "Human"
        dna.identity_dna.sculpt.horns = getRandom(builderData["Horns"]) || "None"
        dna.identity_dna.sculpt.face_skin_material = getRandom(builderData["Face_Skin_Material"]) || "Normal"
        dna.identity_dna.sculpt.surface_pattern = getRandom(builderData["Surface_Pattern"]) || "None"

        // Physical
        dna.physical_dna.body_type = getRandom(builderData["Body_Type"]) || "Slim"
        dna.physical_dna.left_arm = getRandom(builderData["Left_Arm"]) || "Normal arm"
        dna.physical_dna.right_arm = getRandom(builderData["Right_Arm"]) || "Normal arm"
        dna.physical_dna.left_leg = getRandom(builderData["Left_Leg"]) || "Normal leg"
        dna.physical_dna.right_leg = getRandom(builderData["Right_Leg"]) || "Normal leg"

        // Style
        dna.style_dna.hair.style = getRandom(builderData["Hair_-_Head_Growth"]) || "Long straight"
        dna.style_dna.rendering_style = getRandom(builderData["Rendering_Style"]) || "Photorealistic"
        
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
