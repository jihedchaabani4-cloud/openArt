"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Check,
    Loader2,
    Sparkles,
    ShieldCheck,
    ArrowUpRight,
} from "lucide-react";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { usePackages, useCheckout } from "@/features/payments/api/paymentsApi";

const SURFACE_BORDER = "rgba(255,255,255,0.1)";
const SURFACE_PANEL = "#1b1b1b";
const TEXT_PRIMARY = "#f3f3f3";
const TEXT_SECONDARY = "rgba(255,255,255,0.72)";
const TEXT_MUTED = "rgba(255,255,255,0.56)";
const TEXT_FAINT = "rgba(255,255,255,0.4)";
const BUTTON_PRIMARY = "#d9d9de";
const BUTTON_PRIMARY_HOVER = "#e8e8eb";
const BUTTON_TEXT = "#202020";

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
        <div className="relative hidden h-[280px] sm:h-[360px] lg:h-full lg:min-h-[420px] w-full overflow-hidden rounded-[20px] lg:flex border border-white/8">
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
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#02050c]/92 via-[#02050c]/28 to-white/10" />
                <div className="pointer-events-none absolute bottom-7 left-7 right-7 z-10 h-[2px] overflow-hidden rounded-full bg-white/20">
                    <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="relative z-10 flex h-full flex-col justify-end p-5 lg:p-6 pb-9 lg:pb-10">
                    <div className="space-y-2">
                        <div className="flex w-fit items-center gap-2 text-[12px] font-semibold text-white/92 sm:text-[14px]">
                            Premium creative access
                        </div>
                        <p className="max-w-[280px] text-[16px] font-semibold leading-[1.25] tracking-[-0.03em] text-white sm:text-[18px]">
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
    modelsComparison: modelsComparisonProp,
    onBuy: onBuyProp,
    isPending: isPendingProp = false,
    pendingPackageId: pendingPackageIdProp,
    showViewAllLink = false,
}) {
    // Self-fetch data when not provided as props (standalone usage)
    const { data: fetchedData } = usePackages();
    const checkoutMutation = useCheckout();

    const packages = packagesProp ?? fetchedData?.packages ?? [];
    const modelsComparison = modelsComparisonProp ?? fetchedData?.modelsComparison ?? { image: [], video: [] };
    const onBuy = onBuyProp ?? ((pkgId) => checkoutMutation.mutate(pkgId));
    const isPending = isPendingProp || checkoutMutation.isPending;
    const pendingPackageId = pendingPackageIdProp ?? (checkoutMutation.isPending ? checkoutMutation.variables : undefined);

    const visiblePackages = useMemo(() => packages.slice(0, 3), [packages]);
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
                    className="flex h-[min(740px,84vh)] w-[min(960px,94vw)] max-w-[960px] items-center justify-center overflow-hidden rounded-[32px] border-0 bg-(--background-base-pri) p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.58)] backdrop-blur-[80px]"
                >
                    <DialogTitle className="sr-only">Choose your package</DialogTitle>
                    <Loader2 className="animate-spin text-white/40" size={32} />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton
                className="h-[min(740px,84vh)] w-[min(960px,94vw)] max-w-[960px] overflow-hidden rounded-[32px] border-0 bg-(--background-base-pri) p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.58)] backdrop-blur-[80px]"
            >
                <DialogTitle className="sr-only">Choose your package</DialogTitle>

                <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]">
                    <div className="hidden p-3 pb-0 lg:block lg:pb-4">
                        <LeftPanel open={open} />
                    </div>

                    <div className="flex min-h-0 flex-col justify-start px-4 pb-4 pt-5 sm:px-6 sm:pb-6 sm:pt-7 lg:px-7 lg:pt-10 xl:px-8">
                        <div className="max-w-[428px]">
                            <h3 className="text-[20px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[22px]" style={{ color: TEXT_PRIMARY }}>
                                Unlock more image and video power.
                            </h3>
                            <p className="mt-2 max-w-[420px] text-[12px] font-normal leading-5" style={{ color: TEXT_SECONDARY }}>
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
                                    <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => setSelectedPackageId(pkg.id)}
                                        className="w-full rounded-[16px] border px-3 py-3 text-left transition-all duration-200 sm:px-4"
                                        style={{
                                            borderColor: isSelected ? "rgba(255,255,255,0.88)" : SURFACE_BORDER,
                                            background: isSelected ? SURFACE_PANEL : "transparent",
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                                                style={{
                                                    borderColor: isSelected ? "#ffffff" : "rgba(255,255,255,0.16)",
                                                    background: isSelected ? "#ffffff" : "transparent",
                                                }}
                                            >
                                                {isSelected && <Check size={12} color="#101010" />}
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3 sm:gap-4">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-[15px] font-medium leading-none tracking-[-0.02em]" style={{ color: TEXT_PRIMARY }}>
                                                                {pkg.label}
                                                            </p>
                                                            {tag === "Most popular" && (
                                                                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white/80">
                                                                    Economisez
                                                                </span>
                                                            )}
                                                        </div>

                                                        {price && (
                                                            <p className="mt-1 text-[12px] font-normal leading-none" style={{ color: TEXT_SECONDARY }}>
                                                                {price}
                                                                {getPlanSuffix(pkg)}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="shrink-0 text-right">
                                                        <p className="flex items-center justify-end gap-1 text-[13px] font-normal" style={{ color: TEXT_PRIMARY }}>
                                                            <GoogleIcon iconName="stars" className="text-[13px] text-white" />
                                                            {creditsLabel}
                                                        </p>
                                                        {tenCreditsPrice && (
                                                            <p className="mt-1 text-[14px] font-medium leading-none" style={{ color: TEXT_PRIMARY }}>
                                                                {tenCreditsPrice}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {tag === "Most popular" && (
                                                    <div className="mt-3 flex w-full items-start gap-1 rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-[10px] font-medium leading-3.5 text-white/70">
                                                        <GoogleIcon iconName="stars" className="text-[12px] text-white mt-[2px] shrink-0" />
                                                        <span>
                                                            Most popular - Get the strongest value for image and video generation before it changes.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedPackage && getPlanKind(selectedPackage) === "subscription" && (
                            <p className="mt-4 text-center text-[11px] font-normal leading-5 lg:mt-5 lg:text-left" style={{ color: TEXT_MUTED }}>
                                With the selected plan,{" "}
                                <span style={{ color: TEXT_PRIMARY }}>
                                    you will be charged {formatPrice(selectedPackage.price, selectedPackage.currency)} each billing cycle
                                </span>{" "}
                                until you cancel.
                            </p>
                        )}

                        {selectedPackage && (
                            <div className="mt-5 border-t border-white/10 pt-4 lg:mt-6">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-[12px] font-medium tracking-[-0.02em]" style={{ color: TEXT_FAINT }}>
                                        Total Cost
                                    </p>
                                    <p className="text-[14px] font-semibold tracking-[-0.02em]" style={{ color: TEXT_PRIMARY }}>
                                        {formatPrice(selectedPackage.price, selectedPackage.currency)}
                                    </p>
                                </div>
                            </div>
                        )}


                        <div className="mt-5 space-y-4 lg:mt-6">
                            <Button
                                type="button"
                                disabled={!selectedPackage || (isPending && pendingPackageId === selectedPackage.id)}
                                onClick={() => {
                                    if (selectedPackage) {
                                        onBuy?.(selectedPackage.id);
                                    }
                                }}
                                className="relative h-12 w-full overflow-hidden rounded-[18px] px-5 py-3 text-[15px] font-semibold transition-colors before:absolute before:left-[-40%] before:top-0 before:h-full before:w-[8%] before:skew-x-[-20deg] before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] before:content-[''] sm:h-14 sm:rounded-[20px] sm:py-4 sm:text-[16px]"
                                style={{ background: BUTTON_PRIMARY, color: BUTTON_TEXT }}
                                onMouseOver={(event) => {
                                    event.currentTarget.style.backgroundColor = BUTTON_PRIMARY_HOVER;
                                }}
                                onMouseOut={(event) => {
                                    event.currentTarget.style.backgroundColor = BUTTON_PRIMARY;
                                }}
                            >
                                {isPending && pendingPackageId === selectedPackage?.id ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    "Continuer"
                                )}
                            </Button>
                            <div className="flex w-full flex-col gap-1">
                                <div className="flex w-full items-center justify-center gap-2">
                                    <ShieldCheck size={16} />
                                    <p className="text-center text-[11px] font-normal" style={{ color: TEXT_PRIMARY }}>
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
                                    className="group inline-flex h-8 items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-white/6"
                                >
                                    <span className="relative">View all plans and features</span>
                                    <span className="relative">
                                        <ArrowUpRight size={16} className="text-white transition-colors group-hover:text-white/70" />
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
