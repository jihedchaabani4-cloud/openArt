"use client";

import { useRef, useState } from "react";
import { usePackages, useCheckout } from "@/features/payments/api/paymentsApi";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/shared/ui/accordion";
import { Button } from "@/shared/ui/button";
import { Check, ChevronDown, Loader2 } from "lucide-react";

const SURFACE_BACKGROUND = "#1a1a1a";
const SURFACE_BACKGROUND_ELEVATED = "#222222";
const SURFACE_BORDER = "#2f2f2f";
const SURFACE_BORDER_SUBTLE = "#2a2a2a";
const TEXT_PRIMARY = "#f3f3f3";
const TEXT_SECONDARY = "#d2d2d2";
const TEXT_MUTED = "#a3a3a3";
const TEXT_FAINT = "#7a7a7a";
const BUTTON_SURFACE = "#323232";
const BUTTON_SURFACE_HOVER = "#3a3a3a";
const BUTTON_PRIMARY = "#1a73e8";
const BUTTON_PRIMARY_HOVER = "#2b7de9";
const PLAN_COLORS = {
    title: TEXT_PRIMARY,
    button: BUTTON_SURFACE,
    hover: BUTTON_SURFACE_HOVER,
};

function formatPrice(value, currency = "USD") {
    if (value == null) {
        return null;
    }

    return `${value} ${currency}`;
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
    return PLAN_COLORS;
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
    if (safeCount === 0) {
        return "X";
    }
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
        <div className=" ">
            <div className="px-5 py-5">
                <h3 className="text-[28px] font-bold tracking-[-0.03em]" style={{ color: TEXT_PRIMARY }}>{title}</h3>
            </div>



            {visibleItems.map((item) => (
                <div
                    key={item.key}
                    className="grid items-center px-5 py-4"
                    style={{ gridTemplateColumns, borderBottom: `1px solid ${SURFACE_BORDER_SUBTLE}` }}
                >
                    <div className="pr-5">
                        <p className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{item.displayName}</p>
                        <p className="mt-1 text-xs" style={{ color: TEXT_MUTED }}>{formatModelBasis(item)}</p>
                    </div>

                    {packages.map((pkg) => {
                        const packageCount = item.packageCounts?.find((entry) => entry.packageId === pkg.id);
                        return (
                            <div
                                key={`${item.key}-${pkg.id}`}
                                className="text-sm font-medium"
                                style={{ color: TEXT_PRIMARY }}
                            >
                                {formatGenerationCount(packageCount?.count ?? 0, item.unitLabel)}
                            </div>
                        );
                    })}
                </div>
            ))}

            {hasMore && (
                <div className="px-5 py-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded((current) => !current)}
                        className="h-auto p-0 text-sm font-medium hover:bg-transparent hover:text-white"
                        style={{ color: TEXT_MUTED }}
                    >
                        <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                        />
                        {isExpanded ? "View less" : "View more"}
                    </Button>
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
                <h2 className="text-[40px] font-bold uppercase tracking-[-0.04em] md:text-[52px]" style={{ color: TEXT_PRIMARY }}>
                    Compare Credit Packs
                </h2>
            </div>

            <div
                className="rounded-[24px]  "
            >
                <div className="">
                    <div
                        className="sticky rounded-[24px] bg-white/5 backdrop-blur-[80px] top-0 z-30 
                        "
                    >
                        <div
                            ref={headerScrollRef}
                            onScroll={(event) =>
                                syncHorizontalScroll(event.currentTarget, bodyScrollRef.current, "header")
                            }
                            className="overflow-x-auto"
                        >
                            <div className="min-w-[1020px]">
                                <div
                                    className="grid px-5 pb-6 pt-5"
                                    style={{ gridTemplateColumns, background: "transparent" }}
                                >
                                    <div className="pr-5" />

                                    {packages.map((pkg) => {
                                        const price = formatPrice(pkg.price, pkg.currency);
                                        const ctaLabel = pkg.cta_label || `Get ${pkg.label}`;

                                        return (
                                            <div key={`sticky-${pkg.id}`} className="pr-3">
                                                <p className="text-base font-bold" style={{ color: TEXT_PRIMARY }}>{pkg.label}</p>
                                                {price && (
                                                    <p className="mt-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
                                                        {price}
                                                        {getPlanKind(pkg) === "subscription" ? "/month" : ""}
                                                    </p>
                                                )}
                                                <p className="mt-1 text-xs" style={{ color: TEXT_MUTED }}>{pkg.credits} credits</p>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => onBuy(pkg.id)}
                                                    disabled={isPending && pendingPackageId === pkg.id}
                                                    className="mt-3 h-10 w-full rounded-xl px-4 text-sm font-semibold hover:text-white"
                                                    style={{ background: BUTTON_SURFACE, color: TEXT_PRIMARY }}
                                                >
                                                    {isPending && pendingPackageId === pkg.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        ctaLabel
                                                    )}
                                                </Button>
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
        </div>
    );
}

function TemplatePricingCard({ pkg, modelsComparison, onBuy, isLoading }) {
    const features = Array.isArray(pkg.features)
        ? pkg.features.map((feature) => feature.replace(/^~\s*/, ""))
        : [];
    const price = formatPrice(pkg.price, pkg.currency);
    const ctaLabel = pkg.cta_label || `Get ${pkg.label}`;
    const colors = getPlanColor(pkg.label);

    const generatedBreakdown = [];
    if (modelsComparison) {
        // --- IMAGE GROUPS ---
        const imageGroups = [
            { name: "Nano Banana", match: (n) => n.includes("nano") },
            { name: "GPT Image 2", match: (n) => n.includes("gpt") || n.includes("gbt") }
        ];

        imageGroups.forEach(group => {
            let counts = [];
            modelsComparison.image?.forEach(item => {
                const name = item.displayName.toLowerCase();
                if (group.match(name)) {
                    const countObj = item.packageCounts?.find(entry => entry.packageId === pkg.id);
                    if (countObj && countObj.count > 0) {
                        counts.push(countObj.count);
                    }
                }
            });

            if (counts.length > 0) {
                const min = Math.min(...counts);
                const max = Math.max(...counts);
                const countStr = min === max ? `${max}` : `${min}-${max}`;
                generatedBreakdown.push({
                    text: `≈ ${countStr} ${group.name} Generations`,
                    isVideo: false
                });
            }
        });

        // Find max image model to highlight (e.g. z-image)
        let maxImageItem = null;
        let maxCountValue = 0;
        modelsComparison.image?.forEach(item => {
            const countObj = item.packageCounts?.find(entry => entry.packageId === pkg.id);
            if (countObj && countObj.count > maxCountValue) {
                maxCountValue = countObj.count;
                maxImageItem = item;
            }
        });

        if (maxImageItem) {
            const nameLower = maxImageItem.displayName.toLowerCase();
            const isCovered = imageGroups.some(group => group.match(nameLower));
            if (!isCovered) {
                generatedBreakdown.push({
                    text: `≈ ${maxCountValue} ${maxImageItem.displayName} Generations`,
                    isVideo: false
                });
            }
        }

        // --- VIDEO GROUPS ---
        const videoGroups = [
            { name: "Kling 3.0", match: (n) => n.includes("kling") },
            { name: "Seedance", match: (n) => n.includes("seedream") || n.includes("sea dream") || n.includes("seedance") }
        ];

        videoGroups.forEach(group => {
            let counts = [];
            modelsComparison.video?.forEach(item => {
                const name = item.displayName.toLowerCase();
                if (group.match(name)) {
                    const countObj = item.packageCounts?.find(entry => entry.packageId === pkg.id);
                    if (countObj && countObj.count > 0) {
                        counts.push(countObj.count);
                    }
                }
            });

            if (counts.length > 0) {
                const min = Math.min(...counts);
                const max = Math.max(...counts);
                const countStr = min === max ? `${max}` : `${min}-${max}`;
                generatedBreakdown.push({
                    text: `~ ${countStr} ${group.name} videos`,
                    isVideo: true
                });
            }
        });

        // Find max video model to highlight
        let maxVideoItem = null;
        let maxVideoCountValue = 0;
        modelsComparison.video?.forEach(item => {
            const countObj = item.packageCounts?.find(entry => entry.packageId === pkg.id);
            if (countObj && countObj.count > maxVideoCountValue) {
                maxVideoCountValue = countObj.count;
                maxVideoItem = item;
            }
        });

        if (maxVideoItem) {
            const nameLower = maxVideoItem.displayName.toLowerCase();
            const isCovered = videoGroups.some(group => group.match(nameLower));
            if (!isCovered) {
                generatedBreakdown.push({
                    text: `~ ${maxVideoCountValue} ${maxVideoItem.displayName} videos`,
                    isVideo: true
                });
            }
        }
    }

    // Fallback to credit_breakdown if modelsComparison is empty
    if (generatedBreakdown.length === 0 && Array.isArray(pkg.credit_breakdown) && pkg.credit_breakdown.length > 0) {
        pkg.credit_breakdown.forEach((item) => {
            generatedBreakdown.push({
                text: item,
                isVideo: item.toLowerCase().includes("video")
            });
        });
    }

    return (
        <article
            className="flex min-h-[480px] bg-white/7 backdrop-blur-[80px]  w-full flex-col rounded-2xl  p-5 text-white transition-colors duration-300 hover:border-[#3a3a3a] hover:bg-white/10"
        >
            {/* <div className="flex items-center gap-2 text-white/85">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] text-[10px] font-bold text-white">
                    P
                </span>
                <span className="text-sm font-medium text-white/62">{pkg.badge_label || "Premium"}</span>
            </div> */}

            <div className="mt-5">
                <h3 className="text-[32px] font-bold leading-none tracking-[-0.03em]" style={{ color: colors.title }}>
                    {pkg.label}
                </h3>
                {price && (
                    <p className="mt-3 text-[19px] font-bold" style={{ color: TEXT_PRIMARY }}>
                        {price}
                        {getPlanSuffix(pkg)}
                    </p>
                )}
            </div>

            {generatedBreakdown.length > 0 && (
                <div className="mt-6 min-h-[116px] space-y-2 pb-5" style={{ borderBottom: `1px solid ${SURFACE_BORDER}` }}>
                    {generatedBreakdown.map((item, i) => (
                        <p key={i} className="text-sm font-medium leading-5" style={{ color: TEXT_MUTED }}>
                            {item.text}
                        </p>
                    ))}
                </div>
            )}

            {!generatedBreakdown.length && <div className="mt-6" style={{ borderBottom: `1px solid ${SURFACE_BORDER}` }} />}

            <ul className="mt-5 space-y-2 text-sm leading-5" style={{ color: TEXT_SECONDARY }}>
                {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                        <Check size={16} className="mt-0.5 shrink-0" style={{ color: TEXT_PRIMARY }} />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <Button
                id={`buy-${pkg.id}`}
                type="button"
                onClick={() => onBuy(pkg.id)}
                disabled={isLoading}
                className="mt-auto h-11 w-full rounded-xl px-4 text-sm font-semibold transition-colors duration-200"
                style={{
                    backgroundColor: colors.button,
                    color: TEXT_PRIMARY,
                }}
                onMouseOver={(event) => {
                    event.currentTarget.style.backgroundColor = colors.hover;
                }}
                onMouseOut={(event) => {
                    event.currentTarget.style.backgroundColor = colors.button;
                }}
            >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : ctaLabel}
            </Button>

            {pkg.disclaimer && (
                <p className="mt-8 text-center text-xs underline underline-offset-4" style={{ color: TEXT_FAINT }}>
                    {pkg.disclaimer}
                </p>
            )}
        </article>
    );
}

function SkeletonCard() {
    return (
        <div
            style={{ background: SURFACE_BACKGROUND_ELEVATED, borderColor: SURFACE_BORDER }}
            className="aspect-[1/1.08] w-full rounded-xl border"
        />
    );
}

export function PricingSection() {
    const packsSectionRef = useRef(null);
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
            question: "How do credits work?",
            answer: "Each image or video generation uses a specific number of credits depending on the model and settings you choose. Your credit balance is used as you generate, and you can compare pack sizes on this page before buying.",
        },
        {
            question: "How much does each credit pack cost?",
            answer: `${priceSummary} Choose the pack that fits how many generations you want available for image and video creation.`,
        },
        {
            question: "How many images or videos can I generate?",
            answer: "It depends on the model you use. Faster or lighter models generate more with the same pack, while premium models use more credits. The comparison table above shows estimated output for each pack.",
        },
        {
            question: "Which credit pack should I choose?",
            answer:
                "Choose the smallest pack if you are testing the product, a mid-tier pack if you create every week, and the largest pack if you need the best value and more room to generate consistently.",
        },
        {
            question: "Do I get credits instantly after payment?",
            answer:
                "Yes. Payments are processed securely and your credits are added to your account right after the checkout is completed.",
        },
        {
            question: "Are these recurring subscriptions or one-time credit packs?",
            answer:
                hasSubscriptions && hasOneTimePlans
                    ? "This page can include both recurring subscriptions and one-time credit packs. You can tell which is which from the pack price and label before checkout."
                    : hasSubscriptions
                      ? "The available offers on this page are recurring subscriptions, so they renew automatically based on the billing cycle shown."
                      : "The available offers on this page are one-time credit packs, so you only pay when you decide to buy again.",
        },
        {
            question: "Can I buy more credits later?",
            answer:
                "Yes. You can come back anytime and buy another credit pack when you need more credits.",
        },
    ];

    return (
        <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-5 py-16">
            <div className="text-center">
                <h2 className="mt-4 text-[40px] font-bold tracking-[-0.05em] md:text-[52px]" style={{ color: TEXT_PRIMARY }}>
                    Choose the plan that suits you best
                </h2>
            </div>

            <div ref={packsSectionRef} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {isLoading && [1, 2, 3].map((item) => <SkeletonCard key={`sub-${item}`} />)}
                    {!isLoading && !isError && nonTrialPackages.map((pkg) => (
                        <TemplatePricingCard
                            key={pkg.id}
                            pkg={pkg}
                            modelsComparison={modelsComparison}
                            onBuy={(id) => checkout(id)}
                            isLoading={isPending && pendingPackageId === pkg.id}
                        />
                    ))}
                </div>

                {isError && (
                    <div
                        style={{ background: SURFACE_BACKGROUND_ELEVATED, borderColor: SURFACE_BORDER, color: TEXT_MUTED }}
                        className="rounded-[28px] border px-6 py-12 text-center text-sm md:col-span-3"
                    >
                        Could not load packages. Please try again later.
                    </div>
                )}
            </div>

            <p className="text-center text-xs" style={{ color: TEXT_FAINT }}>
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
                    <h2 className="text-[28px] font-bold tracking-[-0.04em] md:text-[34px]" style={{ color: TEXT_PRIMARY }}>
                        Frequently asked questions
                    </h2>
                    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6" style={{ color: TEXT_MUTED }}>
                        Short answers to the pricing questions people usually check before they buy.
                    </p>
                </div>

                <Accordion type="single" collapsible className="mt-8 space-y-4">
                    {faqItems.map((item, index) => (
                        <AccordionItem
                            key={item.question}
                            value={`faq-${index}`}
                            style={{ background: SURFACE_BACKGROUND_ELEVATED, borderColor: SURFACE_BORDER }}
                            className="rounded-2xl border px-5"
                        >
                            <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline" style={{ color: TEXT_PRIMARY }}>
                                {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="pb-5 text-sm leading-7" style={{ color: TEXT_SECONDARY }}>
                                {item.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                <div className="mt-10 flex items-center justify-center gap-4 text-center">
                    <p className="text-sm font-semibold" style={{ color: TEXT_SECONDARY }}>Ready to get started?</p>
                    <Button
                        type="button"
                        onClick={() => {
                            const element = packsSectionRef.current;
                            if (!element) {
                                return;
                            }

                            const rect = element.getBoundingClientRect();
                            const absoluteTop = window.scrollY + rect.top;
                            const centeredTop = absoluteTop - (window.innerHeight - rect.height) / 2;

                            window.scrollTo({
                                top: Math.max(0, centeredTop),
                                behavior: "smooth",
                            });
                        }}
                        disabled={!nonTrialPackages.length}
                        className="h-10 rounded-xl px-5 text-sm font-semibold text-white transition-colors"
                        style={{ background: BUTTON_PRIMARY }}
                        onMouseOver={(event) => {
                            event.currentTarget.style.backgroundColor = BUTTON_PRIMARY_HOVER;
                        }}
                        onMouseOut={(event) => {
                            event.currentTarget.style.backgroundColor = BUTTON_PRIMARY;
                        }}
                    >
                        Choose your pack
                    </Button>
                </div>
            </div>
        </section>
    );
}
