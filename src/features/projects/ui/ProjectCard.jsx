"use client"
/* eslint-disable @next/next/no-img-element */
import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Icon } from "@/shared/ui/Icon"
import { Button } from "@/shared/ui/button"
import { EditableDisplayName } from "@/shared/ui/EditableDisplayName"
import { ConfirmDeleteDialog } from "@/shared/ui/ConfirmDeleteDialog"
import { cn } from "@/shared/lib/utils"

function isVideoUrl(url = "") {
  return /\.(mp4|webm|mov)$/i.test(url)
}

/**
 * ProjectCard — design-system.md §7.1
 * - Outer card: padding 4px 4px 6px, radius 16px (--r-xl)
 * - Thumbnail: aspect 16/9, radius 12px (--r-lg)
 * - Hover: bg rgba(255,255,255,.05) (--overlay-5)
 * - Active: scale(0.99)
 * - Focus: ring 2px rgba(255,255,255,.30) (--ring-focus)
 */
export function ProjectCard({ project, onDelete, onRename }) {
  const editRef = React.useRef(null)
  const videoRef = React.useRef(null)
  const [isEditing, setIsEditing] = React.useState(false)
  const thumbnailUrl = project.thumbnail_url || ""
  const hasThumbnail = Boolean(thumbnailUrl)
  const isVideoThumbnail = isVideoUrl(thumbnailUrl)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col p-1 pb-1.5 rounded-[var(--r-xl)] bg-transparent hover:bg-[var(--overlay-5)] border border-transparent hover:border-[var(--border-subtle)] transition-all duration-200 active:scale-[0.99] focus-within:ring-2 focus-within:ring-[var(--ring-focus)]"
    >
      <Link href={`/cinema-studio/${project.project_id}`} className="block w-full">
        <div
          className="relative w-full aspect-video rounded-[var(--r-lg)] overflow-hidden bg-[var(--bg-root)] border border-[var(--border-subtle)]"
          onMouseEnter={() => {
            if (isVideoThumbnail) {
              videoRef.current?.play().catch(() => {})
            }
          }}
          onMouseLeave={() => {
            if (isVideoThumbnail && videoRef.current) {
              videoRef.current.pause()
              videoRef.current.currentTime = 0
            }
          }}
        >
          {hasThumbnail ? (
            <>
              {isVideoThumbnail ? (
                <video
                  ref={videoRef}
                  src={thumbnailUrl}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              ) : (
                <img
                  src={thumbnailUrl}
                  alt={project.project_name || project.name}
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
            </>
          ) : (
            <div className="relative h-full w-full bg-[var(--overlay-3)] flex items-center justify-center text-[var(--text-tertiary)]">
              <Icon name="image" size={28} />
            </div>
          )}
        </div>
      </Link>

      {/* Meta Title & Actions Row */}
      <div className="flex items-center justify-between px-2 pt-2 pb-0.5 gap-2 min-h-[36px]">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <EditableDisplayName
            ref={editRef}
            displayName={project.name || project.project_name}
            onSave={(newName) => onRename(project.project_id, newName)}
            onEditChange={(val) => setIsEditing(val)}
            className="w-full"
            inputClassName="text-sm font-medium tracking-tight text-[var(--text-primary)] !px-0 bg-transparent"
          />
          {!isEditing && (
            <Button
              variant="ghost"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); editRef.current?.startEditing(); }}
              className="size-6 p-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100 shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--r-xs)]"
              aria-label={`Rename ${project.project_name}`}
            >
              <Icon name="edit" size={14} />
            </Button>
          )}
        </div>

        <div className="flex items-center">
          <ConfirmDeleteDialog
            description={`Are you sure you want to delete "${project.name || project.project_name}"?`}
            onConfirm={() => onDelete(project.project_id)}
            trigger={
              <Button
                variant="ghost"
                className="size-6 p-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--pink-400)] rounded-[var(--r-xs)]"
                aria-label={`Delete ${project.project_name}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <Icon name="delete" size={16} />
              </Button>
            }
          />
        </div>
      </div>
    </motion.div>
  )
}

export default ProjectCard
