"use client";

import { Button } from "@/components/base/button";
import { HugeIcon } from "@/components/primitives/HugeIcon";

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
                    <HugeIcon name="loading-03" className="animate-spin" />
                ) : (
                    <HugeIcon name="add-01" />
                )}
                <span>New project</span>
            </Button>
        </div>
    )
}
