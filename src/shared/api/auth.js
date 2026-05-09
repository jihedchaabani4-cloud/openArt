import { useQuery } from "@tanstack/react-query"

import { api } from "@/shared/api/client"
import { queryKeys } from "@/shared/api/queryKeys"

async function fetchAuthSession() {
  const res = await api.get("/auth/me")
  return res?.user ?? null
}

export function useAuthSession(options = {}) {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: fetchAuthSession,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    ...options,
  })
}

async function fetchWalletBalance() {
  const res = await api.get("/auth/wallet/balance")
  return res?.balance ?? 0
}

export function useWalletBalance(options = {}) {
  return useQuery({
    queryKey: queryKeys.auth.walletBalance(),
    queryFn: fetchWalletBalance,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
