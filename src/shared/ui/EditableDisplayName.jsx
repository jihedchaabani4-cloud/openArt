"use client"

import * as React from "react"
import { Check, X } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

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
      try {
        await onSave?.(nextValue)
      } catch {
        setValue(displayName || "")
      }
    }

    setIsEditing(false)
  }

  const currentText = isEditing ? value : (displayName || placeholder)

  return (
    <div className={cn("inline-flex items-center gap-1.5 min-w-0 max-w-full", className)}>
      <div className="inline-grid items-center min-w-0 max-w-full">
        {/* Invisible mirror span sizing the grid column strictly to the content */}
        <span
          aria-hidden="true"
          className={cn(
            "invisible col-start-1 row-start-1 whitespace-pre px-2 py-1 text-md font-medium tracking-tight pointer-events-none select-none truncate overflow-hidden",
            inputClassName
          )}
        >
          {currentText || " "}
        </span>

        {/* Input overlaid on the exact same cell, adopting the text's natural width */}
        <Input
          ref={inputRef}
          type="text"
          variant="inline"
          value={currentText}
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
            "col-start-1 row-start-1 w-full bg-transparent border-none outline-none px-2 py-1 rounded-sm transition-all text-white",
            "hover:bg-white/5 focus:bg-white/10",
            inputClassName
          )}
          style={{ cursor: isEditing ? "text" : "pointer" }}
          aria-label="Display name"
        />
      </div>

      {isEditing && (
        <div className="flex items-center gap-1 shrink-0 animate-in fade-in zoom-in-95 duration-200">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onMouseDown={(e) => {
              e.preventDefault()
              handleSaveEdit()
            }}
            className="size-7 p-0 text-white/80 hover:text-white hover:bg-white/20 flex items-center justify-center shrink-0"
            title="Save"
          >
            <Check className="size-4" strokeWidth={2.5} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onMouseDown={(e) => {
              e.preventDefault()
              handleCancelEdit()
            }}
            className="size-7 p-0 text-white/80 hover:text-white hover:bg-white/20 flex items-center justify-center shrink-0"
            title="Cancel"
          >
            <X className="size-4" strokeWidth={2.5} />
          </Button>
        </div>
      )}
    </div>
  )
})

EditableDisplayName.displayName = "EditableDisplayName"
