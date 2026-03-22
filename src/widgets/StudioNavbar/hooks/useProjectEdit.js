import { useState, useRef, useEffect } from "react"

export function useProjectEdit(activeProjectId, selectedProjectName) {
    const [isEditingName, setIsEditingName] = useState(false)
    const [editedName, setEditedName] = useState("")
    const editInputRef = useRef(null)

    const handleStartEdit = () => {
        setEditedName(selectedProjectName)
        setIsEditingName(true)
    }

    const handleSaveEdit = async (updateFn) => {
        if (editedName.trim() && editedName.trim() !== selectedProjectName && activeProjectId) {
            await updateFn?.(activeProjectId, { project_name: editedName.trim() })
        }
        setIsEditingName(false)
    }

    const handleCancelEdit = () => {
        setIsEditingName(false)
        setEditedName("")
    }

    useEffect(() => {
        if (isEditingName && editInputRef.current) {
            editInputRef.current.focus()
            editInputRef.current.select()
        }
    }, [isEditingName])

    return {
        isEditingName,
        editedName,
        setEditedName,
        editInputRef,
        handleStartEdit,
        handleSaveEdit,
        handleCancelEdit
    }
}
