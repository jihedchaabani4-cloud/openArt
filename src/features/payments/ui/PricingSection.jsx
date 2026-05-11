"use client";

import { usePackages, useCheckout } from "@/features/payments/api/paymentsApi";
import { Check, Loader2, Zap } from "lucide-react";

const PACK_FEATURES = {
    pack_100: ["100 AI generations", "Access to all models", "Credits never expire"],
    pack_500: ["500 AI generations", "Access to all models", "Priority queue", "Credits never expire"],
    pack_1000: ["1000 AI generations", "Access to all models", "Priority queue", "Batch generation", "Credits never expire"],
};

function formatPrice(value) {
    if (value == null) {
        return "$0";
    }

    return `$${value}`;
}

function getPlanFeatures(pkg) {
    if (Array.isArray(pkg.features) && pkg.features.length > 0) {
        return pkg.features.map((feature) => feature.replace(/^~\s*/, ""));
    }

    return PACK_FEATURES[pkg.id] ?? [];
}

function PricingCard({ pkg, onBuy, isLoading }) {
    const features = getPlanFeatures(pkg);
    const isPopular = Boolean(pkg.popular);
    const buttonClass = isPopular
        ? "bg-[#1f6fff] text-white hover:bg-[#3a82ff]"
        : "bg-white/[0.08] text-white hover:bg-white/[0.12]";

    return (
        <article
            className="flex h-full flex-col rounded-[28px] border border-white/[0.08] bg-[#1b1b1c] p-6 text-white transition-colors duration-200"
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-white">{pkg.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/42">
                        {pkg.description || "Flexible credits for everyday creative work."}
                    </p>
                </div>
                {isPopular && (
                    <span className="rounded-full bg-[#1f6fff]/16 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8ab0ff]">
                        Popular
                    </span>
                )}
            </div>

            <div className="mt-8">
                <div className="flex items-end gap-2">
                    <span className="text-[46px] font-bold leading-none tracking-[-0.05em] text-white">
                        {formatPrice(pkg.price)}
                    </span>
                    <span className="pb-1 text-lg text-white/46">/ month</span>
                </div>
                <p className="mt-2 text-sm text-white/42">
                    {pkg.yearly_price ? `billed as $${pkg.yearly_price} per year` : `${pkg.credits} credits included`}
                </p>
            </div>

            <div className="mt-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/38">
                    Credits per month
                </div>
                <div className="mt-2 rounded-xl bg-black/24 px-4 py-3 text-center text-lg font-semibold text-white">
                    {pkg.credits}
                </div>
            </div>

            <button
                id={`buy-${pkg.id}`}
                onClick={() => onBuy(pkg.id)}
                disabled={isLoading}
                className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${buttonClass}`}
            >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Upgrade"}
            </button>

            <div className="my-6 h-px bg-white/[0.08]" />

            <ul className="space-y-3">
                {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-white/78">
                        <Check size={16} className="mt-1 shrink-0 text-white" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
        </article>
    );
}

function EducationCard({ pkg, onBuy, isLoading }) {
    const features = getPlanFeatures(pkg);

    return (
        <article className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#1b1b1c] text-white md:col-span-3">
            <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div className="flex h-full flex-col p-6 lg:border-r lg:border-white/[0.08]">
                    <div>
                        <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-white">
                            {pkg.label || "Education"}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-white/42">
                            {pkg.description || "For students and teachers"}
                        </p>
                    </div>

                    <div className="mt-8">
                        <div className="flex items-end gap-2">
                            <span className="text-[46px] font-bold leading-none tracking-[-0.05em] text-white">
                                {formatPrice(pkg.price || 4)}
                            </span>
                            <span className="pb-1 text-lg text-white/46">/ month</span>
                        </div>
                        <p className="mt-2 text-sm text-white/42">
                            billed as ${pkg.yearly_price || 48} per year
                        </p>
                    </div>

                    <button
                        onClick={() => onBuy(pkg.id)}
                        disabled={isLoading}
                        className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-white/[0.08] text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Upgrade"}
                    </button>
                </div>

                <div className="flex h-full flex-col justify-between p-6">
                    <div className="grid gap-0 md:grid-cols-2">
                        {features.map((feature, index) => (
                            <div
                                key={feature}
                                className={`flex items-center gap-3 border-white/[0.06] py-3 text-sm text-white/82 ${
                                    index < features.length - 1 ? "border-b" : ""
                                } ${index % 2 === 0 ? "md:pr-6" : "md:pl-6"} ${index < features.length - 2 ? "md:border-b" : ""}`}
                            >
                                <Check size={16} className="shrink-0 text-white" />
                                <span>{feature.replace(/^~\s*/, "")}</span>
                            </div>
                        ))}
                    </div>

                    <p className="mt-6 text-sm font-medium text-[#b79a49]">
                        Requires a valid school email address.
                    </p>
                </div>
            </div>
        </article>
    );
}

function SkeletonCard() {
    return (
        <div className="rounded-[28px] border border-white/[0.08] bg-[#1b1b1c] p-6 animate-pulse">
            <div className="h-8 w-28 rounded bg-white/[0.07]" />
            <div className="mt-3 h-4 w-40 rounded bg-white/[0.05]" />
            <div className="mt-8 h-12 w-28 rounded bg-white/[0.07]" />
            <div className="mt-6 h-12 rounded-xl bg-white/[0.07]" />
            <div className="mt-6 space-y-3">
                {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-4 rounded bg-white/[0.05]" />
                ))}
            </div>
        </div>
    );
}

export function PricingSection() {
    const { data: packages = [], isLoading, isError } = usePackages();
    const { mutate: checkout, isPending, variables: pendingPackageId } = useCheckout();
    const standardPackages = packages.filter((pkg) => !pkg.is_trial);
    const trialPackage = packages.find((pkg) => pkg.is_trial);

    return (
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-20">
            <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-white/48">
                    <Zap size={12} />
                    Flexible pricing
                </div>
                <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                    Simple plans, designed to feel premium.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-white/42">
                    Clear pricing, clean structure, and the right amount of detail to help users choose fast.
                </p>
            </div>

            <div className="space-y-7">
                <div>
                    <p className="mb-4 text-sm font-semibold text-white/40">Best for individuals</p>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {isLoading && [1, 2, 3].map((item) => <SkeletonCard key={item} />)}
                        {!isLoading && !isError && standardPackages.map((pkg) => (
                            <PricingCard
                                key={pkg.id}
                                pkg={pkg}
                                onBuy={(id) => checkout(id)}
                                isLoading={isPending && pendingPackageId === pkg.id}
                            />
                        ))}
                    </div>
                </div>

                {isError && (
                    <div className="rounded-[28px] border border-white/[0.08] bg-[#1b1b1c] px-6 py-12 text-center text-sm text-white/42 md:col-span-3">
                        Could not load packages. Please try again later.
                    </div>
                )}

                {!isLoading && !isError && trialPackage && (
                    <div>
                        <p className="mb-4 text-sm font-semibold text-white/40">Best for teams</p>
                        <EducationCard
                            pkg={trialPackage}
                            onBuy={(id) => checkout(id)}
                            isLoading={isPending && pendingPackageId === trialPackage.id}
                        />
                    </div>
                )}
            </div>

            <p className="text-center text-xs text-white/24">
                Secure payments powered by Lemon Squeezy. Credits are added instantly after payment.
            </p>
        </section>
    );
}
