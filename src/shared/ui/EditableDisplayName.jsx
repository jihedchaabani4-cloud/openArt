"use client"

import * as React from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export const EditableDisplayName = React.forwardRef(({
  displayName,
  placeholder = "Untitled",
  onSave,
  onEditChange,
  className,
  inputClassName,
  maxLength = 120,
}, ref) => {
  const [isEditing, setIsEditing] = React.useState(false)
  const [value, setValue] = React.useState(displayName || "")
  const inputRef = React.useRef(null)

  React.useEffect(() => {
    onEditChange?.(isEditing)
  }, [isEditing, onEditChange])

  React.useImperativeHandle(ref, () => ({
    startEditing: () => {
      setIsEditing(true)
    }
  }))

  React.useEffect(() => {
    if (!isEditing) {
      setValue(displayName || "")
    }
  }, [displayName, isEditing])

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleStartEdit = () => {
    setValue(displayName || "")
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setValue(displayName || "")
    setIsEditing(false)
  }

  const handleSaveEdit = async () => {
    const nextValue = value.trim()
    const currentValue = String(displayName || "").trim()

    if (nextValue && nextValue !== currentValue) {
      await onSave?.(nextValue)
    }

    setIsEditing(false)
  }

  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <input
        ref={inputRef}
        type="text"
        value={isEditing ? value : (displayName || placeholder)}
        onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
        onFocus={handleStartEdit}
        onBlur={handleSaveEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") {
            handleCancelEdit()
            e.currentTarget.blur()
          }
        }}
        className={cn(
          "bg-transparent border-none outline-none px-2 py-1 rounded-md transition-all hover:bg-white/5 focus:bg-white/5 w-full min-w-[80px] text-white",
          inputClassName
        )}
        style={{ cursor: isEditing ? "text" : "default" }}
        aria-label="Display name"
      />

      {isEditing && (
        <div className="flex items-center gap-1.5 shrink-0 animate-in fade-in zoom-in-95 duration-200">
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              handleSaveEdit()
            }}
            className="p-1.5 text-white hover:bg-white/30 rounded-xl transition-all flex items-center justify-center"
            title="Save"
          >
            <Check className="size-5" strokeWidth={2.5} />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              handleCancelEdit()
            }}
            className="p-1.5 text-white hover:bg-white/30 rounded-xl transition-all flex items-center justify-center"
            title="Cancel"
          >
            <X className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  )
})

EditableDisplayName.displayName = "EditableDisplayName"
