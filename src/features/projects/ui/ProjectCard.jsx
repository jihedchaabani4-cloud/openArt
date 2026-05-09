"use client"
/* eslint-disable @next/next/no-img-element */
import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"
import { Button } from "@/shared/ui/button"
import { EditableDisplayName } from "@/shared/ui/EditableDisplayName"
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog"

function isVideoUrl(url = "") {
    return /\.(mp4|webm|mov)$/i.test(url)
}

/**
 * ProjectCard component with a full-cover design.
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
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col overflow-hidden rounded-[22px] bg-transparent transition-all duration-300 shadow-2xl"
        >
            <Link href={`/cinema-studio/${project.project_id}`} className="block">
                <div
                    className="relative overflow-hidden rounded-[18px] aspect-[1.6/1]"
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
                        <div className="relative h-full w-full bg-[#313131]  overflow-hidden">

                        </div>
                    )}
                </div>
            </Link>

            {/* Footer Actions Row */}
            <div className="flex items-center justify-between px-5 py-3 transition-colors rounded-[22px] duration-300 group-hover:bg-[#0e0f11]">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <EditableDisplayName
                        ref={editRef}
                        displayName={project.name}
                        onSave={(newName) => onRename(project.project_id, newName)}
                        onEditChange={(val) => setIsEditing(val)}
                        className="w-full"
                        inputClassName="text-[12px] font-medium tracking-tight text-white !px-0 bg-transparent"
                    />
                    {!isEditing && (
                        <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); editRef.current?.startEditing(); }}
                            className="h-auto w-auto p-0 transition-all duration-300 opacity-0 group-hover:opacity-100 text-white shrink-0"
                            aria-label={`Rename ${project.project_name}`}
                        >
                            <GoogleIcon iconName="edit" className="text-[14px]" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center">
                    <ConfirmDeleteDialog
                        description={`Are you sure you want to delete "${project.name}"?`}
                        onConfirm={() => onDelete(project.project_id)}
                        trigger={
                            <Button
                                variant="ghost"
                                size="icon-xs"
                                className="h-auto w-auto p-0 transition-all duration-300 opacity-0 group-hover:opacity-100 text-white"
                                aria-label={`Delete ${project.project_name}`}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            >
                                <GoogleIcon iconName="delete" className="text-[18px]" />
                            </Button>
                        }
                    />
                </div>
            </div>
        </motion.div>
    )
}
