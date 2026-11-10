"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

import { api } from "@/shared/api/client";
import { useAuthSession, useWalletBalance } from "@/shared/api/auth";
import { queryKeys } from "@/shared/api/queryKeys";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { LoginDialog } from "@/components/LoginDialog";
import { PackageSelectionDialog } from "@/features/payments/ui/PackageSelectionDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

function getInitials(name, email) {
  const source = (name || email || "User").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function getDisplayName(user) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Labveil";
  return user?.name || user?.email?.split("@")[0] || `${appName} User`;
}

export function UserDropdown({ className }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [isPricingOpen, setIsPricingOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.com";

  const { data: currentUser, isLoading } = useAuthSession();
  const { data: walletBalance = 0 } = useWalletBalance({
    enabled: !!currentUser,
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post("/auth/logout", {}),
    onSuccess: async () => {
      queryClient.setQueryData(queryKeys.auth.me(), null);
      await queryClient.removeQueries({ queryKey: queryKeys.auth.me() });
      router.push("/");
    },
  });

  if (isLoading) {
    return <div className={cn("size-8 sm:size-9 max-h-full aspect-square animate-pulse rounded-full bg-white/5", className)} />;
  }

  if (!currentUser) {
    return (
      <>
        <Button
          onClick={() => setLoginOpen(true)}
          variant="ghost"
          size="sm"
          className={cn("h-8 sm:h-9 max-h-full px-5 text-sm font-semibold text-white", className)}
        >
          Login
        </Button>
        <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    );
  }

  const displayName = getDisplayName(currentUser);
  const email = currentUser?.email || "Sign in to sync your workspace";
  const initials = getInitials(displayName, currentUser?.email);
  const avatarUrl = currentUser?.image || "";

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={cn("size-8 sm:size-9 max-h-full aspect-square p-0", className)}
            aria-label="Open user menu"
          >
            <Avatar className="size-full rounded-full bg-transparent">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="rounded-full bg-slate-700 text-xs font-semibold text-white/90">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="user-dropdown-panel w-90"
        >
          <div className="p-3">
            <div className="mb-4 mt-2 flex items-center gap-3 px-2">
            <Avatar className="size-11 rounded-full bg-transparent">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="rounded-full bg-primary text-primary-foreground text-lg font-semibold">
                {initials.slice(0, 1)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight text-white/90">
                {displayName}
              </p>
              <p className="truncate pt-1 text-xs text-white/60">
                {email}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3.5 rounded-lg bg-white/5 p-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <GoogleIcon iconName="movie_filter_auto" className="text-lg text-white/90" />
                <span className="text-sm font-medium text-white/90 underline decoration-white/30 underline-offset-4">
                  {walletBalance} Crédits IA
                </span>
              </div>
              <p className="text-xs font-normal text-white/60">
                Les crédits sont actualisés quotidiennement
              </p>
            </div>
            <Button 
              type="button"
              variant="primary"
              onClick={(e) => {
                e.preventDefault();
                setDropdownOpen(false);
                setTimeout(() => setIsPricingOpen(true), 150);
              }}
              className="h-10 w-full font-medium text-sm"
            >
              Upgrade
            </Button>
          </div>

          <div className="space-y-1.5 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/assets')}
              className="flex h-10 w-full items-center justify-center gap-2.5 font-sans text-sm font-medium antialiased"
            >
              <GoogleIcon iconName="library_books" className="text-lg text-white/80" />
              <span>Ma bibliothèque</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => window.open(discordUrl, "_blank")}
              className="flex h-10 w-full items-center justify-center gap-2.5 font-sans text-sm font-medium antialiased"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="text-white/80">
                <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
              </svg>
              <span>Discord</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              className="flex h-10 w-full items-center justify-center gap-2.5 font-sans text-sm font-medium antialiased"
            >
              {logoutMutation.isPending && (
                <GoogleIcon iconName="progress_activity" className="text-base animate-spin text-white/70" />
              )}
              <span>{logoutMutation.isPending ? "Déconnexion..." : "Se déconnecter"}</span>
            </Button>
          </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <PackageSelectionDialog open={isPricingOpen} onOpenChange={setIsPricingOpen} />
    </>
  );
}

export default UserDropdown;
