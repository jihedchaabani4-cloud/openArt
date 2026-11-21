"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/shared/api/auth";
import { LandingPage } from "@/views";
import { HugeIcon } from "@/components/primitives/HugeIcon";

export default function HomePage() {
  const router = useRouter();
  const { data: user, isLoading: authLoading } = useAuthSession();

  useEffect(() => {
    if (user) {
      router.replace("/cinema-studio");
    }
  }, [user, router]);

  if (authLoading) {
    return (
      <div
        className="min-h-screen bg-background flex flex-col items-center justify-center text-white/50"
        suppressHydrationWarning
      >
        <HugeIcon name="loading-03" className="text-4xl animate-spin text-white mb-4" />
        <span>Chargement...</span>
      </div>
    );
  }

  return <LandingPage user={user} authLoading={authLoading} />;
}