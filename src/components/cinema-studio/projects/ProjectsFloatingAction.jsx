"use client";

import { Button } from "@/components/base/button";
import { GoogleIcon } from "@/components/primitives/GoogleIcon";

export function ProjectsFloatingAction({ onCreate, isLoading }) {
    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
            <Button
                type="button"
                variant="pill"
                onClick={onCreate}
                disabled={isLoading}
            >
                {isLoading ? (
                    <GoogleIcon iconName="progress_activity" className="text-xl animate-spin" />
                ) : (
                    <GoogleIcon iconName="add" className="text-xl" />
                )}
                <span>New project</span>
            </Button>
        </div>
    )
}
