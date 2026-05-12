"use client";

import { usePackages, useCheckout } from "@/features/payments/api/paymentsApi";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/shared/ui/accordion";
import { Check, Loader2 } from "lucide-react";

function formatPrice(value, currency = "USD") {
    if (value == null) {
        return null;
    }

    return `${value} ${currency}`;
}

function getPlanFeatures(pkg) {
    if (Array.isArray(pkg.features) && pkg.features.length > 0) {
        return pkg.features.map((feature) => feature.replace(/^~\s*/, ""));
    }

    return [];
}

function getPlanKind(pkg) {
    const rawKind = pkg.plan_type || pkg.billing_type || pkg.kind || pkg.type;

    if (typeof rawKind !== "string") {
        return null;
    }

    const normalized = rawKind.trim().toLowerCase();

    if (["subscription", "recurring", "monthly", "yearly"].includes(normalized)) {
        return "subscription";
    }

    if (["one_time", "one-time", "one time", "credits", "credit_pack", "pack"].includes(normalized)) {
        return "one-time";
    }

    return null;
}

function getPlanColor(label) {
    const l = label?.toLowerCase() || "";
    
    if (l.includes("starter pack")) {
        return {
            title: "#d6c8ff",
            button: "#c5b4e3",
            hover: "#d5c8f2"
        };
    }
    
    if (l.includes("creator pack")) {
        return {
            title: "#ffd1da",
            button: "#f7c4ce",
            hover: "#ffd3db"
        };
    }

    if (l.includes("studio pack")) {
        return {
            title: "#d1e2f5",
            button: "#a8c5da",
            hover: "#c1d6e6"
        };
    }

    if (l.includes("duo")) {
        return {
            title: "#ffe2ad",
            button: "#ffc86b",
            hover: "#ffd694"
        };
    }

    // Default (Personnel colors)
    return {
        title: "#ffd1da",
        button: "#f7c4ce",
        hover: "#ffd3db"
    };
}

function getPlanSuffix(pkg) {
    return getPlanKind(pkg) === "subscription" ? "/month" : "";
}

function buildPriceSummary(packages) {
    if (!packages.length) {
        return "You can compare every active plan directly in the pricing cards above.";
    }

    return packages
        .map((pkg) => {
            const price = formatPrice(pkg.price, pkg.currency);

            if (!price) {
                return pkg.label;
            }

            return `${pkg.label}: ${price}${getPlanSuffix(pkg)}`;
        })
        .join(" • ");
}

function formatGenerationCount(count, unitLabel) {
    const safeCount = Number.isFinite(count) ? count : 0;
    const label = safeCount === 1 ? unitLabel : `${unitLabel}s`;
    return `${safeCount} ${label}`;
}

function formatModelBasis(item) {
    if (!item) {
        return "";
    }

    if (item.category === "video") {
        return `${item.creditsPerGeneration} credits / ${item.basis?.durationSeconds || 5}s ${item.unitLabel}`;
    }

    return `${item.creditsPerGeneration} credits / ${item.unitLabel}`;
}

function ModelComparisonTable({ title, description, items, packages }) {
    if (!items?.length || !packages?.length) {
        return null;
    }

    return (
        <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03]">
            <div className="border-b border-white/[0.08] px-6 py-6">
                <h3 className="text-2xl font-bold tracking-[-0.03em] text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{description}</p>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                    <div
                        className="grid border-b border-white/[0.08] px-6 py-5"
                        style={{ gridTemplateColumns: `minmax(260px, 1.6fr) repeat(${packages.length}, minmax(140px, 1fr))` }}
                    >
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">
                            Model
                        </div>
                        {packages.map((pkg) => (
                            <div key={pkg.id} className="text-left">
                                <p className="text-sm font-semibold text-white">{pkg.label}</p>
                                <p className="mt-1 text-xs text-white/45">{pkg.credits} credits</p>
                            </div>
                        ))}
                    </div>

                    {items.map((item) => (
                        <div
                            key={item.key}
                            className="grid items-center border-b border-white/[0.06] px-6 py-5 last:border-b-0"
                            style={{ gridTemplateColumns: `minmax(260px, 1.6fr) repeat(${packages.length}, minmax(140px, 1fr))` }}
                        >
                            <div className="pr-6">
                                <p className="text-sm font-semibold text-white">{item.displayName}</p>
                                <p className="mt-1 text-xs text-white/45">{formatModelBasis(item)}</p>
                            </div>

                            {packages.map((pkg) => {
                                const packageCount = item.packageCounts?.find((entry) => entry.packageId === pkg.id);
                                return (
                                    <div key={`${item.key}-${pkg.id}`} className="text-sm font-medium text-white">
                                        {formatGenerationCount(packageCount?.count ?? 0, item.unitLabel)}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TemplatePricingCard({ pkg, onBuy, isLoading }) {
    const features = getPlanFeatures(pkg);
    const price = formatPrice(pkg.price, pkg.currency);
    const ctaLabel = pkg.cta_label || `Get ${pkg.label}`;
    const colors = getPlanColor(pkg.label);

    return (
        <article className="flex aspect-[1/1.1] w-full flex-col rounded-xl backdrop-blur-[80px] p-5 text-white transition-all duration-300 bg-white/[0.06] hover:bg-white/[0.09]">
            <div className="flex items-center gap-2 text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black text-[11px] font-bold">
                    P
                </span>
                <span className="text-[15px] font-medium">{pkg.badge_label || "Premium"}</span>
            </div>

            <div className="mt-4">
                <h3 className="text-[32px] font-bold tracking-[-0.03em]" style={{ color: colors.title }}>
                    {pkg.label}
                </h3>
                {price && (
                    <p className="mt-1 text-[22px] font-bold text-white">
                        {price}
                        {getPlanKind(pkg) === "subscription" ? "/mois" : ""}
                    </p>
                )}
            </div>

            <div className="mt-5 h-px bg-white/[0.10]" />

            <ul className="mt-5  text-[15px] leading-7 text-white">
                {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                        <Check size={16} className="mt-1.5 shrink-0 text-white" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                id={`buy-${pkg.id}`}
                onClick={() => onBuy(pkg.id)}
                disabled={isLoading}
                className="mt-auto inline-flex h-12 w-full items-center justify-center rounded-full px-5 text-sm font-bold text-[#1d1d1d] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70"
                style={{ 
                    backgroundColor: colors.button,
                    "--hover-bg": colors.hover
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.hover}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = colors.button}
            >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : ctaLabel}
            </button>

            {pkg.disclaimer && (
                <p className="mt-8 text-center text-xs text-white underline underline-offset-4">
                    {pkg.disclaimer}
                </p>
            )}
        </article>
    );
}

function SkeletonCard() {
    return (
        <div className="aspect-[1/1.1] w-full rounded-xl bg-white/[0.06] backdrop-blur-[80px]" />
    );
}

export function PricingSection() {
    const { data, isLoading, isError } = usePackages();
    const { mutate: checkout, isPending, variables: pendingPackageId } = useCheckout();
    const packages = data?.packages ?? [];
    const modelsComparison = data?.modelsComparison ?? { image: [], video: [] };
    const nonTrialPackages = packages.filter((pkg) => !pkg.is_trial);
    const hasSubscriptions = nonTrialPackages.some((pkg) => getPlanKind(pkg) === "subscription");
    const hasOneTimePlans = nonTrialPackages.some((pkg) => getPlanKind(pkg) === "one-time");
    const priceSummary = buildPriceSummary(nonTrialPackages);
    const faqItems = [
        {
            question: "How much does each plan cost?",
            answer: `${priceSummary} Pick the plan that matches how often you create and how many credits you want available.`,
        },
        {
            question: "Which plan should I choose?",
            answer:
                "Choose the lightest plan if you are testing the product, a mid-tier plan if you create every week, and the largest plan if you need the best value and more room to generate consistently.",
        },
        {
            question: "Do I get credits instantly after payment?",
            answer:
                "Yes. Payments are processed securely and your credits are added to your account right after the checkout is completed.",
        },
        {
            question: "Is billing recurring or a one-time purchase?",
            answer:
                hasSubscriptions && hasOneTimePlans
                    ? "This page can include both recurring subscriptions and one-time credit packs. You can tell which is which from the plan price and label before checkout."
                    : hasSubscriptions
                      ? "The available plans on this page are recurring subscriptions, so they renew automatically based on the billing cycle shown."
                      : "The available plans on this page are one-time purchases, so you only pay when you decide to buy again.",
        },
        {
            question: "Can I change plans later?",
            answer:
                "Yes. You can move to a different plan when your needs change, so you are not locked into the same option forever.",
        },
    ];

    return (
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-20">
            <div className="max-w-2xl">
                <h1 className="mt-5 text-4xl font-bold tracking-[-0.05em] text-white md:text-5xl">
                    Simple plans, designed to feel premium.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-white/42">
                    Clear pricing, clean structure, and the right amount of detail to help users choose fast.
                </p>
            </div>

            <div className="space-y-7">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {isLoading && [1, 2, 3].map((item) => <SkeletonCard key={`sub-${item}`} />)}
                    {!isLoading && !isError && nonTrialPackages.map((pkg) => (
                        <TemplatePricingCard
                            key={pkg.id}
                            pkg={pkg}
                            onBuy={(id) => checkout(id)}
                            isLoading={isPending && pendingPackageId === pkg.id}
                        />
                    ))}
                </div>

                {isError && (
                    <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] px-6 py-12 text-center text-sm text-white/42 md:col-span-3">
                        Could not load packages. Please try again later.
                    </div>
                )}
            </div>

            <p className="text-center text-xs text-white/24">
                Secure payments powered by Lemon Squeezy. Credits are added instantly after payment.
            </p>

            {!isLoading && !isError && nonTrialPackages.length > 0 && (
                <div className="space-y-6 pt-4">
                    <div className="max-w-3xl">
                        <h2 className="text-3xl font-bold tracking-[-0.04em] text-white md:text-4xl">
                            Compare what each pack can generate
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-white/50">
                            Counts below are based on default generation settings for each model. Images use the standard setting, and videos use 5-second 720p generations.
                        </p>
                    </div>

                    <ModelComparisonTable
                        title="Video models"
                        description="See how many videos each credit pack can generate for the current video lineup."
                        items={modelsComparison.video}
                        packages={nonTrialPackages}
                    />

                    <ModelComparisonTable
                        title="Image models"
                        description="See how many images each credit pack can generate for the current image lineup."
                        items={modelsComparison.image}
                        packages={nonTrialPackages}
                    />
                </div>
            )}

            <div className="mx-auto w-full max-w-4xl pt-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-[-0.04em] text-white md:text-4xl">
                        Frequently asked questions
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/50">
                        Short answers to the pricing questions people usually check before they buy.
                    </p>
                </div>

                <Accordion type="single" collapsible className="mt-8 space-y-4">
                    {faqItems.map((item, index) => (
                        <AccordionItem
                            key={item.question}
                            value={`faq-${index}`}
                            className="rounded-2xl  bg-white/[0.1] px-5 backdrop-blur-[80px]"
                        >
                            <AccordionTrigger className="py-5 text-base font-semibold text-white hover:no-underline">
                                {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="pb-5 text-sm leading-7 text-white/65">
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
