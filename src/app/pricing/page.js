import { PricingSection } from "@/features/payments/ui/PricingSection";

export const metadata = {
  title: "Pricing | Open Art",
  description: "Buy AI credits to generate images, videos and more with Open Art.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <PricingSection />
    </main>
  );
}
