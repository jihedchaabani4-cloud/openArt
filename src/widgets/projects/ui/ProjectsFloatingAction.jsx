"use client";

import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

export function ProjectsFloatingAction({ onCreate, isLoading }) {
    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
            <Button
                type="button"
                variant="secondary"
                className="h-auto px-6 py-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white active:scale-95 border-none backdrop-blur-md text-sm font-medium"
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
