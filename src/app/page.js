"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/shared/api/auth";
import { Loader2 } from "lucide-react";
import { LandingPage } from "@/views";

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
        className="min-h-screen bg-black flex flex-col items-center justify-center text-white/50"
        suppressHydrationWarning
      >
        <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
        <span>Chargement...</span>
      </div>
    );
  }

  return <LandingPage user={user} authLoading={authLoading} />;
}