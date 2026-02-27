"use client"

import { create } from "zustand"

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
    stagedDna: { ...DEFAULT_DNA }, // Local staging area for edits

    setStagedDna: (dna) => set({ stagedDna: dna }),

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
        if (!characterId) {
            set({ activeCharacterId: null, activeNodeId: null, stagedDna: { ...DEFAULT_DNA } })
            return
        }
        set({ activeCharacterId: characterId })
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
            const response = await fetch("http://localhost:5000/api/characters")
            const json = await response.json()
            if (json.ok) {
                set({ characters: json.data })
                if (!get().activeCharacterId && json.data.length > 0) {
                    await get().selectCharacter(json.data[0].id)
                }
            }
        } catch (error) {
            console.error("fetchCharacters failed:", error)
        }
    },

    /** fetchTree — pull all nodes for a specific character */
    fetchTree: async (characterId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/characters/${characterId}/tree`)
            const json = await response.json()
            if (json.nodes) {
                const nodeMap = {}
                json.nodes.forEach(n => {
                    nodeMap[n.id] = n
                })
                set((state) => {
                    const latestNodeId = json.nodes[json.nodes.length - 1]?.id || null
                    const existingActiveNode = state.nodes[state.activeNodeId]
                    const shouldUpdateActive = !state.activeNodeId || existingActiveNode?.character_id !== characterId

                    const nextActiveNodeId = shouldUpdateActive ? latestNodeId : state.activeNodeId
                    const nextStagedDna = JSON.parse(JSON.stringify(nodeMap[nextActiveNodeId]?.dna || nodeMap[nextActiveNodeId]?.data || DEFAULT_DNA))

                    return {
                        nodes: { ...state.nodes, ...nodeMap },
                        activeNodeId: nextActiveNodeId,
                        stagedDna: nextStagedDna
                    }
                })
            }
        } catch (error) {
            console.error("fetchTree failed:", error)
        }
    },

    /** createCharacter — Operation A */
    createCharacter: async (name, initialDna = DEFAULT_DNA, prompt = "") => {
        try {
            const body = { name, dna: initialDna };
            if (prompt) body.prompt = prompt;

            const response = await fetch("http://localhost:5000/api/characters/create-character", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
            const json = await response.json()
            if (json.character_id) {
                await get().fetchCharacters()
                return json.character_id
            }
            return null
        } catch (error) {
            console.error("createCharacter failed:", error)
            return null
        }
    },

    /** editNode — Operation B */
    editActiveNode: async (command) => {
        const { activeCharacterId, activeNodeId, nodes, getChanges } = get()
        if (!activeCharacterId) return

        // Fallback to latest node if activeNodeId is missing
        let parentId = activeNodeId
        if (!parentId) {
            const charNodes = Object.values(nodes).filter(n => n.character_id === activeCharacterId)
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

        // Temporary "Processing" state (character_id so panel shows spinner for this character)
        const tempId = `temp-${Date.now()}`
        set(state => ({
            nodes: {
                ...state.nodes,
                [tempId]: {
                    id: tempId,
                    character_id: activeCharacterId,
                    status: "processing",
                    edit_command: command || "Edit traits",
                    parent_id: activeNodeId,
                    created_at: new Date().toISOString()
                }
            },
            activeNodeId: tempId
        }))

        try {
            const response = await fetch("http://localhost:5000/api/characters/edit-node", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    character_id: activeCharacterId,
                    parent_node_id: activeNodeId.startsWith('temp') ? get().nodes[activeNodeId].parent_id : activeNodeId,
                    edit_command: command || "Edit traits",
                    changes: changes
                })
            })
            const json = await response.json()
            if (json.status === "success") {
                await get().fetchTree(activeCharacterId)
                return json.new_node_id
            }
        } catch (error) {
            console.error("editNode failed:", error)
            set(state => {
                const newNodes = { ...state.nodes }
                delete newNodes[tempId]
                return { nodes: newNodes, activeNodeId } // Fallback
            })
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

    /** removeCharacter — Operation C */
    removeCharacter: async (characterId) => {
        try {
            // First hit for confirmation/info, then with confirmed=true
            const response = await fetch(`http://localhost:5000/api/characters/${characterId}?confirmed=true`, {
                method: "DELETE"
            })
            const json = await response.json()
            if (json.status === "deleted") {
                await get().fetchCharacters()
            }
        } catch (error) {
            console.error("removeCharacter failed:", error)
        }
    }
}))
