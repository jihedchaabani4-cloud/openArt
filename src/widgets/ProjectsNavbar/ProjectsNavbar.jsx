"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { Button } from "@/shared/ui/button"
import { LoginDialog } from "@/components/LoginDialog"
import { useAuthSession } from "@/shared/api/auth"
import { UserDropdown } from "@/widgets/StudioNavbar/ui/UserDropdown"
import { usePackages, useCheckout } from "@/features/payments/api/paymentsApi"
import { PackageSelectionDialog } from "@/features/payments/ui/PackageSelectionDialog"

export function ProjectsNavbar() {
    const { scrollY } = useScroll()
    const [hidden, setHidden] = useState(false)
    const [loginOpen, setLoginOpen] = useState(false)
    const [pricingDialogOpen, setPricingDialogOpen] = useState(false)
    const { data: currentUser } = useAuthSession()
    const { data: pricingData, isLoading: pricingLoading, isError: pricingError } = usePackages()
    const { mutate: checkout, isPending, variables: pendingPackageId } = useCheckout()

    const pathname = usePathname()
    const isListing = pathname === "/" || pathname === "/cinema-studio" || pathname === "/cinema-studio/new"
        || pathname === "/pricing" || pathname === "/assets" || pathname.startsWith("/explore")

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious()
        if (latest > previous && latest > 150) {
            setHidden(true)
        } else {
            setHidden(false)
        }
    })

    // If not a listing page, don't render the global navbar (e.g. in Studio)
    if (!isListing) return null;

    const packages = pricingData?.packages ?? []
    const modelsComparison = pricingData?.modelsComparison ?? { image: [], video: [] }
    const nonTrialPackages = packages.filter((pkg) => !pkg.is_trial)

    return (
        <>
            <motion.nav
                variants={{
                    visible: { y: 0 },
                    hidden: { y: "-100%" },
                }}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-0 left-0 w-full z-[100] flex items-center justify-between  px-8 h-[75px]"
            >
                {/* ── Left: Branding & Links ── */}
                <div className="flex items-center gap-8">
                    <Link
                        href="/cinema-studio"
                        className="flex items-center gap-3 group transition-opacity hover:opacity-100"
                    >
                        <span className="text-[14px] font-bold tracking-[-0.03em] leading-tight text-white uppercase italic">
                            Open Art
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/explore" className="text-[14px] font-semibold text-white/90 hover:text-white transition-colors">
                            Explore
                        </Link>
                        <Link href="/cinema-studio" className="text-[14px] font-semibold text-white/90 hover:text-white transition-colors">
                            Cinema Studio
                        </Link>
                    </div>
                </div>

                {/* ── Right: Navigation & Actions ── */}
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-1 mr-2 pr-4 border-r border-white/10">
                        <button
                            type="button"
                            onClick={() => setPricingDialogOpen(true)}
                            className="text-[14px] font-semibold text-white/90 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
                        >
                            Pricing
                        </button>
                        <Link href="/assets" className="text-[14px] font-semibold text-white/90 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5">
                            Assets
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        {currentUser ? (
                            <UserDropdown />
                        ) : (
                            <Button
                                onClick={() => setLoginOpen(true)}
                                variant="studio-ghost"
                                size="sm"
                                className="text-white gap-2 font-semibold text-[14px]"
                            >
                                Login
                            </Button>
                        )}
                    </div>
                </div>
            </motion.nav>

            {/* Login Dialog overlay */}
            <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />

            {!pricingLoading && !pricingError && nonTrialPackages.length >= 3 && (
                <PackageSelectionDialog
                    open={pricingDialogOpen}
                    onOpenChange={setPricingDialogOpen}
                    packages={nonTrialPackages}
                    modelsComparison={modelsComparison}
                    onBuy={(id) => checkout(id)}
                    isPending={isPending}
                    pendingPackageId={pendingPackageId}
                    showViewAllLink
                />
            )}
        </>
    )
}
