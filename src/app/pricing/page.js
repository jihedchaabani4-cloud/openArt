import { PricingSection } from "@/features/payments/ui/PricingSection";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Labveil";

export const metadata = {
  title: `Pricing | ${appName}`,
  description: `Buy credit packs for image and video generation with ${appName}.`,
};

export default function PricingPage() {
  return (
    <main className="min-h-scree ">
      <PricingSection />
    </main>
  );
}
