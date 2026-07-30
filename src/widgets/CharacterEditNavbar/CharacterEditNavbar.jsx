"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { UserDropdown } from "@/widgets/StudioNavbar/ui/UserDropdown";

export function CharacterEditNavbar({
    onDeleteCharacter,
}) {
    const { projectId } = useParams();
    const router = useRouter();

    return (
        <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-0 left-0 w-full z-50 flex items-center h-16 px-6 border-b border-white/5 bg-black/40 backdrop-blur-xl"
        >
            {/* Left section */}
            <div className="flex items-center gap-1">
                <Button
                    variant="studio-ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={() => router.push(`/cinema-studio/${projectId}/characters`)}
                    aria-label="Back to characters"
                >
                    <GoogleIcon iconName="arrow_back" className="text-[20px]" />
                </Button>
            </div>

            {/* Right section: Delete & Done buttons */}
            <div className="ml-auto flex items-center gap-2">
                <Button
                    type="button"
                    variant="user-menu-filled"
                    onClick={onDeleteCharacter}
                    className="bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 text-xs font-semibold px-4 py-2 gap-1.5"
                >
                    <GoogleIcon iconName="delete" className="text-[16px]" />
                    Delete
                </Button>

                <Button
                    type="button"
                    variant="studio-white"
                    onClick={() => router.push(`/cinema-studio/${projectId}/characters`)}
                >
                    Done
                </Button>

                <UserDropdown />
            </div>
        </motion.nav>
    );
}

export default CharacterEditNavbar;
