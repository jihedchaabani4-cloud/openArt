"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { UserDropdown } from "@/widgets/navigation/UserDropdown";

export function AssetsNavbar({ hidden = false }) {
  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-[100] flex h-[75px] w-full items-center justify-between"
    >
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-white/72 transition hover:bg-white/5 hover:text-white"
            aria-label="Back to home"
          >
            <GoogleIcon iconName="arrow_back" className="text-2xl" />
          </Link>

          <Link
            href="/assets"
            className="flex items-center gap-3 transition-opacity hover:opacity-100"
          >
            <span className="whitespace-nowrap text-3xl font-semibold tracking-tight">Your Library</span>
          </Link>
        </div>

        <div className="shrink-0">
          <UserDropdown />
        </div>
      </div>
    </motion.nav>
  );
}
