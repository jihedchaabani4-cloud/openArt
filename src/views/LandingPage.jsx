"use client";
import { useState } from "react";
import { HeroSection } from "./landing/components/HeroSection";
import { ModelsShowcase } from "./landing/components/ModelsShowcase";
import { BentoFeatures } from "./landing/components/BentoFeatures";
import { ModelSlider } from "./landing/components/ModelSlider";
import { PricingSection } from "@/features/payments/ui/PricingSection";
import { LoginDialog } from "@/components/LoginDialog";

export function LandingPage({ user, authLoading, onCTA }) {
  const [loginOpen, setLoginOpen] = useState(false);

  const handleCTA = () => {
    if (onCTA) {
      onCTA();
    } else {
      setLoginOpen(true);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden font-sans scroll-smooth text-white">
      <HeroSection user={user} authLoading={authLoading} onCTA={handleCTA} />
      <ModelsShowcase />
      <BentoFeatures />
      <ModelSlider />
      
      {/* ─── Pricing Section ─── */}
      <section className="relative z-30 w-full bg-black py-28 flex items-center justify-center">
        <PricingSection hideFaq={true} />
      </section>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
