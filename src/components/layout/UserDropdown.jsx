"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeIcon } from "@/components/primitives/HugeIcon";

import { api } from "@/shared/api/client";
import { useAuthSession, useWalletBalance } from "@/shared/api/auth";
import { queryKeys } from "@/shared/api/queryKeys";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/primitives/avatar";
import { Button } from "@/components/base/button";
import { LoginDialog } from "@/components/layout/LoginDialog";
import { PackageSelectionDialog } from "@/features/payments/ui/PackageSelectionDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/base/dropdown-menu";
import { MenuItemContent } from "@/components/base/menu";

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

export function UserDropdown({
  className,
  variant = "icon",
  expanded = false,
  side,
  align = "end",
}) {
  const isSidebar = variant === "sidebar";
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
    if (isSidebar) {
      return (
        <div className={cn("ds-nav-item pointer-events-none", className)}>
          <span className="size-5 rounded-full animate-pulse bg-surface-card shrink-0" />
          <span className={cn("h-3 w-20 rounded-sharp animate-pulse bg-surface-card", !expanded && "sr-only")} />
        </div>
      );
    }
    return <div className={cn("size-7 max-h-full aspect-square animate-pulse rounded-full bg-surface-card", className)} />;
  }

  if (!currentUser) {
    return (
      <>
        {isSidebar ? (
          <Button
            type="button"
            variant="nav"
            onClick={() => setLoginOpen(true)}
            title={!expanded ? "Login" : undefined}
            aria-label="Login"
            className={cn("group overflow-hidden", className)}
          >
            <span className="relative size-5 flex items-center justify-center shrink-0 text-icon-primary">
              <HugeIcon name="user-circle" />
            </span>
            <span className={cn("truncate flex-1 text-left", !expanded && "sr-only")}>
              Login
            </span>
          </Button>
        ) : (
          <Button
            onClick={() => setLoginOpen(true)}
            variant="ghost"
            size="s"
            className={cn("h-7 max-h-full px-3 text-text-primary", className)}
          >
            Login
          </Button>
        )}
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
          {isSidebar ? (
            <Button
              type="button"
              variant="nav"
              title={!expanded ? `${displayName} · ${walletBalance} Crédits` : undefined}
              aria-label="Open user menu"
              className={cn("group overflow-hidden", className)}
            >
              <Avatar className="size-5 rounded-full bg-transparent shrink-0">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="rounded-full bg-ui-button-tonal ds-type-micro-tag text-text-primary-soft">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className={cn("truncate flex-1 text-left", !expanded && "sr-only")}>
                {displayName}
              </span>
              {expanded && (
                <span
                  data-testid="sidebar-credits-badge"
                  className="inline-flex items-center gap-1 rounded-sharp bg-surface-tonal px-1.5 py-0.5 ds-type-micro-tag text-text-secondary tabular-nums shrink-0"
                >
                  <HugeIcon name="flash" size="xs" className="text-icon-secondary" />
                  <span>{walletBalance}</span>
                </span>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className={cn("size-7 max-h-full aspect-square p-0", className)}
              aria-label="Open user menu"
            >
              <Avatar className="size-full rounded-full bg-transparent">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="rounded-full bg-ui-button-tonal ds-type-micro-tag text-text-primary-soft">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent side={side ?? (isSidebar ? "right" : "bottom")} align={align}>
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Avatar className="size-9 rounded-full bg-transparent shrink-0">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="rounded-full bg-primary text-primary-foreground ds-type-small">
                {initials.slice(0, 1)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="truncate ds-type-caption-label text-text-primary">
                {displayName}
              </p>
              <p className="truncate pt-0.5 ds-type-micro-tag text-text-secondary">
                {email}
              </p>
            </div>
          </div>

          <div className="mx-1 mb-1 flex flex-col gap-2.5 rounded-comfortable bg-surface-card p-3">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <HugeIcon name="ai-video" className="text-icon-primary" />
                <span className="ds-type-caption-label text-text-primary">
                  {walletBalance} Crédits IA
                </span>
              </div>
              <p className="ds-type-micro-tag text-text-secondary">
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
              className="h-7 w-full"
            >
              Upgrade
            </Button>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => router.push("/assets")}>
            <MenuItemContent icon="image-01">Ma bibliothèque</MenuItemContent>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => window.open(discordUrl, "_blank")}>
            <MenuItemContent icon="link-square-02">Discord</MenuItemContent>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={logoutMutation.isPending}
            onSelect={() => logoutMutation.mutate()}
          >
            <MenuItemContent
              icon={logoutMutation.isPending ? "loading-03" : "arrow-left-02"}
              iconClassName={logoutMutation.isPending ? "animate-spin" : undefined}
            >
              {logoutMutation.isPending ? "Déconnexion..." : "Se déconnecter"}
            </MenuItemContent>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PackageSelectionDialog open={isPricingOpen} onOpenChange={setIsPricingOpen} />
    </>
  );
}

export default UserDropdown;
