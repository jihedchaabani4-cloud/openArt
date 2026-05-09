"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/client";

// ── Fetch all active credit packages ────────────────────────────────────────
export function usePackages() {
    return useQuery({
        queryKey: ["credit-packages"],
        queryFn: () => api.get("/payments/packages"),
        select: (data) => data.packages ?? [],
        staleTime: 1000 * 60 * 10, // Cache for 10 min (packages rarely change)
    });
}

// ── Get checkout URL for a specific package ──────────────────────────────────
export function useCheckout() {
    return useMutation({
        mutationFn: (packageId) =>
            api.post("/payments/checkout", { packageId }),
        onSuccess: (data) => {
            // Redirect user to Lemon Squeezy checkout
            if (data?.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            }
        },
    });
}
