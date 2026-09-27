"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthSessionBootstrap } from "@/shared/lib/AuthSessionBootstrap";
import { AuthGuard } from "@/shared/lib/AuthGuard";

export function ReactQueryProvider({ children }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,   // 5 min — don't refetch unless explicitly invalidated
                gcTime:    process.env.NODE_ENV === 'development'
                    ? 60 * 1000             // 1 min in dev — prevent RAM from piling up
                    : 10 * 60 * 1000,       // 10 min in prod
                refetchOnWindowFocus:    false,
                refetchOnReconnect:      false,
                refetchOnMount:          false,
                retry: 1,
            },
            mutations: {
                retry: false, // ⛔ NEVER automatically retry mutations (prevents accidental double-billing / duplicate jobs)
            },
        },
    }));
    return (
        <QueryClientProvider client={queryClient}>
            <AuthSessionBootstrap />
            <AuthGuard />
            {children}
        </QueryClientProvider>
    );
}
