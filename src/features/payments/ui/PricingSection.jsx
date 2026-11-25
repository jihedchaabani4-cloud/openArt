"use client";

import { useRef, useState } from "react";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { usePackages, useCheckout } from "@/features/payments/api/paymentsApi";
import { PackageSelectionDialog } from "@/features/payments/ui/PackageSelectionDialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/base/accordion";
import { Button } from "@/components/base/button";
import { useAuthSession } from "@/shared/api/auth";
import { LoginDialog } from "@/components/layout/LoginDialog";

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
                <h3 className="ds-type-card-title text-white">{title}</h3>
            </div>



            {visibleItems.map((item) => (
                <div
                    key={item.key}
                    className="grid items-center border-b border-border px-5 py-4"
                    style={{ gridTemplateColumns }}
                >
                    <div className="pr-5">
                        <p className="ds-type-caption-label text-white">{item.displayName}</p>
                        <p className="mt-1 ds-type-small text-muted-foreground">{formatModelBasis(item)}</p>
                    </div>

                    {packages.map((pkg) => {
                        const packageCount = item.packageCounts?.find((entry) => entry.packageId === pkg.id);
                        return (
                            <div
                                key={`${item.key}-${pkg.id}`}
                                className="ds-type-caption-label text-white"
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
                        onClick={() => setIsExpanded((current) => !current)}
                        className="h-auto p-0 text-muted-foreground hover:bg-transparent hover:text-white"
                    >
                        <HugeIcon
                            name="arrow-down-01"
                            size="md"
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
                <h2 className="ds-type-section-heading uppercase text-white">
                    Compare Credit Packs
                </h2>
            </div>

            <div
                className="rounded-comfortable"
            >
                <div className="">
                    <div
                        className="sticky rounded-comfortable bg-white/5 backdrop-blur-[80px] top-0 z-30 
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
                                    className="grid bg-transparent px-5 pb-6 pt-5"
                                    style={{ gridTemplateColumns }}
                                >
                                    <div className="pr-5" />

                                    {packages.map((pkg) => {
                                        const price = formatPrice(pkg.price, pkg.currency);
                                        const ctaLabel = pkg.cta_label || `Get ${pkg.label}`;

                                        return (
                                            <div key={`sticky-${pkg.id}`} className="pr-3">
                                                <p className="ds-type-body text-white">{pkg.label}</p>
                                                {price && (
                                                    <p className="mt-2 ds-type-caption-label text-white">
                                                        {price}
                                                        {getPlanKind(pkg) === "subscription" ? "/month" : ""}
                                                    </p>
                                                )}
                                                <p className="mt-1 ds-type-small text-muted-foreground">{pkg.credits} credits</p>
                                                <Button
                                                    type="button"
                                                    variant="tonal"
                                                    onClick={() => onBuy(pkg.id)}
                                                    disabled={isPending && pendingPackageId === pkg.id}
                                                    className="mt-3 h-10 w-full rounded-subtle px-4 text-white hover:text-white"
                                                >
                                                    {isPending && pendingPackageId === pkg.id ? (
                                                        <HugeIcon name="loading-03" size="md" className="animate-spin" />
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

    const primaryFeatures = features.slice(0, 2);
    const secondaryFeatures = features.slice(2, 5);

    return (
        <article className="mx-auto flex w-full max-w-[290px] flex-col border-t border-white/12 pt-4 text-white sm:max-w-[310px]">
            <div className="space-y-3">
                <div className="space-y-2.5">
                    <p className="text-center ds-type-card-title text-white opacity-80">
                        {pkg.label}
                    </p>
                    {price && (
                        <p className="text-center ds-type-display-hero text-white">
                            ${Number(pkg.price).toFixed(2)}
                            <span className="ds-type-card-title">{getPlanSuffix(pkg) || ""}</span>
                        </p>
                    )}
                </div>

                <Button
                    id={`buy-${pkg.id}`}
                    type="button"
                    variant="primary"
                    onClick={() => onBuy(pkg.id)}
                    disabled={isLoading}
                    className="h-9 w-full rounded-subtle px-4 transition-colors duration-200 sm:h-10"
                >
                    {isLoading ? <HugeIcon name="loading-03" size="md" className="animate-spin" /> : "Get Started"}
                </Button>
            </div>

            <div className="mt-7 flex flex-1 flex-col gap-4">

                <ul className="space-y-4 ds-type-small text-white">
                    {primaryFeatures.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                            <HugeIcon name="tick-02" size="md" weight="bold" className="mt-1 shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>

                {(secondaryFeatures.length > 0 || generatedBreakdown.length > 0) && (
                    <div className="flex items-center gap-4 py-1">
                        <div className="h-px flex-1 bg-white/10" />
                        <HugeIcon name="add-01" size="lg" className="shrink-0 text-white" />
                        <div className="h-px flex-1 bg-white/10" />
                    </div>
                )}

                <ul className="space-y-4 ds-type-small text-white">
                    {secondaryFeatures.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                            <HugeIcon name="tick-02" size="md" weight="bold" className="mt-1 shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                    {generatedBreakdown.map((item) => {
                        const prefix = item.text.startsWith("~") ? "~" : "≈";
                        const cleanText = item.text.replace(/^[≈~]\s*/, "");
                        return (
                            <li key={item.text} className="flex items-start gap-3">
                                <span className="mt-0.5 flex w-4 shrink-0 rounded-sharp justify-center ds-type-feature-title opacity-90">
                                    {prefix}
                                </span>
                                <span>{cleanText}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </article>
    );
}

function SkeletonCard() {
    return (
        <div className="aspect-[1/1.08] w-full rounded-comfortable border border-border bg-surface-secondary" />
    );
}

export function PricingSection({ hideFaq = false }) {
    const packsSectionRef = useRef(null);
    const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);
    const { data: user } = useAuthSession();
    const { data, isLoading, isError } = usePackages();
    const { mutate: checkout, isPending, variables: pendingPackageId } = useCheckout();

    const handleBuy = (id) => {
        if (!user) {
            setLoginOpen(true);
        } else {
            checkout(id);
        }
    };

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
        <section className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 space-y-4 px-5 py-14">
            <div className="text-center">
                <h2 className="mt-4 ds-type-display-hero text-white">
                    Choose the plan that suits you best
                </h2>
            </div>

            <div ref={packsSectionRef} className="space-y-6">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3 xl:grid-cols-3">
                    {isLoading && [1, 2, 3].map((item) => <SkeletonCard key={`sub-${item}`} />)}
                    {!isLoading && !isError && nonTrialPackages.map((pkg) => (
                        <TemplatePricingCard
                            key={pkg.id}
                            pkg={pkg}
                            modelsComparison={modelsComparison}
                            onBuy={handleBuy}
                            isLoading={isPending && pendingPackageId === pkg.id}
                        />
                    ))}
                </div>

                {isError && (
                    <div className="rounded-comfortable border border-border bg-surface-secondary px-6 py-12 text-center ds-type-small text-muted-foreground md:col-span-3">
                        Could not load packages. Please try again later.
                    </div>
                )}
            </div>

            <p className="text-center ds-type-small text-(--text-secondary)">
                Secure payments powered by Lemon Squeezy. Credits are added instantly after payment.
            </p>

            {!isLoading && !isError && nonTrialPackages.length >= 3 && (
                <PackageSelectionDialog
                    open={isPackageDialogOpen}
                    onOpenChange={setIsPackageDialogOpen}
                    packages={nonTrialPackages}
                    modelsComparison={modelsComparison}
                    onBuy={handleBuy}
                    isPending={isPending}
                    pendingPackageId={pendingPackageId}
                />
            )}

            {!hideFaq && !isLoading && !isError && nonTrialPackages.length > 0 && (
                <div className="space-y-6 pt-4">
                    <ComparePlansSection
                        packages={nonTrialPackages}
                        modelsComparison={modelsComparison}
                        onBuy={handleBuy}
                        isPending={isPending}
                        pendingPackageId={pendingPackageId}
                    />
                </div>
            )}

            {!hideFaq && (
                <div className="w-full pt-10">
                    <div className="grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-14">
                        <div className="lg:pt-3">
                            <h2 className="max-w-[280px] ds-type-display-hero text-white">
                                Your
                                <br />
                                questions,
                                <br />
                                answered!
                            </h2>
                        </div>

                        <Accordion type="single" collapsible className="space-y-0">
                        {faqItems.map((item, index) => (
                            <AccordionItem
                                key={item.question}
                                value={`faq-${index}`}
                                className="border-b border-border first:border-t"
                            >
                                <AccordionTrigger
                                    className="py-6 text-left ds-type-feature-title text-white hover:no-underline"
                                    icon={
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-white">
                                            <HugeIcon name="add-01" size="md" />
                                        </span>
                                    }
                                >
                                    {item.question}
                                </AccordionTrigger>
                                <AccordionContent className="max-w-3xl pb-6 pr-12 ds-type-small text-white/80">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                        </Accordion>
                    </div>

                    <div className="mt-10 flex items-center justify-center gap-4 text-center">
                        <p className="ds-type-caption-label text-white/80">Ready to get started?</p>
                        <Button
                            type="button"
                            variant="primary"
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
                            className="h-10 rounded-subtle px-5 transition-colors"
                        >
                            Choose your pack
                        </Button>
                    </div>
                </div>
            )}
            <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
        </section>
    );
}
