import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import builderData from "@/data/builderData.json"

const DEFAULT_CHARACTER = {
    age: [25],
    Character_Type: "",
    Gender: "",
    "Ethnicity_-_Origin_Base": "",
    skin: null,
    Body_Type: "",
    Left_Arm: "",
    Right_Arm: "",
    Left_Leg: "",
    Right_Leg: "",
    Eye_Color: "",
    Skin_Conditions: "",
    "Eyes_-_Type": "",
    "Rendering_Style": ""
}

// Initial Root Node
const INITIAL_NODES = {
    "root": {
        id: "root",
        parentId: null,
        name: "Origin",
        imageUrl: null,
        data: DEFAULT_CHARACTER,
        prompt: "Initial creation"
    }
}

export const useCharacterStore = create(
    persist(
        (set, get) => ({
            nodes: INITIAL_NODES,
            activeNodeId: "root",
            characterData: DEFAULT_CHARACTER, // Current "working" state

            // Actions
            updateCharacterData: (key, value) => set((state) => ({
                characterData: { ...state.characterData, [key]: value }
            })),

            setActiveNode: (id) => {
                const node = get().nodes[id]
                if (node) {
                    set({
                        activeNodeId: id,
                        characterData: node.data
                    })
                }
            },

            createNew: () => {
                const id = "root-" + Date.now()
                const newNode = {
                    id,
                    parentId: null,
                    name: "New Project",
                    imageUrl: null,
                    data: DEFAULT_CHARACTER,
                    prompt: "New creation"
                }
                set((state) => ({
                    nodes: { ...state.nodes, [id]: newNode },
                    activeNodeId: id,
                    characterData: DEFAULT_CHARACTER
                }))
            },

            generateBranch: (prompt = "Refined variation") => {
                const { activeNodeId, characterData, nodes } = get()
                const id = "node-" + Date.now()

                const newNode = {
                    id,
                    parentId: activeNodeId,
                    name: "Variation",
                    imageUrl: null,
                    data: { ...characterData },
                    prompt
                }

                set({
                    nodes: { ...nodes, [id]: newNode },
                    activeNodeId: id
                })
            },

            randomize: () => {
                const { characterData } = get()
                const newData = { ...characterData }

                // 1. Basic Traits (100% Probability)
                const basicCategories = [
                    "Character_Type", "Gender", "Ethnicity_-_Origin_Base",
                    "Eye_Color", "Skin_Conditions", "Rendering_Style", "Body_Type"
                ]

                basicCategories.forEach(category => {
                    const items = builderData[category]
                    if (items && items.length > 0) {
                        const randomItem = items[Math.floor(Math.random() * items.length)]
                        newData[category] = randomItem.name
                    }
                })

                // 2. Advanced / Optional Traits (Probability: ~20%)
                const advancedCategories = [
                    "Left_Arm", "Right_Arm", "Left_Leg", "Right_Leg",
                    "Eyes_-_Type", "Eyes_-_Details", "Mouth_&_Teeth", "Ears", "Horns",
                    "Face_Skin_Material", "Surface_Pattern", "Hair_-_Head_Growth",
                    "Accessories_&_Markings"
                ]

                advancedCategories.forEach(category => {
                    if (Math.random() < 0.20) {
                        const items = builderData[category]
                        if (items && items.length > 0) {
                            const randomItem = items[Math.floor(Math.random() * items.length)]
                            newData[category] = randomItem.name
                        }
                    } else {
                        newData[category] = ""
                    }
                })

                // 3. Conflict Resolution
                if (newData.Character_Type === "Human" && Math.random() < 0.85) {
                    newData.Horns = ""
                    newData.Face_Skin_Material = ""
                    newData.Surface_Pattern = ""
                }

                const limbMutations = ["Left_Arm", "Right_Arm", "Left_Leg", "Right_Leg"]
                const activeLimbs = limbMutations.filter(limb => newData[limb] !== "")
                if (activeLimbs.length > 1 && Math.random() < 0.7) {
                    const limbToKeep = activeLimbs[Math.floor(Math.random() * activeLimbs.length)]
                    limbMutations.forEach(limb => {
                        if (limb !== limbToKeep) newData[limb] = ""
                    })
                }

                // 4. Age System
                const ageCategories = ["Young", "Adult", "Mature", "Senior"]
                const randomAgeCat = ageCategories[Math.floor(Math.random() * ageCategories.length)]
                if (randomAgeCat === "Young") newData.age = [12]
                if (randomAgeCat === "Adult") newData.age = [25]
                if (randomAgeCat === "Mature") newData.age = [45]
                if (randomAgeCat === "Senior") newData.age = [75]

                newData.skin = Math.floor(Math.random() * 12)

                set({ characterData: newData })
            }
        }),
        {
            name: "character-studio-storage",
            storage: createJSONStorage(() => localStorage)
        }
    )
)
