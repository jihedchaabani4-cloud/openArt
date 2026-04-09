"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function ReactQueryProvider({ children }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,   // 5 min — don't refetch unless explicitly invalidated
                gcTime:    10 * 60 * 1000,  // 10 min — keep in memory
                refetchOnWindowFocus:    false,
                refetchOnReconnect:      false,
                refetchOnMount:          false,
                retry: 1,
            },
        },
    }));
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
