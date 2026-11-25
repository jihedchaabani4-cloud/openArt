"use client";

import { HugeIcon } from "@/components/primitives/HugeIcon";
import { Button } from "@/components/base/button";

/**
 * ElementsEmptyState
 *
 * Harmonized, vertically-centered, borderless empty state for Cinema Studio Elements.
 * Built with balanced, proportional typographic and iconographic hierarchy:
 * - Hero icon: 24px HugeIcon in 48px (size-12) circle (1:2 optical ratio)
 * - Hero Title: canonical `.ds-type-feature-title` text-white
 * - Hero Subtitle: canonical `.ds-type-small` text-white/50
 * - Card icon: 17px HugeIcon in 30px (size-[30px]) badge (balanced padding)
 * - Card title: canonical `.ds-type-caption-label` text-white/90
 * - Card visual: 135px WebP illustration centered
 * - CTA Button: canonical `<Button variant="pill">` with 17px icon
 *
 * @param {Object} props
 * @param {() => void} [props.onCreateElement] Callback to trigger creating a new element
 * @param {string} [props.className] Optional wrapper className override
 */
export function ElementsEmptyState({ onCreateElement, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-6 py-6 px-4 mx-auto w-full max-w-[620px] select-none font-sans antialiased text-white my-auto ${className}`}
    >
      {/* ── Top Header Section (Icon Badge + Titles) ── */}
      <div className="flex flex-col items-center gap-3 text-center max-w-sm">
        {/* Proportional 48px circle with 24px icon (1:2 balanced ratio) */}
        <span className="size-12 flex items-center justify-center rounded-full bg-white/[0.06] border border-white/10 shrink-0">
          <HugeIcon
            name="at"
            size="xl"
            className="text-white"
          />
        </span>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-center ds-type-feature-title text-white">
            No elements yet
          </p>
          <p className="text-center ds-type-small text-white/50 max-w-xs">
            Create element to use it consistently across all projects
          </p>
        </div>
      </div>

      {/* ── 3 Visual Showcase Cards (Harmonious 3-Column Grid) ── */}
      <div className="grid grid-cols-3 gap-2.5 w-full border-none">
        {/* Card 1: Create element (Interactive Onboarding) */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Create element"
          data-testid="create-element-card"
          onClick={onCreateElement}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCreateElement?.();
            }
          }}
          className="group relative p-3.5 flex flex-col gap-2.5 overflow-hidden bg-white/[0.04] hover:bg-white/[0.07] transition-all duration-200 cursor-pointer h-[220px] rounded-comfortable border border-white/10 shadow-none"
        >
          <div className="flex shrink-0 items-center gap-2.5 min-w-0">
            <span className="size-[30px] flex shrink-0 items-center justify-center rounded-full bg-white/[0.08] border-none">
              <HugeIcon
                name="at"
                size="md"
                className="text-white"
              />
            </span>
            <p className="min-w-0 ds-type-caption-label text-white/90 group-hover:text-white truncate transition-colors">
              Create element
            </p>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none flex min-h-0 flex-1 select-none items-center justify-center overflow-hidden"
          >
            <img
              alt="Create element"
              width={140}
              height={140}
              loading="lazy"
              decoding="async"
              className="object-contain max-w-full size-[135px] transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
              src="/images/reference-elements/empty-1.webp"
            />
          </div>
        </div>

        {/* Card 2: Add to prompt-box */}
        <div className="p-3.5 flex flex-col gap-2.5 overflow-hidden bg-white/[0.04] h-[220px] rounded-comfortable border border-white/10 shadow-none">
          <div className="flex shrink-0 items-center gap-2.5 min-w-0">
            <span className="size-[30px] flex shrink-0 items-center justify-center rounded-full bg-white/[0.08] border-none">
              <HugeIcon
                name="sparkles"
                size="md"
                className="text-white"
              />
            </span>
            <p className="min-w-0 ds-type-caption-label text-white/90 truncate">
              Add to prompt-box
            </p>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none flex min-h-0 flex-1 select-none items-center justify-center overflow-hidden"
          >
            <img
              alt="Add to prompt-box"
              width={140}
              height={140}
              loading="lazy"
              decoding="async"
              className="object-contain max-w-full size-[135px] drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
              src="/images/reference-elements/empty-2.webp"
            />
          </div>
        </div>

        {/* Card 3: Use for consistency */}
        <div className="p-3.5 flex flex-col gap-2.5 overflow-hidden bg-white/[0.04] h-[220px] rounded-comfortable border border-white/10 shadow-none">
          <div className="flex shrink-0 items-center gap-2.5 min-w-0">
            <span className="size-[30px] flex shrink-0 items-center justify-center rounded-full bg-white/[0.08] border-none">
              <HugeIcon
                name="package"
                size="md"
                className="text-white"
              />
            </span>
            <p className="min-w-0 ds-type-caption-label text-white/90 truncate">
              Use for consistency
            </p>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none flex min-h-0 flex-1 select-none items-center justify-center overflow-hidden"
          >
            <img
              alt="Use for consistency"
              width={140}
              height={140}
              loading="lazy"
              decoding="async"
              className="object-contain max-w-full size-[135px] drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
              src="/images/reference-elements/empty-3.webp"
            />
          </div>
        </div>
      </div>

      {/* ── Proportional Direct Call to Action Button ── */}
      <Button
        type="button"
        variant="pill"
        onClick={onCreateElement}
      >
        <HugeIcon
          name="add-01"
          size="md"
        />
        <span>Create element</span>
      </Button>
    </div>
  );
}
