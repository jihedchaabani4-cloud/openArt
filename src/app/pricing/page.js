import { PricingSection } from "@/features/payments/ui/PricingSection";

export const metadata = {
  title: "Pricing | Open Art",
  description: "Buy credit packs for image and video generation with Open Art.",
};

export default function PricingPage() {
  return (
    <main className="min-h-scree ">
      <PricingSection />
    </main>
  );
}
