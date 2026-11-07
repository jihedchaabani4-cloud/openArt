"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/shared/api/auth";
import { LandingPage } from "@/views";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";

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
        <GoogleIcon iconName="progress_activity" className="text-4xl animate-spin text-white mb-4" />
        <span>Chargement...</span>
      </div>
    );
  }

  return <LandingPage user={user} authLoading={authLoading} />;
}