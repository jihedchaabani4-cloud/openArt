"use client"

import { useAuthSession } from "@/shared/api/auth"

export function AuthSessionBootstrap() {
  useAuthSession()
  return null
}
