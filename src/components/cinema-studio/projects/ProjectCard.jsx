"use client"
/* eslint-disable @next/next/no-img-element */
import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { HugeIcon } from "@/components/primitives/HugeIcon"
import { Button } from "@/components/base/button"
import { Card } from "@/components/primitives/card"
import { EditableDisplayName } from "@/components/primitives/EditableDisplayName"
import { ConfirmDeleteDialog } from "@/components/primitives/ConfirmDeleteDialog"

function isVideoUrl(url = "") {
    return /\.(mp4|webm|mov)$/i.test(url)
}

/**
 * ProjectCard component with a full-cover design.
 * Built with the canonical Card primitive and M3 tokens.
 * 
 * @param {Object} project - The project data object
 * @param {Function} onDelete - Callback for deleting a project
 * @param {Function} onRename - Callback for renaming a project
 */
export function ProjectCard({ project, onDelete, onRename }) {
    const editRef = React.useRef(null)
    const videoRef = React.useRef(null)
    const [isEditing, setIsEditing] = React.useState(false)
    const thumbnailUrl = project.thumbnail_url || ""
    const hasThumbnail = Boolean(thumbnailUrl)
    const isVideoThumbnail = isVideoUrl(thumbnailUrl)

    return (
        <Card
            asChild
            className="group relative flex flex-col overflow-hidden bg-transparent border-transparent transition-all duration-300 shadow-none"
        >
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Link href={`/cinema-studio/${project.project_id}`} className="block">
                    <Card.Canvas
                        className="relative overflow-hidden rounded-comfortable aspect-[1.6/1] bg-surface-sunken"
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
                                        className="h-full w-full object-cover transition-transform duration-700 ease-out"
                                    />
                                ) : (
                                    <img
                                        src={thumbnailUrl}
                                        alt={project.project_name || project.name}
                                        className="h-full w-full object-cover transition-transform duration-700 ease-out"
                                    />
                                )}
                                <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-white/5 opacity-60" />
                            </>
                        ) : (
                            <div className="relative h-full w-full bg-surface-elevated overflow-hidden" />
                        )}
                    </Card.Canvas>
                </Link>

                {/* Footer Actions Row */}
                <div className="flex items-center justify-between px-5 py-3 transition-colors rounded-subtle duration-300 group-hover:bg-surface-elevated">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <EditableDisplayName
                            ref={editRef}
                            displayName={project.name}
                            onSave={(newName) => onRename(project.project_id, newName)}
                            onEditChange={(val) => setIsEditing(val)}
                            className="w-full"
                            inputClassName="ds-type-small text-white !px-0 bg-transparent"
                        />
                        {!isEditing && (
                            <Button
                                variant="ghost"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); editRef.current?.startEditing(); }}
                                className="size-6 p-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 shrink-0"
                                aria-label={`Rename ${project.project_name}`}
                            >
                                <HugeIcon name="pencil-edit-02" size="sm" />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center">
                        <ConfirmDeleteDialog
                            description={`Are you sure you want to delete "${project.name}"?`}
                            onConfirm={() => onDelete(project.project_id)}
                            trigger={
                                <Button
                                    variant="danger"
                                    className="size-6 p-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                                    aria-label={`Delete ${project.project_name}`}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                >
                                    <HugeIcon name="delete-02" size="sm" />
                                </Button>
                            }
                        />
                    </div>
                </div>
            </motion.div>
        </Card>
    )
}
