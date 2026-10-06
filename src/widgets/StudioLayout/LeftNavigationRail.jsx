"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useCharacterWorkflows } from "@/features/characters";
import { useElementSheetWorkflows } from "@/features/elements";

/**
 * LeftNavigationRail
 * Clean studio sidebar featuring:
 * - Top items: Générations (Generation Space), Éléments, Personnages
 * - Bottom: Prominent toggle button (PanelLeftClose / PanelLeftOpen) to open & close
 * - Borderless, clean animations, no hover-open
 */
export function LeftNavigationRail() {
  const selectedProjectId = useGenerationsStore((s) => s.selectedProjectId);
  const isNavbarHidden = useGenerationsStore((s) => s.isNavbarHidden);
  const pathname = usePathname();

  const { workflows: characters = [] } = useCharacterWorkflows(selectedProjectId);
  const { workflows: elements = [] } = useElementSheetWorkflows(selectedProjectId);

  // Expands / collapses only via explicit button click (Réduire / Développer)
  const [isExpanded, setIsExpanded] = useState(true);
  const [optimisticTab, setOptimisticTab] = useState(null);

  React.useEffect(() => {
    setOptimisticTab(null);
  }, [pathname]);

  const isCharactersActive = pathname?.includes("/characters");
  const isElementsActive = pathname?.includes("/elements");
  const currentActiveTab = optimisticTab || (isCharactersActive ? "characters" : isElementsActive ? "elements" : "generations");

  const handleToggleExpand = (e) => {
    e?.stopPropagation();
    setIsExpanded((prev) => !prev);
  };

  if (!selectedProjectId) return null;

  const elementsHref = `/cinema-studio/${selectedProjectId}/elements`;

  const charactersHref = characters.length > 0
    ? `/cinema-studio/${selectedProjectId}/characters`
    : `/cinema-studio/${selectedProjectId}/characters/new`;

  const navItems = [
    {
      id: "generations",
      label: "Générations",
      icon: "image",
      href: `/cinema-studio/${selectedProjectId}/generations`,
      isActive: currentActiveTab === "generations",
    },
    {
      id: "elements",
      label: "Éléments",
      icon: "alternate_email",
      href: elementsHref,
      isActive: currentActiveTab === "elements",
    },
    {
      id: "characters",
      label: "Personnages",
      icon: "accessibility_new",
      href: charactersHref,
      isActive: currentActiveTab === "characters",
    },
  ];

  return (
    <aside
      aria-label="Navigation Studio"
      style={{
        width: isExpanded ? 230 : 64,
      }}
      className="h-full shrink-0 relative z-40 bg-black flex flex-col select-none py-3 px-2 overflow-hidden border-none"
    >
      {/* ── Top Spacer (animates cleanly with StudioNavbar hide/show) ── */}
      <motion.div
        initial={false}
        animate={{ height: isNavbarHidden ? 0 : 64 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        className="w-full shrink-0 overflow-hidden"
      />

      {/* ── Top Navigation Items: Générations, Éléments, Personnages ── */}
      <nav className="flex flex-col gap-1.5 w-full shrink-0">
        {navItems.map((item) => {
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              onClick={() => setOptimisticTab(item.id)}
              className={cn(
                "flex items-center h-[42px] rounded-[14px] transition-colors duration-100 w-full select-none outline-none overflow-hidden font-sans font-medium text-[14px] leading-5 antialiased",
                item.isActive
                  ? "bg-[#2a2a2a] text-white shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/[0.06]"
              )}
              title={!isExpanded ? item.label : undefined}
            >
              <span className="w-[48px] h-full shrink-0 flex items-center justify-center">
                <GoogleIcon
                  iconName={item.icon}
                  className={cn(
                    "text-[20px] shrink-0",
                    item.isActive ? "text-white" : "text-white/80"
                  )}
                />
              </span>
              <span
                className={cn(
                  "tracking-normal truncate flex-1 pr-2 whitespace-nowrap",
                  isExpanded ? "block" : "hidden"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Flexible Space (pushes toggle button to bottom) ── */}
      <div className="flex-1 min-h-[20px]" />

      {/* ── Dedicated Bottom Toggle Button: Opens & Closes the Sidebar ── */}
      <div className="mt-auto pt-2 pb-2 mb-[30px] w-full shrink-0">
        <button
          type="button"
          onClick={handleToggleExpand}
          className={cn(
            "flex items-center h-[42px] rounded-[14px] transition-colors duration-100 w-full select-none outline-none overflow-hidden cursor-pointer font-sans font-medium text-[14px] leading-5 antialiased",
            "text-white/80 hover:text-white hover:bg-white/[0.06]"
          )}
          title={isExpanded ? "Réduire la barre" : "Développer la barre"}
          aria-label={isExpanded ? "Réduire la barre" : "Développer la barre"}
        >
          <span className="w-[48px] h-full shrink-0 flex items-center justify-center">
            {isExpanded ? (
              <PanelLeftClose className="w-5 h-5 text-white/80 shrink-0" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 text-white/80 shrink-0" />
            )}
          </span>
          <span
            className={cn(
              "tracking-normal truncate flex-1 text-left pr-2 whitespace-nowrap",
              isExpanded ? "block" : "hidden"
            )}
          >
            Réduire
          </span>
        </button>
      </div>
    </aside>
  );
}
