"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Download, EyeOff, Eye, Info, Check } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { downloadFile } from "@/shared/lib/utils"

export function EditNavbar({ 
    workflow, 
    showHistory = true, 
    onToggleHistory = () => {} 
}) {
    const { projectId } = useParams()
    const router = useRouter()
    console.log(workflow,'workflow')
    const handleDownloadAll = async () => {
        if (!workflow?.items) return;
        
        // Download each item in the workflow
        for (const item of workflow.items) {
            const url = item.url || item.image?.url || item.video?.url;
            if (url) {
                const filename = `generation-${item.id || item.name}.${url.split('.').pop()}`;
                await downloadFile(url, filename);
                // Small delay to prevent browser blocking multiple downloads
                await new Promise(r => setTimeout(r, 200));
            }
        }
    }

    return (
        <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 left-0 w-full z-50 flex items-center h-16 px-6 border-b border-white/5 bg-black/40 backdrop-blur-xl"
        >
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => router.push(`/projects/${projectId}`)}
                    className="rounded-full hover:bg-white/10 text-whit transition-all"
                >
                    <ArrowLeft className="size-6" />
                </Button>
                
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium tracking-tight text-white">
                        {workflow?.metadata?.displayName || "Untitled Workflow"}
                    </span>
                </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
                <Button 
                    variant="studio-ghost" 
                    onClick={handleDownloadAll}
                >
                    Download
                </Button>

                <Button 
                    variant="studio-ghost" 
                    onClick={onToggleHistory}
                >
                    {showHistory ? "Hide history" : "Show history"}
                </Button>

                <Button 
                    variant="studio-white"
                    onClick={() => router.push(`/projects/${projectId}`)}
                >
                    Done
                </Button>
            </div>
        </motion.nav>
    )
}
