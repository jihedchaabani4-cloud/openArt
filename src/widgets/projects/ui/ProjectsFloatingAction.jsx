"use client";

import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

export function ProjectsFloatingAction({ onCreate, isLoading }) {
    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
            <Button
                type="button"
                variant="secondary"
                className="h-auto px-6 py-3.5 rounded-full backdrop-blur-md text-sm font-medium gap-2"
                onClick={onCreate}
                disabled={isLoading}
            >
                {isLoading ? (
                    <GoogleIcon iconName="progress_activity" className="text-xl animate-spin" />
                ) : (
                    <GoogleIcon iconName="add" className="text-xl" />
                )}
                <span className="font-medium text-[15px]">New project</span>
            </Button>
        </div>
    )
}
