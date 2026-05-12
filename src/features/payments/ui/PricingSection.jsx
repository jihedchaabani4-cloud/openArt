"use client";

import { useRef, useState } from "react";
import { usePackages, useCheckout } from "@/features/payments/api/paymentsApi";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/shared/ui/accordion";
import { Check, ChevronDown, Loader2 } from "lucide-react";

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

function CompareCategorySection({ title, items, packages, initialVisibleCount = 3 }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!items?.length || !packages?.length) {
        return null;
    }

    const visibleItems = isExpanded ? items : items.slice(0, initialVisibleCount);
    const hasMore = items.length > initialVisibleCount;
    const gridTemplateColumns = `minmax(220px, 1.45fr) repeat(${packages.length}, minmax(160px, 1fr))`;

    return (
        <div className="border-t border-white/[0.08] first:border-t-0">
            <div className="px-5 py-5">
                <h3 className="text-[28px] font-bold tracking-[-0.03em] text-white">{title}</h3>
            </div>

            <div className="grid items-center border-b border-white/[0.06] px-5 py-4 text-sm"
                style={{ gridTemplateColumns }}
            >
                <div className="pr-5 text-white">Concurrent Jobs</div>
                {packages.map((pkg, index) => (
                    <div key={`${title}-${pkg.id}-concurrent`} className="font-medium text-white">
                        {index + 1} concurrent job{index === 0 ? "" : "s"}
                    </div>
                ))}
            </div>

            {visibleItems.map((item) => (
                <div
                    key={item.key}
                    className="grid items-center border-b border-white/[0.06] px-5 py-4"
                    style={{ gridTemplateColumns }}
                >
                    <div className="pr-5">
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

            {hasMore && (
                <div className="px-5 py-4">
                    <button
                        type="button"
                        onClick={() => setIsExpanded((current) => !current)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
                    >
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                        {isExpanded ? "View less" : "View more"}
                    </button>
                </div>
            )}
        </div>
    );
}

function ComparePlansSection({ packages, modelsComparison, onBuy, isPending, pendingPackageId }) {
    const headerScrollRef = useRef(null);
    const bodyScrollRef = useRef(null);
    const syncingRef = useRef(null);

    if (!packages?.length) {
        return null;
    }

    const gridTemplateColumns = `minmax(220px, 1.45fr) repeat(${packages.length}, minmax(160px, 1fr))`;

    function syncHorizontalScroll(source, target, sourceKey) {
        if (!source || !target) {
            return;
        }

        if (syncingRef.current === sourceKey) {
            syncingRef.current = null;
            return;
        }

        syncingRef.current = sourceKey;
        target.scrollLeft = source.scrollLeft;
    }

    return (
        <div className="space-y-5">
            <div className="text-center">
                <h2 className="text-[40px] font-bold uppercase tracking-[-0.04em] text-white md:text-[52px]">
                    Compare Plans
                </h2>
            </div>

            <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03]">
                <div className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0b0b0c]/95 backdrop-blur-xl">
                    <div
                        ref={headerScrollRef}
                        onScroll={(event) =>
                            syncHorizontalScroll(event.currentTarget, bodyScrollRef.current, "header")
                        }
                        className="overflow-x-auto"
                    >
                        <div className="min-w-[1020px]">
                            <div
                                className="grid px-5 py-5"
                                style={{ gridTemplateColumns }}
                            >
                                <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">
                                    Models
                                </div>

                                {packages.map((pkg) => {
                                    const price = formatPrice(pkg.price, pkg.currency);
                                    const ctaLabel = pkg.cta_label || `Get ${pkg.label}`;

                                    return (
                                        <div key={`sticky-${pkg.id}`} className="pr-3">
                                            <p className="text-base font-bold text-white">{pkg.label}</p>
                                            {price && (
                                                <p className="mt-2 text-sm font-semibold text-white">
                                                    {price}
                                                    {getPlanKind(pkg) === "subscription" ? "/month" : ""}
                                                </p>
                                            )}
                                            <p className="mt-1 text-xs text-white/45">{pkg.credits} credits</p>
                                            <button
                                                type="button"
                                                onClick={() => onBuy(pkg.id)}
                                                disabled={isPending && pendingPackageId === pkg.id}
                                                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-2xl bg-white/15 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70"
                                            >
                                                {isPending && pendingPackageId === pkg.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    ctaLabel
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    ref={bodyScrollRef}
                    onScroll={(event) =>
                        syncHorizontalScroll(event.currentTarget, headerScrollRef.current, "body")
                    }
                    className="overflow-x-auto"
                >
                    <div className="min-w-[1020px]">
                        <div className="min-w-[1020px]">
                            <CompareCategorySection
                                title="Video"
                                items={modelsComparison.video}
                                packages={packages}
                            />

                            <CompareCategorySection
                                title="Image"
                                items={modelsComparison.image}
                                packages={packages}
                            />
                        </div>
                    </div>
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
        <article className="flex aspect-[1/1.08] w-full flex-col rounded-xl bg-white/[0.1] p-4 text-white backdrop-blur-[80px] transition-all duration-300 hover:bg-white/[0.13]">
            <div className="flex items-center gap-2 text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
                    P
                </span>
                <span className="text-sm font-medium">{pkg.badge_label || "Premium"}</span>
            </div>

            <div className="mt-3">
                <h3 className="text-[28px] font-bold tracking-[-0.03em]" style={{ color: colors.title }}>
                    {pkg.label}
                </h3>
                {price && (
                    <p className="mt-1 text-[19px] font-bold text-white">
                        {price}
                        {getPlanKind(pkg) === "subscription" ? "/mois" : ""}
                    </p>
                )}
            </div>

            <div className="mt-4 h-px bg-white/[0.10]" />

            <ul className="mt-4 text-sm leading-6 text-white">
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
                className="mt-auto inline-flex h-11 w-full items-center justify-center rounded-full px-4 text-sm font-bold text-[#1d1d1d] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70"
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
        <div className="aspect-[1/1.08] w-full rounded-xl bg-white/[0.06] backdrop-blur-[80px]" />
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
        <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-16">
            <div className="max-w-2xl">
                <h1 className="mt-4 text-3xl font-bold tracking-[-0.05em] text-white md:text-[52px]">
                    Simple plans, designed to feel premium.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/42 md:text-[15px]">
                    Clear pricing, clean structure, and the right amount of detail to help users choose fast.
                </p>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                    <ComparePlansSection
                        packages={nonTrialPackages}
                        modelsComparison={modelsComparison}
                        onBuy={(id) => checkout(id)}
                        isPending={isPending}
                        pendingPackageId={pendingPackageId}
                    />
                </div>
            )}

            <div className="mx-auto w-full max-w-[920px] pt-6">
                <div className="text-center">
                    <h2 className="text-[28px] font-bold tracking-[-0.04em] text-white md:text-[34px]">
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
