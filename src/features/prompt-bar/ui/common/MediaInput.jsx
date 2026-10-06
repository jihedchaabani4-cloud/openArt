"use client";

import React, { useRef } from "react";
import { ReferenceButton, ViewReference } from "./ReferenceButton.jsx";
import { cn } from "@/shared/lib/utils";

/**
 * MediaInput: role-blind, feature-blind media slot primitive. Contains zero role checks.
 *
 * Dumb, presentational UI primitive for a single media slot.
 * Purely presentation-driven:
 * - Does NOT contain any role checks (`if role === "start"` etc.)
 * - Does NOT know about AI models or feature composition
 * - Renders Empty state (upload button) or Filled state (preview + remove)
 *
 * Props:
 * @param {string} label - Display label (e.g. "Start Frame", "End Frame", "Reference")
 * @param {object|string} value - Current media object ({ url, type, preview, name }) or string URL
 * @param {function} onChange - Callback when a file is selected: (media) => void
 * @param {function} onRemove - Callback when the media is removed: () => void
 * @param {string} [accept="image/*"] - MIME type(s) accepted (e.g. "image/*", "video/*,image/*")
 * @param {boolean} [disabled=false] - Whether the input is disabled
 * @param {string} [className] - Optional container CSS class overrides
 */
export function MediaInput({
  label,
  role,
  variant,
  value,
  onChange,
  onRemove,
  onClick,
  accept = "image/*",
  disabled = false,
  className,
}) {
  const fileInputRef = useRef(null);

  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) {
      onClick(e);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onChange?.({
        name: file.name,
        url: previewUrl,
        preview: previewUrl,
        type: file.type.startsWith("video/") ? "video" : "image",
      });
      // Reset input value so re-selecting the same file works
      e.target.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onChange?.({
        name: file.name,
        url: previewUrl,
        preview: previewUrl,
        type: file.type.startsWith("video/") ? "video" : "image",
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
      />

      {value ? (
        <ViewReference
          media={typeof value === "string" ? { url: value, type: "image" } : value}
          label={label}
          onRemove={onRemove}
        />
      ) : (
        <ReferenceButton
          variant={variant || role}
          word={label}
          disabled={disabled}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      )}
    </div>
  );
}
