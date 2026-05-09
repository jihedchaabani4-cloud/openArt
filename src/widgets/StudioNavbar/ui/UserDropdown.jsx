"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { GoogleIcon } from "@/shared/ui/GoogleIcon"

import { api } from "@/shared/api/client"
import { useAuthSession, useWalletBalance } from "@/shared/api/auth"
import { queryKeys } from "@/shared/api/queryKeys"
import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import { LoginDialog } from "@/components/LoginDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

function getInitials(name, email) {
  const source = (name || email || "User").trim()
  const parts = source.split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

function getDisplayName(user) {
  return user?.name || user?.email?.split("@")[0] || "Open Art User"
}

function UserMenuButton({ iconName, label, onClick, variant = "filled", iconColor }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant={variant === "filled" ? "user-menu-filled" : "user-menu-outline"}
      className="h-fit w-full justify-center gap-2.5"
    >
      {iconName ? (
        <GoogleIcon iconName={iconName} className="text-[18px] text-white/82" />
      ) : null}
      <span className="text-[14px]">{label}</span>
    </Button>
  )
}

export function UserDropdown({ className }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loginOpen, setLoginOpen] = React.useState(false)
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.com"

  const { data: currentUser, isLoading } = useAuthSession()
  const { data: walletBalance = 0 } = useWalletBalance({
    enabled: !!currentUser,
  })

  const logoutMutation = useMutation({
    mutationFn: () => api.post("/auth/logout", {}),
    onSuccess: async () => {
      queryClient.setQueryData(queryKeys.auth.me(), null)
      await queryClient.removeQueries({ queryKey: queryKeys.auth.me() })
      router.push("/")
    },
  })

  if (isLoading) {
    return <div className={cn("size-9 animate-pulse rounded-xl bg-white/5", className)} />
  }

  if (!currentUser) {
    return (
      <>
        <Button
          onClick={() => setLoginOpen(true)}
          variant="studio-ghost"
          size="sm"
          className={cn("h-9 rounded-xl px-5 text-[14px] font-semibold text-white", className)}
        >
          Login
        </Button>
        <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    )
  }

  const displayName = getDisplayName(currentUser)
  const email = currentUser?.email || "Sign in to sync your workspace"
  const initials = getInitials(displayName, currentUser?.email)
  const avatarUrl = currentUser?.image || ""

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-linear-to-br from-white/10 to-white/5 transition hover:bg-white/10",
            className
          )}
          aria-label="Open user menu"
        >
          <Avatar className="size-full rounded-xl bg-transparent">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="rounded-xl bg-[#2f3b4d] text-[13px] font-semibold text-white/88">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-[344px] rounded-[26px] border border-white/8 bg-(--color-imagine-grey-2) backdrop-blur-[80px] p-4 shadow-[0_22px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="mb-4 flex items-center gap-3">
          <Avatar className="size-10 rounded-full bg-transparent">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="rounded-full bg-[#4c657f] text-base font-medium text-white/88">
              {initials.slice(0, 1)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight text-white">
              {displayName}
            </p>
            <p className="truncate pt-1 text-[13px] text-white/58">
              {email}
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <UserMenuButton
            iconName="monetization_on"
            label={`${walletBalance} credits`}
            onClick={() => {}}
          />
          <div className="grid grid-cols-2 gap-2">
            <UserMenuButton
              iconName="forum"
              label="Discord"
              variant="outline"
              onClick={() => window.open(discordUrl, "_blank")}
            />
            <UserMenuButton
              iconName="logout"
              label="Log out"
              variant="outline"
              onClick={() => logoutMutation.mutate()}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
