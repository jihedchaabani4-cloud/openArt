"use client";

import { usePackages, useCheckout } from "@/features/payments/api/paymentsApi";
import { Zap, Star, Sparkles, Check, Loader2 } from "lucide-react";

// ─── Icons per pack ───────────────────────────────────────────────────────────
const PACK_ICONS = {
    pack_100: Zap,
    pack_500: Star,
    pack_1000: Sparkles,
};

// ─── Gradient per pack ────────────────────────────────────────────────────────
const PACK_GRADIENTS = {
    pack_100: "from-blue-500/20 to-cyan-500/10",
    pack_500: "from-violet-500/20 to-purple-500/10",
    pack_1000: "from-amber-500/20 to-orange-500/10",
};

const PACK_GLOW = {
    pack_100: "rgba(59,130,246,0.15)",
    pack_500: "rgba(139,92,246,0.2)",
    pack_1000: "rgba(245,158,11,0.15)",
};

const PACK_BORDER = {
    pack_100: "rgba(59,130,246,0.2)",
    pack_500: "rgba(139,92,246,0.35)",
    pack_1000: "rgba(245,158,11,0.2)",
};

const PACK_ICON_COLOR = {
    pack_100: "#60a5fa",
    pack_500: "#a78bfa",
    pack_1000: "#fbbf24",
};

const PACK_BUTTON_STYLE = {
    pack_100: "bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-300",
    pack_500: "bg-violet-500 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/30",
    pack_1000: "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-300",
};

// ─── Features per pack ────────────────────────────────────────────────────────
const PACK_FEATURES = {
    pack_100: ["100 AI Generations", "All models access", "No expiry date"],
    pack_500: ["500 AI Generations", "All models access", "Priority queue", "No expiry date"],
    pack_1000: ["1000 AI Generations", "All models access", "Priority queue", "No expiry date", "Batch generation"],
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-7 flex flex-col gap-5 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06]" />
            <div className="space-y-2">
                <div className="h-5 w-28 rounded bg-white/[0.06]" />
                <div className="h-3 w-40 rounded bg-white/[0.04]" />
            </div>
            <div className="h-10 w-36 rounded bg-white/[0.06]" />
            <div className="space-y-2 pt-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-3 w-full rounded bg-white/[0.04]" />
                ))}
            </div>
            <div className="h-11 rounded-xl bg-white/[0.06] mt-auto" />
        </div>
    );
}

// ─── Pack Card ────────────────────────────────────────────────────────────────
function PackCard({ pkg, onBuy, isLoading }) {
    const Icon = PACK_ICONS[pkg.id] ?? Zap;
    const gradient = PACK_GRADIENTS[pkg.id] ?? "from-white/10 to-white/5";
    const glow = PACK_GLOW[pkg.id];
    const border = PACK_BORDER[pkg.id] ?? "rgba(255,255,255,0.08)";
    const iconColor = PACK_ICON_COLOR[pkg.id] ?? "#fff";
    const btnStyle = PACK_BUTTON_STYLE[pkg.id] ?? "bg-white/10 hover:bg-white/20 text-white border border-white/10";
    const features = PACK_FEATURES[pkg.id] ?? [];
    const pricePerCredit = (pkg.price / pkg.credits).toFixed(3);

    return (
        <div
            className={`relative rounded-2xl p-7 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]`}
            style={{
                background: `radial-gradient(ellipse at top left, ${glow}, transparent 70%), rgba(255,255,255,0.02)`,
                border: `1px solid ${pkg.popular ? border : "rgba(255,255,255,0.06)"}`,
                boxShadow: pkg.popular ? `0 0 40px ${glow}` : "none",
            }}
        >
            {/* Popular badge */}
            {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-violet-500 text-white text-xs font-semibold tracking-wide shadow-lg shadow-violet-500/40">
                    Most Popular
                </div>
            )}

            {/* Icon */}
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: `${glow}`, border: `1px solid ${border}` }}
            >
                <Icon size={20} color={iconColor} strokeWidth={2} />
            </div>

            {/* Label + description */}
            <div>
                <h3 className="text-white font-semibold text-lg leading-tight">{pkg.label}</h3>
                {pkg.description && (
                    <p className="text-white/40 text-sm mt-1 leading-snug">{pkg.description}</p>
                )}
            </div>

            {/* Price */}
            <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-white tracking-tight">
                    ${pkg.price}
                </span>
                <div className="mb-1 text-white/30 text-sm leading-tight">
                    <div>{pkg.credits} credits</div>
                    <div>${pricePerCredit}/credit</div>
                </div>
            </div>

            {/* Features */}
            <ul className="flex flex-col gap-2">
                {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-white/60 text-sm">
                        <Check size={14} className="text-white/30 shrink-0" />
                        {f}
                    </li>
                ))}
            </ul>

            {/* CTA Button */}
            <button
                id={`buy-${pkg.id}`}
                onClick={() => onBuy(pkg.id)}
                disabled={isLoading}
                className={`mt-auto w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${btnStyle}`}
            >
                {isLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                ) : (
                    <>
                        <Zap size={14} />
                        Get {pkg.credits} credits
                    </>
                )}
            </button>
        </div>
    );
}

// ─── Trial Pack Card ──────────────────────────────────────────────────────────
function TrialPackCard({ pkg, onBuy, isLoading }) {
    const features = pkg.features || [
        "400 monthly credits",
        "~ 400 image generations",
        "~ 40-80 video generations",
        "~ 80 audio generations",
        "Basic plan benefits",
        "Workflows"
    ];
    
    return (
        <div className="col-span-1 md:col-span-3 bg-[#0d0d0d] rounded-3xl border border-white/[0.05] overflow-hidden flex flex-col md:flex-row">
            {/* Left Section */}
            <div className="flex-1 p-8 md:p-12 flex flex-col gap-8">
                <div>
                    <h3 className="text-white font-bold text-2xl mb-1">{pkg.label || "Education"}</h3>
                    <p className="text-white/40 text-lg">{pkg.description || "For students and teachers"}</p>
                </div>

                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-white">${pkg.price || 4}</span>
                        <span className="text-white/30 text-xl">/ month</span>
                    </div>
                    {pkg.yearly_price && (
                        <p className="text-white/30 mt-2">billed as ${pkg.yearly_price} per year</p>
                    )}
                </div>

                <button
                    onClick={() => onBuy(pkg.id)}
                    disabled={isLoading}
                    className="mt-4 w-full max-w-xs py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white/40 font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Upgrade"}
                </button>
            </div>

            {/* Right Section (Grid) */}
            <div className="flex-[1.5] p-8 md:p-12 bg-dashed-grid relative min-h-[300px]">
                <ul className="flex flex-col gap-5 relative z-10">
                    {features.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-4 text-white text-lg font-medium">
                            {f.startsWith("~") ? (
                                <span className="text-white/40 text-2xl leading-none">~</span>
                            ) : (
                                <Check size={20} className="text-white shrink-0" />
                            )}
                            {f.startsWith("~") ? f.substring(1).trim() : f}
                        </li>
                    ))}
                </ul>

                {/* Hand-written text */}
                <div className="absolute right-12 bottom-20 md:right-24 md:bottom-32 rotate-[-5deg] pointer-events-none">
                    <p className="font-handwriting text-[#d4af37] text-2xl md:text-3xl leading-tight text-center">
                        Requires a valid<br />
                        school email<br />
                        address
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function PricingSection() {
    const { data: packages = [], isLoading, isError } = usePackages();
    const { mutate: checkout, isPending, variables: pendingPackageId } = useCheckout();

    return (
        <section className="w-full max-w-5xl mx-auto px-6 py-20 flex flex-col items-center gap-16">

            {/* Header */}
            <div className="text-center flex flex-col items-center gap-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-white/50 text-xs font-medium tracking-wide">
                    <Zap size={12} />
                    Credits never expire
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
                    Power your creativity
                </h1>
                <p className="text-white/40 text-lg max-w-md leading-relaxed">
                    Buy once, use anytime. Generate images, videos, and more with AI.
                </p>
            </div>

            {/* Cards Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                {isLoading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                {isError && (
                    <div className="col-span-3 text-center text-white/30 text-sm py-12">
                        Could not load packages. Please try again later.
                    </div>
                )}
                {!isLoading && packages.map((pkg) => (
                    pkg.is_trial ? (
                        <TrialPackCard
                            key={pkg.id}
                            pkg={pkg}
                            onBuy={(id) => checkout(id)}
                            isLoading={isPending && pendingPackageId === pkg.id}
                        />
                    ) : (
                        <PackCard
                            key={pkg.id}
                            pkg={pkg}
                            onBuy={(id) => checkout(id)}
                            isLoading={isPending && pendingPackageId === pkg.id}
                        />
                    )
                ))}
            </div>

            {/* Footer note */}
            <p className="text-white/20 text-xs text-center">
                Secure payments powered by Lemon Squeezy · Credits are added instantly after payment
            </p>
        </section>
    );
}
