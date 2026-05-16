"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Check,
    Loader2,
    Sparkles,
    CreditCard,
    ArrowRight,
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

function estimateDailyPrice(pkg) {
    const value = Number(pkg?.price);
    if (!Number.isFinite(value) || value <= 0) {
        return null;
    }

    const label = (pkg?.label || "").toLowerCase();
    const planKind = getPlanKind(pkg);

    let divisor = 30;

    if (label.includes("year") || label.includes("annual") || label.includes("annuel")) {
        divisor = 365;
    } else if (label.includes("quarter") || label.includes("trim")) {
        divisor = 90;
    } else if (planKind !== "subscription") {
        divisor = 30;
    }

    return `$${(value / divisor).toFixed(2)}/day`;
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
        return "Access the top generation models included in this package.";
    }

    const names = models.map((model) => model.name);

    if (names.length === 1) {
        return `Access ${names[0]} in this package.`;
    }

    if (names.length === 2) {
        return `Access ${names[0]} and ${names[1]} in this package.`;
    }

    const last = names[names.length - 1];
    const rest = names.slice(0, -1).join(", ");
    return `Access ${rest}, and ${last} in this package.`;
}

export function PackageSelectionDialog({
    open,
    onOpenChange,
    packages = [],
    modelsComparison = { image: [], video: [] },
    onBuy,
    isPending = false,
    pendingPackageId,
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
                className="w-[min(1008px,calc(100vw-40px))] overflow-hidden rounded-[28px] border-0 bg-[#171717] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.58)] sm:max-w-[1008px]"
            >
                <DialogTitle className="sr-only">Choose your package</DialogTitle>

                <div className="grid min-h-[760px] grid-cols-1 lg:grid-cols-[520px_minmax(420px,1fr)]">
                    <div className="p-4 pb-0 lg:pb-4">
                        <div
                            className="relative flex h-full min-h-[420px] flex-col justify-between overflow-hidden rounded-[20px] border border-white/8 p-6"
                            style={{ background: getPlanHeroBackground(heroPackage?.label) }}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_55%,rgba(255,0,0,0.22),transparent_12%),linear-gradient(180deg,rgba(2,6,23,0.05)_0%,rgba(0,0,0,0.18)_34%,rgba(0,0,0,0.84)_100%)]" />
                            <div className="absolute left-[-4%] top-[44%] h-[92px] w-[118%] rotate-[8deg] rounded-full border-t-[4px] border-white/75 opacity-90 blur-[1px]" />
                            <div className="absolute left-[-6%] top-[49%] h-[120px] w-[122%] rotate-[8deg] rounded-full border-t-[4px] border-white/30 opacity-80" />
                            <div className="absolute bottom-[14%] left-[24%] h-[360px] w-[220px] rounded-[120px] bg-[radial-gradient(circle_at_60%_36%,rgba(255,255,255,0.18),transparent_18%),linear-gradient(180deg,#13171c_0%,#090b0d_60%,#030405_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.75)] before:absolute before:inset-0 before:rounded-[120px] before:border before:border-white/8 before:content-[''] after:absolute after:left-[55%] after:top-[31%] after:h-[4px] after:w-[140px] after:-translate-x-1/2 after:rotate-[14deg] after:bg-[linear-gradient(90deg,rgba(255,0,0,0),rgba(255,43,43,1)_30%,rgba(255,92,92,1)_50%,rgba(255,0,0,0)_100%)] after:shadow-[0_0_18px_rgba(255,0,0,0.95)] after:content-['']" />

                            <div className="relative z-10 max-w-[280px] space-y-4">
                                <div className="flex w-fit items-center gap-2 text-[14px] font-semibold text-white/92">
                                    <Sparkles size={13} className="text-[#5bb0ff]" />
                                    Created with Open Art premium packs
                                </div>
                                <p className="max-w-[260px] text-[18px] font-semibold leading-[1.25] tracking-[-0.03em] text-white">
                                    Join 200,000+ creators already making with Open Art
                                </p>
                            </div>

                            <div className="relative z-10 space-y-5">
                                <div className="flex gap-4 text-white/92">
                                    {topModelIcons.length > 0 ? (
                                        topModelIcons.map((model) => (
                                            <div
                                                key={model.key}
                                                className="flex h-10 w-10 items-center justify-center"
                                                title={model.name}
                                            >
                                                <img
                                                    src={model.icon}
                                                    alt={model.name}
                                                    className="h-8 w-8 object-contain brightness-0 invert"
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        [Sparkles, CreditCard, ArrowRight].map((Icon, index) => (
                                            <div key={index} className="flex h-10 w-10 items-center justify-center text-white">
                                                <Icon size={28} strokeWidth={1.8} />
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="max-w-[420px] text-[14px] leading-8 text-white/42">
                                    {modelsCaption}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col px-7 pb-6 pt-10 sm:px-8">
                        <div className="max-w-[428px]">
                            <h3 className="text-[31px] font-semibold leading-[1.05] tracking-[-0.045em]" style={{ color: TEXT_PRIMARY }}>
                                Le moteur ne s’arrête pas là.
                            </h3>
                            <p className="mt-3 max-w-[420px] text-[15px] leading-9 tracking-[-0.02em]" style={{ color: TEXT_SECONDARY }}>
                                Images, Docs, diapositives, recherche, vidéo. Un seul espace de travail.
                            </p>
                        </div>

                        <div className="mt-6 space-y-3">
                            {visiblePackages.map((pkg, index) => {
                                const isSelected = pkg.id === selectedPackageId;
                                const price = formatPrice(pkg.price, pkg.currency);
                                const tag = packageTagline(pkg, index);
                                const daily = estimateDailyPrice(pkg);
                                const creditsLabel = estimateCreditsLabel(pkg);

                                return (
                                    <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => setSelectedPackageId(pkg.id)}
                                        className="w-full rounded-[20px] border px-4 py-4 text-left transition-all duration-200"
                                        style={{
                                            borderColor: isSelected ? "rgba(255,255,255,0.88)" : SURFACE_BORDER,
                                            background: isSelected ? SURFACE_PANEL : "transparent",
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span
                                                className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                                                style={{
                                                    borderColor: isSelected ? "#ffffff" : "rgba(255,255,255,0.16)",
                                                    background: isSelected ? "#ffffff" : "transparent",
                                                }}
                                            >
                                                {isSelected && <Check size={12} color="#101010" />}
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-[17px] font-semibold leading-none tracking-[-0.03em]" style={{ color: TEXT_PRIMARY }}>
                                                                {pkg.label}
                                                            </p>
                                                            {tag === "Most popular" && (
                                                                <span className="rounded-lg bg-[#173d70] px-2 py-1 text-[11px] font-semibold leading-none text-[#b6d5ff]">
                                                                    Economisez
                                                                </span>
                                                            )}
                                                        </div>

                                                        {price && (
                                                            <p className="mt-1.5 text-[15px] font-normal leading-none" style={{ color: TEXT_SECONDARY }}>
                                                                {price}
                                                                {getPlanSuffix(pkg)}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="flex items-center justify-end gap-1 text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>
                                                            <Sparkles size={13} />
                                                            {creditsLabel}
                                                        </p>
                                                        {daily && (
                                                            <p className="mt-1.5 text-[16px] font-semibold leading-none" style={{ color: TEXT_PRIMARY }}>
                                                                {daily}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {tag === "Most popular" && (
                                                    <div className="mt-3 flex w-full items-start gap-1 rounded-md bg-[#bcff1f] px-2.5 py-2 text-[12px] font-medium leading-4 text-black shadow-[0_0_4px_0_#d2ff1f]">
                                                        <Sparkles size={14} className="mt-0.5 shrink-0" />
                                                        <span>
                                                            Le plus populaire - Profitez du meilleur rapport qualité-prix avant qu’il ne disparaisse
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
                            <p className="mt-5 text-center text-[13px] font-medium leading-6 lg:text-left" style={{ color: TEXT_MUTED }}>
                                Avec le forfait sélectionné,{" "}
                                <span style={{ color: TEXT_PRIMARY }}>
                                    nous vous facturerons {formatPrice(selectedPackage.price, selectedPackage.currency)} chaque cycle
                                </span>{" "}
                                jusqu’à résiliation
                            </p>
                        )}

                        {selectedPackage && (
                            <div className="mt-6 border-t border-white/10 pt-4">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-[17px] font-semibold tracking-[-0.03em]" style={{ color: TEXT_FAINT }}>
                                        Total Cost
                                    </p>
                                    <p className="text-[18px] font-semibold tracking-[-0.03em]" style={{ color: TEXT_PRIMARY }}>
                                        {formatPrice(selectedPackage.price, selectedPackage.currency)}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 space-y-3">
                            <Button
                                type="button"
                                disabled={!selectedPackage || (isPending && pendingPackageId === selectedPackage.id)}
                                className="h-12 w-full rounded-[18px] bg-white text-[16px] font-medium text-[#111] hover:bg-white/92"
                            >
                                Buy with G Pay
                            </Button>

                            <Button
                                type="button"
                                disabled={!selectedPackage || (isPending && pendingPackageId === selectedPackage.id)}
                                className="h-12 w-full rounded-[18px] bg-white text-[16px] font-medium text-[#111] hover:bg-white/92"
                            >
                                Credit or Debit Card
                            </Button>

                            <Button
                                type="button"
                                disabled={!selectedPackage || (isPending && pendingPackageId === selectedPackage.id)}
                                onClick={() => {
                                    if (selectedPackage) {
                                        onBuy?.(selectedPackage.id);
                                    }
                                }}
                                className="h-12 w-full rounded-[18px] text-[16px] font-medium text-white transition-colors"
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
                                    "Continue with Stripe"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
