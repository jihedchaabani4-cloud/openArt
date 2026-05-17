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
import { PackageSelectionDialog } from "@/features/payments/ui/PackageSelectionDialog"
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

function UserMenuButton({ iconName, label, onClick, variant = "filled", className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-[42px] w-full items-center justify-center gap-2.5 rounded-full border transition-colors",
        variant === "filled"
          ? "border-transparent bg-white/10 text-white hover:bg-white/20"
          : "border-white/10 bg-transparent text-white hover:bg-white/5",
        className
      )}
    >
      {iconName === "discord" ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="text-white/80">
          <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
        </svg>
      ) : iconName ? (
        <GoogleIcon iconName={iconName} className="text-[18px] text-white/80" />
      ) : null}
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  )
}

export function UserDropdown({ className }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loginOpen, setLoginOpen] = React.useState(false)
  const [isPricingOpen, setIsPricingOpen] = React.useState(false)
  const [dropdownOpen, setDropdownOpen] = React.useState(false)
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
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
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
        className="w-[360px] rounded-[32px] border border-white/8 bg-(--color-imagine-grey-2) backdrop-blur-[80px] p-4 shadow-[0_22px_80px_rgba(0,0,0,0.45)]"
      >


        <div className="mb-4 mt-2 flex items-center gap-3 px-2">
          <Avatar className="size-11 rounded-full bg-transparent">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="rounded-full bg-[#ff5722] text-[18px] font-semibold text-white">
              {initials.slice(0, 1)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold leading-tight text-white">
              {displayName}
            </p>
            <p className="truncate pt-1 text-[13px] text-white/60">
              {email}
            </p>
          </div>
        </div>

        <div className="rounded-[24px] bg-white/[0.06] p-5">
          <div className="flex items-center gap-2">
            <GoogleIcon iconName="stars" className="text-[18px] text-white" />
            <span className="text-[15px] font-medium text-white underline decoration-white/30 underline-offset-4">
              {walletBalance} Crédits IA
            </span>
          </div>
          <p className="mt-1.5 text-[12px] font-normal text-white/60">
            Les crédits sont actualisés quotidiennement
          </p>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setDropdownOpen(false);
              setTimeout(() => setIsPricingOpen(true), 150);
            }}
            className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-[#f1f1f1] text-[14px] font-medium text-[#111111] transition-colors hover:bg-[#e4e4e4]"
          >
            Add / Update Credit
          </button>
        </div>

        <div className="space-y-2 pt-3">
          <UserMenuButton
            iconName="library_books"
            label="Ma bibliothèque"
            variant="filled"
            onClick={() => router.push('/assets')}
          />

          <UserMenuButton
            iconName="discord"
            label="Discord"
            variant="outline"
            onClick={() => window.open(discordUrl, "_blank")}
          />

          <UserMenuButton
            label="Se déconnecter"
            variant="outline"
            onClick={() => logoutMutation.mutate()}
          />
        </div>

        </DropdownMenuContent>
      </DropdownMenu>

      <PackageSelectionDialog open={isPricingOpen} onOpenChange={setIsPricingOpen} />
    </>
  )
}
