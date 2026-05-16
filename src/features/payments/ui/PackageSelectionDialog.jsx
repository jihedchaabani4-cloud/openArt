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
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

const SURFACE_BORDER = "rgba(255,255,255,0.1)";
const SURFACE_PANEL = "#1b1b1b";
const TEXT_PRIMARY = "#f3f3f3";
const TEXT_SECONDARY = "rgba(255,255,255,0.72)";
const TEXT_MUTED = "rgba(255,255,255,0.56)";
const TEXT_FAINT = "rgba(255,255,255,0.4)";
const BUTTON_PRIMARY = "#1a73e8";
const BUTTON_PRIMARY_HOVER = "#2b7de9";

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

function getPlanHeroBackground(label) {
    const value = label?.toLowerCase() || "";

    if (value.includes("starter")) {
        return "radial-gradient(circle at 22% 12%, rgba(255,255,255,0.16), transparent 18%), radial-gradient(circle at 70% 18%, rgba(18,52,112,0.28), transparent 34%), linear-gradient(180deg, #071018 0%, #05080c 100%)";
    }

    if (value.includes("creator")) {
        return "radial-gradient(circle at 22% 12%, rgba(255,255,255,0.16), transparent 18%), radial-gradient(circle at 70% 18%, rgba(26,58,124,0.28), transparent 34%), linear-gradient(180deg, #08111a 0%, #05080c 100%)";
    }

    if (value.includes("studio")) {
        return "radial-gradient(circle at 22% 12%, rgba(255,255,255,0.16), transparent 18%), radial-gradient(circle at 70% 18%, rgba(31,61,133,0.28), transparent 34%), linear-gradient(180deg, #071018 0%, #05080c 100%)";
    }

    return "radial-gradient(circle at 22% 12%, rgba(255,255,255,0.16), transparent 18%), radial-gradient(circle at 70% 18%, rgba(31,61,133,0.28), transparent 34%), linear-gradient(180deg, #071018 0%, #05080c 100%)";
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

function getModelFamilyKey(model) {
    const key = model?.key?.toLowerCase() || "";
    const name = model?.displayName?.toLowerCase() || "";
    const source = `${key} ${name}`;

    if (source.includes("nanobana")) return "nanobana";
    if (source.includes("gpt-image") || source.includes("gpt image")) return "gpt-image";
    if (source.includes("imagen") || source.includes("google") || source.includes("veo")) return "google";
    if (source.includes("seedream")) return "seedream";
    if (source.includes("seedance")) return "seedance";
    if (source.includes("kling")) return "kling";
    if (source.includes("runway")) return "runway";
    if (source.includes("z-image") || source.includes("z image") || source.includes("zimage")) return "z-image";
    if (source.includes("topaz")) return "topaz";

    return key || name;
}

function pickTopModelIcons(modelsComparison = { image: [], video: [] }) {
    const unique = new Map();
    const allModels = [...(modelsComparison.image ?? []), ...(modelsComparison.video ?? [])];

    for (const model of allModels) {
        if (!model?.icon) {
            continue;
        }

        const familyKey = getModelFamilyKey(model);
        if (!unique.has(familyKey)) {
            unique.set(familyKey, {
                key: familyKey,
                icon: model.icon,
                name: model.displayName || model.key,
            });
        }
    }

    return Array.from(unique.values());
}

function buildModelsCaption(models) {
    if (!models.length) {
        return "Access top and pro models in one package.";
    }

    const hasProModel = models.some((model) => /pro|ultra|turbo/i.test(model.name));

    if (hasProModel) {
        return "Access the best models, including pro and premium generation models.";
    }

    return "Access the best generation models in one package.";
}

export function PackageSelectionDialog({
    open,
    onOpenChange,
    packages = [],
    modelsComparison = { image: [], video: [] },
    onBuy,
    isPending = false,
    pendingPackageId,
    showViewAllLink = false,
}) {
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
    const heroPackage = visiblePackages[1] ?? visiblePackages[0] ?? null;
    const topModelIcons = pickTopModelIcons(modelsComparison);
    const modelsCaption = buildModelsCaption(topModelIcons);

    if (!visiblePackages.length) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton
                className="h-[min(92vh,980px)] w-[min(1008px,calc(100vw-20px))] overflow-hidden rounded-[24px] border-0 bg-(--background-base-pri) p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.58)] backdrop-blur-[80px] sm:w-[min(1008px,calc(100vw-32px))] sm:rounded-[28px] sm:max-w-[1008px]"
            >
                <DialogTitle className="sr-only">Choose your package</DialogTitle>

                <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(360px,520px)_minmax(0,1fr)]">
                    <div className="hidden p-3 pb-0 lg:block lg:pb-4">
                        <div
                            className="relative flex h-[280px] flex-col justify-between overflow-hidden rounded-[20px] border border-white/8 p-4 sm:h-[360px] sm:p-5 lg:h-full lg:min-h-[420px] lg:p-6"
                            style={{ background: getPlanHeroBackground(heroPackage?.label) }}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_55%,rgba(255,0,0,0.22),transparent_12%),linear-gradient(180deg,rgba(2,6,23,0.05)_0%,rgba(0,0,0,0.18)_34%,rgba(0,0,0,0.84)_100%)]" />
                            <div className="absolute left-[-4%] top-[44%] h-[92px] w-[118%] rotate-[8deg] rounded-full border-t-[4px] border-white/75 opacity-90 blur-[1px]" />
                            <div className="absolute left-[-6%] top-[49%] h-[120px] w-[122%] rotate-[8deg] rounded-full border-t-[4px] border-white/30 opacity-80" />
                            <div className="absolute bottom-[14%] left-[24%] h-[360px] w-[220px] rounded-[120px] bg-[radial-gradient(circle_at_60%_36%,rgba(255,255,255,0.18),transparent_18%),linear-gradient(180deg,#13171c_0%,#090b0d_60%,#030405_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.75)] before:absolute before:inset-0 before:rounded-[120px] before:border before:border-white/8 before:content-[''] after:absolute after:left-[55%] after:top-[31%] after:h-[4px] after:w-[140px] after:-translate-x-1/2 after:rotate-[14deg] after:bg-[linear-gradient(90deg,rgba(255,0,0,0),rgba(255,43,43,1)_30%,rgba(255,92,92,1)_50%,rgba(255,0,0,0)_100%)] after:shadow-[0_0_18px_rgba(255,0,0,0.95)] after:content-['']" />

                            <div className="relative z-10 max-w-[280px] space-y-2">
                                <div className="flex w-fit items-center gap-2 text-[12px] font-semibold text-white/92 sm:text-[14px]">
                                    Premium creative access
                                </div>
                                <p className="max-w-[260px] text-[16px] font-semibold leading-[1.25] tracking-[-0.03em] text-white sm:text-[18px]">
                                    Unlock stronger image and video models for your workflow.
                                </p>
                            </div>

                            <div className="relative z-10 space-y-4 sm:space-y-5">
                                <div className="flex flex-wrap gap-3 sm:gap-4 text-white/92">
                                    {topModelIcons.length > 0 && (
                                        topModelIcons.map((model) => (
                                            <div
                                                key={model.key}
                                                className="flex h-10 w-10 items-center justify-center sm:h-12 sm:w-12"
                                                title={model.name}
                                            >
                                                <img
                                                    src={model.icon}
                                                    alt={model.name}
                                                    className="h-10 w-10 object-contain brightness-0 invert sm:h-12 sm:w-12"
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-[14px] font-[100] text-white/42 sm:text-[18px]">
                                    {modelsCaption}
                                </p>
                            </div>
                        </div>
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
                                                                <span className="rounded-md bg-[#173d70] px-1.5 py-0.5 text-[10px] font-medium leading-none text-[#b6d5ff]">
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
                                                        <p className="flex items-center justify-end gap-1 text-[11px] font-normal" style={{ color: TEXT_PRIMARY }}>
                                                            <Sparkles size={13} />
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
                                                    <div className="mt-3 flex w-full items-start gap-1 rounded-md bg-[#bcff1f] px-2 py-1.5 text-[10px] font-medium leading-3.5 text-black shadow-[0_0_4px_0_#d2ff1f]">
                                                        <Sparkles size={12} className="mt-0.5 shrink-0" />
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
                                className="relative h-12 w-full overflow-hidden rounded-[18px] px-5 py-3 text-[15px] font-medium text-white transition-colors before:absolute before:left-[-40%] before:top-0 before:h-full before:w-[8%] before:skew-x-[-20deg] before:bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.5)_50%,transparent_100%)] before:content-[''] sm:h-14 sm:rounded-[20px] sm:py-4 sm:text-[16px]"
                                style={{ background: BUTTON_PRIMARY }}
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
