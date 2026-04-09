"use client"

import * as React from "react";

export default function AppPage({ params }) {
    const resolvedParams = React.use(params);
    const slug = resolvedParams.slug;

    return (
        <div className="flex h-full items-center justify-center text-white/40 text-sm">
            App &quot;{slug}&quot; not found.
        </div>
    );
}
