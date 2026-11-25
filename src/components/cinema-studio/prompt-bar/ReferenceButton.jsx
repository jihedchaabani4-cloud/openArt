"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { resolveMediaUrl } from "@/features/prompt-bar";

const VARIANTS = {
  start:  { word: "Start",  HoverContent: () => <HugeIcon name="add-01" size="md" className="text-text-secondary" /> },
  end:    { word: "End",    HoverContent: () => <HugeIcon name="add-01" size="md" className="text-text-secondary" /> },
  motion: { word: "Motion", HoverContent: () => <HugeIcon name="play" size="md" className="text-text-secondary" /> },
  ref:    { word: "Ref",    HoverContent: () => <HugeIcon name="add-01" size="md" className="text-text-secondary" /> },
  add:    { word: "Add",    HoverContent: () => <HugeIcon name="add-01" size="md" className="text-text-secondary" /> },
};

export function ReferenceButton({
  variant,
  word,
  hoverContent,
  onClick,
  disabled = false,
  pulse = false,
  className,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  ...props
}) {
  const preset = variant ? VARIANTS[variant] : (word ? VARIANTS[word.toLowerCase()] : null);
  const displayWord = word ?? preset?.word ?? null;
  const HoverContent = hoverContent !== undefined ? hoverContent : (preset?.HoverContent ?? null);

  return (
    <div
      data-pill-focus="true"
      tabIndex={!disabled ? 0 : undefined}
      onClick={!disabled ? onClick : undefined}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "group relative shrink-0",
        "w-[50px] h-[50px] rounded-subtle",
        "flex items-center justify-center",
        "bg-white-5 border border-border-subtle",
        "transition-all duration-200 ease-out",
        "hover:bg-ui-button-hover hover:border-border-heavy",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-heavy",
        "active:scale-95",
        pulse && "animate-pulse-border",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className
      )}
      {...props}
    >
      {displayWord && (
        <span
          className={cn(
            "pointer-events-none select-none",
            "ds-type-small text-text-secondary",
            "whitespace-nowrap",
            "transition-all duration-200 ease-out",
            HoverContent
              ? "absolute group-hover:-translate-y-2 group-hover:opacity-0"
              : "group-hover:text-text-primary"
          )}
        >
          {displayWord}
        </span>
      )}

      {HoverContent && (
        <div
          className={cn(
            "absolute pointer-events-none",
            "flex items-center justify-center",
            "translate-y-2 opacity-0",
            "transition-all duration-200 ease-out",
            "group-hover:translate-y-0 group-hover:opacity-100"
          )}
        >
          <HoverContent />
        </div>
      )}
    </div>
  );
}


export function SwapIcon({ className }) {
  return (
    <div className={cn("flex items-center justify-center shrink-0", className)}>
      <HugeIcon name="arrow-left-right" size="md" />
    </div>
  );
}


const REMOVE_ICON_PATH =
  "M7.29268 7.30529C7.47998 7.11782 7.73398 7.0125 7.99882 7.0125C8.26367 7.0125 8.51767 7.11782 8.70497 7.30529L11.994 10.5983L15.283 7.30529C15.3752 7.20978 15.4854 7.1336 15.6072 7.08119C15.7291 7.02878 15.8602 7.00119 15.9928 7.00004C16.1254 6.99888 16.2569 7.02419 16.3797 7.07447C16.5024 7.12475 16.6139 7.199 16.7077 7.29289C16.8015 7.38679 16.8756 7.49844 16.9259 7.62133C16.9761 7.74423 17.0014 7.87591 17.0002 8.00869C16.9991 8.14147 16.9715 8.27269 16.9192 8.39469C16.8668 8.5167 16.7907 8.62704 16.6953 8.71929L13.4063 12.0123L16.6953 15.3053C16.8773 15.4939 16.9779 15.7465 16.9757 16.0087C16.9734 16.2709 16.8683 16.5217 16.6832 16.7071C16.498 16.8925 16.2475 16.9977 15.9856 17C15.7237 17.0022 15.4714 16.9014 15.283 16.7193L11.994 13.4263L8.70497 16.7193C8.5166 16.9014 8.2643 17.0022 8.00242 17C7.74054 16.9977 7.49003 16.8925 7.30484 16.7071C7.11966 16.5217 7.01462 16.2709 7.01234 16.0087C7.01007 15.7465 7.11074 15.4939 7.29268 15.3053L10.5817 12.0123L7.29268 8.71929C7.10543 8.53176 7.00024 8.27745 7.00024 8.01229C7.00024 7.74712 7.10543 7.49282 7.29268 7.30529Z";

export function ViewReference({
  media,
  onClick,
  onRemove,
  label,
  className,
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (!media) return null;

  const isCharacter =
    media.type === "character" ||
    media.is_character ||
    Boolean(media.characterId) ||
    media.entity_type === "character" ||
    String(media.workflow_type || "").toUpperCase().includes("CHARACTER");

  const isElement =
    media.type === "element" ||
    media.is_element ||
    Boolean(media.elementId) ||
    media.entity_type === "element" ||
    String(media.workflow_type || "").toUpperCase().includes("ELEMENT");

  const isVideo = media.type === "video" || Boolean(media.is_video) || Boolean(media.isVideo);

  const src = resolveMediaUrl(media);

  const tooltipText =
    media.displayName ||
    media.name ||
    label ||
    (isCharacter ? "Ingrédient personnage" : isElement ? "Ingrédient élément" : "Ingrédient");

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        "group relative shrink-0 size-[50px] rounded-subtle border-2 border-[color:var(--border-heavy)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {isVideo ? (
        <video
          src={src}
          aria-label={tooltipText}
          className="block size-full object-cover overflow-hidden rounded-sharp select-none pointer-events-none"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <img
          src={src}
          alt={tooltipText}
          decoding="async"
          className="block size-full object-cover overflow-hidden rounded-sharp select-none pointer-events-none"
        />
      )}

      <button
        type="button"
        aria-label={`Remove ${tooltipText}`}
        title={`Supprimer ${tooltipText}`}
        onClick={(e) => {
          e.stopPropagation();
          onRemove?.();
        }}
        className="absolute -right-2 -top-[7px] grid size-5 cursor-pointer place-items-center rounded-subtle surface-glass bg-surface-menu-glass text-icon-primary hover:bg-surface-tonal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-heavy transition-colors duration-200 z-10"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d={REMOVE_ICON_PATH} />
        </svg>
      </button>

      {/* Floating Media Preview Popover directly above */}
      <AnimatePresence>
        {isHovered && src && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-[100] pointer-events-none flex flex-col items-center"
          >
            <div className="surface-glass bg-surface-menu-glass rounded-comfortable p-1 overflow-hidden flex items-center justify-center">
              {isVideo ? (
                <video
                  src={src}
                  className="max-w-[200px] max-h-[280px] w-auto h-auto rounded-subtle object-contain block"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={src}
                  alt=""
                  className="max-w-[200px] max-h-[280px] w-auto h-auto rounded-subtle object-contain block select-none pointer-events-none"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}