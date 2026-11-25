"use client"

import * as React from "react"
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { cn } from "@/shared/lib/utils"
import { Button } from "@/components/base/button"
import { Input } from "@/components/base/input"

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
    <div className={cn("inline-flex items-center gap-1 min-w-0 max-w-full", className)}>
      {!isEditing ? (
        <button
          type="button"
          onClick={handleStartEdit}
          aria-label="Edit display name"
          className={cn(
            "inline-flex items-center min-w-0 max-w-full px-1.5 rounded-subtle truncate text-left text-text-primary",
            "hover:bg-surface-card transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-heavy",
            inputClassName
          )}
        >
          <span className="truncate">{currentText}</span>
        </button>
      ) : (
        <>
          <div className="inline-grid items-center min-w-[3.5rem] max-w-full">
            {/* Invisible mirror span sizing the grid column strictly to the typed text */}
            <span
              aria-hidden="true"
              className={cn(
                "invisible col-start-1 row-start-1 whitespace-pre px-2 ds-type-small pointer-events-none select-none truncate overflow-hidden",
                inputClassName
              )}
            >
              {currentText || " "}
            </span>

            {/* Auto-sizing input (`size={1}` removes default 20ch intrinsic min-width) */}
            <Input
              ref={inputRef}
              type="text"
              variant="inline"
              size={1}
              spellCheck={false}
              value={currentText}
              onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur()
                if (e.key === "Escape") {
                  handleCancelEdit()
                  e.currentTarget.blur()
                }
              }}
              containerClassName="col-start-1 row-start-1 min-w-0"
              className={cn(
                "w-full h-7 px-2 rounded-subtle bg-surface-card ring-1 ring-border-subtle focus-within:ring-border-heavy text-text-primary transition-colors cursor-text",
                inputClassName
              )}
              aria-label="Display name"
            />
          </div>

          <div className="flex items-center gap-0.5 shrink-0 animate-in fade-in zoom-in-95 duration-150">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSaveEdit()
              }}
              className="size-6 p-0 text-text-secondary hover:text-text-primary hover:bg-surface-tonal flex items-center justify-center shrink-0"
              title="Save"
            >
              <HugeIcon name="tick-02" size="xs" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onMouseDown={(e) => {
                e.preventDefault()
                handleCancelEdit()
              }}
              className="size-6 p-0 text-text-secondary hover:text-text-primary hover:bg-surface-tonal flex items-center justify-center shrink-0"
              title="Cancel"
            >
              <HugeIcon name="cancel-01" size="xs" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
})

EditableDisplayName.displayName = "EditableDisplayName"
