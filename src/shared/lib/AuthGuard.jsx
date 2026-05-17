"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/shared/api/auth";

// Pages that are always publicly accessible (no auth required)
const PUBLIC_PATHS = ["/", "/login", "/pricing", "/assets"];

export function AuthGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading } = useAuthSession();

  useEffect(() => {
    // While loading, do nothing — wait for the session check to finish
    if (isLoading) return;

    // Check if the current path is public
    const isPublic = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    // If not public AND no user → redirect to landing page
    if (!isPublic && !user) {
      router.replace("/");
    }
  }, [isLoading, user, pathname, router]);

  return null;
}
