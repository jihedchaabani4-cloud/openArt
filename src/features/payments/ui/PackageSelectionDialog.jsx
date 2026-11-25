"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Dialog, DialogContent, DialogTitle } from "@/components/primitives/dialog";
import { Button } from "@/components/base/button";
import { Label } from "@/components/base/label";
import { cn } from "@/shared/lib/utils";
import { usePackages, useCheckout } from "@/features/payments/api/paymentsApi";

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

function estimateTenCreditsPrice(pkg) {
    const value = Number(pkg?.price);
    const credits = Number(pkg?.credits);

    if (!Number.isFinite(value) || value <= 0 || !Number.isFinite(credits) || credits <= 0) {
        return null;
    }

    return `$${((value / credits) * 10).toFixed(2)}/ 10 CREDITS`;
}

function packageTagline(pkg, index) {
    if (pkg.popular || index === 1) {
        return "Most popular";
    }

    return null;
}

function estimateCreditsLabel(pkg) {
    const credits = Number(pkg?.credits);
    if (!Number.isFinite(credits) || credits <= 0) {
        return null;
    }

    if (credits >= 1000) {
        return `${Math.round(credits / 1000)}K`;
    }

    return `${credits}`;
}

function LeftPanel({ open }) {
    const showcaseImages = useMemo(() => [
        "https://res.cloudinary.com/dsak0vfdj/image/upload/v1779001221/videoframe_7532_zo71ss.png",
        "https://res.cloudinary.com/dsak0vfdj/image/upload/v1779001219/image-04_xs1uvy.jpg",
        "https://res.cloudinary.com/dsak0vfdj/image/upload/v1779001220/image-01_rxwgwy.jpg",
        "https://res.cloudinary.com/dsak0vfdj/image/upload/v1779001220/image-06_wxuiwl.webp",
        "https://res.cloudinary.com/dsak0vfdj/image/upload/v1779001221/j9yarb7pc4c2emfbpirdt3fu_jn9sjy.jpg",
    ], []);
    
    const [activeIndex, setActiveIndex] = useState(0);
    const [previousImage, setPreviousImage] = useState(null);
    const [progress, setProgress] = useState(0);
    const [isSliding, setIsSliding] = useState(false);
    
    const slideDuration = 4000;
    const activeImage = showcaseImages[activeIndex];

    useEffect(() => {
        if (!open) return;
        setPreviousImage(null);
        setIsSliding(false);
        setProgress(0);
        setActiveIndex(0);
    }, [open]);

    useEffect(() => {
        if (!open) return;

        let startTimestamp = Date.now();
        let animationFrameId;

        const syncProgress = () => {
            const elapsed = Date.now() - startTimestamp;
            const newProgress = Math.min((elapsed / slideDuration) * 100, 100);
            setProgress(newProgress);

            if (elapsed < slideDuration) {
                animationFrameId = window.requestAnimationFrame(syncProgress);
            }
        };

        animationFrameId = window.requestAnimationFrame(syncProgress);

        const intervalId = setInterval(() => {
            setProgress(0);
            setPreviousImage(showcaseImages[activeIndex]);
            setIsSliding(false);

            const nextIndex = (activeIndex + 1) % showcaseImages.length;
            setActiveIndex(nextIndex);
            
            startTimestamp = Date.now();

            setTimeout(() => {
                setIsSliding(true);
            }, 20);

            setTimeout(() => {
                setPreviousImage(null);
            }, 720);

        }, slideDuration);

        return () => {
            clearInterval(intervalId);
            if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
        };
    }, [activeIndex, open, showcaseImages]);

    return (
        <div className="relative hidden h-[280px] sm:h-[360px] lg:h-full lg:min-h-[420px] w-full overflow-hidden rounded-comfortable lg:flex border border-white/10">
            <div className="relative size-full overflow-hidden">
                <div className="absolute inset-0">
                    {previousImage ? (
                        <img
                            key={`previous-${previousImage}`}
                            src={previousImage}
                            alt="Showcase Previous"
                            aria-hidden="true"
                            className={[
                                "absolute inset-0 size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                                isSliding ? "translate-x-full" : "translate-x-0",
                            ].join(" ")}
                        />
                    ) : null}

                    <img
                        key={activeImage}
                        src={activeImage}
                        alt="Showcase Active"
                        className={[
                            "absolute inset-0 size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                            previousImage ? (isSliding ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
                        ].join(" ")}
                    />
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-white/10" />
                <div className="pointer-events-none absolute bottom-7 left-7 right-7 z-10 h-[2px] overflow-hidden rounded-sharp bg-white/20">
                    <div
                        className="h-full rounded-sharp bg-white"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="relative z-10 flex h-full flex-col justify-end p-5 lg:p-6 pb-9 lg:pb-10">
                    <div className="space-y-2">
                        <div className="flex w-fit items-center gap-2 ds-type-caption-label text-white/90">
                            Premium creative access
                        </div>
                        <p className="max-w-[280px] ds-type-feature-title text-white">
                            Unlock stronger image and video models for your workflow.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function PackageSelectionDialog({
    open,
    onOpenChange,
    packages: packagesProp,
    modelsComparison: _modelsComparisonProp,
    onBuy: onBuyProp,
    isPending: isPendingProp = false,
    pendingPackageId: pendingPackageIdProp,
    showViewAllLink = false,
}) {
    // Self-fetch data when not provided as props (standalone usage)
    const { data: fetchedData } = usePackages();
    const checkoutMutation = useCheckout();

    const onBuy = onBuyProp ?? ((pkgId) => checkoutMutation.mutate(pkgId));
    const isPending = isPendingProp || checkoutMutation.isPending;
    const pendingPackageId = pendingPackageIdProp ?? (checkoutMutation.isPending ? checkoutMutation.variables : undefined);

    const visiblePackages = useMemo(() => {
        const packages = packagesProp ?? fetchedData?.packages ?? [];
        return packages.slice(0, 3);
    }, [packagesProp, fetchedData?.packages]);
    const [selectedPackageId, setSelectedPackageId] = useState(visiblePackages[0]?.id ?? null);

    useEffect(() => {
        if (!visiblePackages.length) {
            setSelectedPackageId(null);
            return;
        }

        setSelectedPackageId((current) =>
            visiblePackages.some((pkg) => pkg.id === current) ? current : visiblePackages[0].id
        );
    }, [visiblePackages]);

    const selectedPackage = visiblePackages.find((pkg) => pkg.id === selectedPackageId) ?? visiblePackages[0] ?? null;

    // Show loading state if no packages fetched yet
    if (!open) return null;

    if (!visiblePackages.length) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    showCloseButton
                    className="flex h-[min(740px,84vh)] w-[min(960px,94vw)] max-w-[960px] items-center justify-center overflow-hidden p-0"
                >
                    <DialogTitle className="sr-only">Choose your package</DialogTitle>
                    <HugeIcon name="loading-03" size="2xl" className="animate-spin text-white/40" />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton
                className="h-[min(740px,84vh)] w-[min(960px,94vw)] max-w-[960px] overflow-hidden p-0"
            >
                <DialogTitle className="sr-only">Choose your package</DialogTitle>

                <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]">
                    <div className="hidden p-3 pb-0 lg:block lg:pb-4">
                        <LeftPanel open={open} />
                    </div>

                    <div className="flex min-h-0 flex-col justify-start px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-7 lg:px-7 lg:pt-10 xl:px-8">
                        <div className="max-w-[428px]">
                            <h3 className="ds-type-card-title text-white">
                                Unlock more image and video power.
                            </h3>
                            <p className="mt-2 max-w-[420px] ds-type-small text-white/70">
                                Generate, edit, and scale high-quality images and videos with the models that matter most.
                            </p>
                        </div>

                        <div className="mt-5 min-h-0 space-y-3 overflow-y-auto pr-1 sm:mt-6">
                            {visiblePackages.map((pkg, index) => {
                                const isSelected = pkg.id === selectedPackageId;
                                const price = formatPrice(pkg.price, pkg.currency);
                                const tag = packageTagline(pkg, index);
                                const tenCreditsPrice = estimateTenCreditsPrice(pkg);
                                const creditsLabel = estimateCreditsLabel(pkg);

                                return (
                                    <Button
                                        key={pkg.id}
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setSelectedPackageId(pkg.id)}
                                        className={cn(
                                            "w-full h-auto p-3 sm:p-4 rounded-comfortable border text-left transition-all duration-200 block justify-start",
                                            isSelected
                                                ? "border-white/90 bg-surface-card"
                                                : "border-white/10 bg-transparent hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className={cn(
                                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                                                    isSelected ? "border-white bg-white" : "border-white/20 bg-transparent"
                                                )}
                                            >
                                                {isSelected && <HugeIcon name="tick-02" size="xs" weight="bold" className="text-black" />}
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3 sm:gap-4">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="ds-type-caption-label text-white">
                                                                {pkg.label}
                                                            </p>
                                                            {tag === "Most popular" && (
                                                                <span className="rounded-sharp bg-white/10 px-1.5 py-0.5 ds-type-micro-tag text-white/80">
                                                                    Economisez
                                                                </span>
                                                            )}
                                                        </div>

                                                        {price && (
                                                            <p className="mt-1 ds-type-small text-white/70">
                                                                {price}
                                                                {getPlanSuffix(pkg)}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="shrink-0 text-right">
                                                        <p className="flex items-center justify-end gap-1 ds-type-small text-white">
                                                            <HugeIcon name="star" size="sm" className="text-white" />
                                                            {creditsLabel}
                                                        </p>
                                                        {tenCreditsPrice && (
                                                            <p className="mt-1 ds-type-caption-label text-white">
                                                                {tenCreditsPrice}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {tag === "Most popular" && (
                                                    <div className="mt-3 flex w-full items-start gap-1 rounded-subtle bg-white/5 border border-white/10 px-2 py-1.5 ds-type-micro-tag text-white/70">
                                                        <HugeIcon name="star" size="xs" className="text-white mt-[2px] shrink-0" />
                                                        <span>
                                                            Most popular - Get the strongest value for image and video generation before it changes.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>

                        {selectedPackage && getPlanKind(selectedPackage) === "subscription" && (
                            <p className="mt-4 text-center ds-type-micro-tag text-white/60 lg:mt-5 lg:text-left">
                                With the selected plan,{" "}
                                <span className="text-white">
                                    you will be charged {formatPrice(selectedPackage.price, selectedPackage.currency)} each billing cycle
                                </span>{" "}
                                until you cancel.
                            </p>
                        )}

                        {selectedPackage && (
                            <div className="mt-5 border-t border-white/10 pt-4 lg:mt-6">
                                <div className="flex items-center justify-between gap-4">
                                    <Label as="span">
                                        Total Cost
                                    </Label>
                                    <p className="ds-type-caption-label text-white">
                                        {formatPrice(selectedPackage.price, selectedPackage.currency)}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mt-5 space-y-4 lg:mt-6">
                            <Button
                                type="button"
                                variant="primary"
                                disabled={!selectedPackage || (isPending && pendingPackageId === selectedPackage.id)}
                                onClick={() => {
                                    if (selectedPackage) {
                                        onBuy?.(selectedPackage.id);
                                    }
                                }}
                                className="relative h-12 w-full overflow-hidden rounded-subtle px-5 py-3 transition-all sm:h-14 sm:py-4 before:absolute before:left-[-40%] before:top-0 before:h-full before:w-[8%] before:skew-x-[-20deg] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent before:content-['']"
                            >
                                {isPending && pendingPackageId === selectedPackage?.id ? (
                                    <HugeIcon name="loading-03" size="lg" className="animate-spin" />
                                ) : (
                                    "Continuer"
                                )}
                            </Button>
                            <div className="flex w-full flex-col gap-1">
                                <div className="flex w-full items-center justify-center gap-2">
                                    <HugeIcon name="security-check" size="md" />
                                    <p className="text-center ds-type-micro-tag text-white">
                                        Paiement sur et securise
                                    </p>
                                </div>
                                <div className="flex w-full items-center justify-center gap-3">
                                    {[
                                        "paypal.svg",
                                        "visa.svg",
                                        "mastercard.svg",
                                        "amex.svg",
                                        "discover.svg",
                                        "jcb.svg",
                                    ].map((logo) => (
                                        <img
                                            key={logo}
                                            alt="card-vendor"
                                            width="36"
                                            height="23"
                                            src={`https://cdn-chatly.vyro.ai/chatly-web/images/pro-modal/payment-cards/${logo}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            {showViewAllLink && (
                                <div className="mt-4 flex w-full items-center justify-center">
                                    <Link
                                        href="/pricing"
                                        onClick={() => onOpenChange?.(false)}
                                        className="group inline-flex h-8 items-center justify-center gap-1.5 rounded-subtle px-2.5 py-1.5 ds-type-small text-white transition-colors hover:bg-white/5"
                                    >
                                        <span className="relative">View all plans and features</span>
                                        <span className="relative">
                                            <HugeIcon name="arrow-up-right-01" size="md" className="text-white transition-colors group-hover:text-white/70" />
                                        </span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
