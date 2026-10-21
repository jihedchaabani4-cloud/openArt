"use client";

/**
 * [FSD Layer: components/cinema-studio/common]
 * VideoEditCard — wraps the Skiper91 video player inside a dark card shell.
 *
 * Owns:
 *   - Card chrome: title header, action buttons (Export, Re-generate)
 *   - Delegates all video playback to <Skiper91VideoPlayer>
 *
 * Public API:
 *   <VideoEditCard
 *     title={string}
 *     src={string | null}           // Supabase Storage signed URL (or null while loading)
 *     onExport?={() => void}        // omit to hide the button
 *     onRegenerate?={() => void}    // omit to hide the button
 *     className?={string}
 *   />
 */

import { Download, RefreshCw } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Skiper91VideoPlayer } from "./Skiper91VideoPlayer";

/**
 * @param {{
 *   title: string,
 *   src: string | null,
 *   onExport?: () => void,
 *   onRegenerate?: () => void,
 *   className?: string,
 * }} props
 */
export function VideoEditCard({
  title,
  src,
  onExport,
  onRegenerate,
  className,
}) {
  const hasActions = Boolean(onExport) || Boolean(onRegenerate);

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl bg-[#0f0f0f] border border-white/8",
        "shadow-[0_4px_32px_rgba(0,0,0,0.45)]",
        "overflow-hidden",
        className
      )}
    >
      {/* ── header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <h3 className="text-sm font-medium text-white/90 truncate leading-none">
          {title}
        </h3>

        {hasActions && (
          <div className="flex items-center gap-1.5 ml-3 shrink-0">
            {onExport && (
              <button
                onClick={onExport}
                aria-label="Export"
                data-testid="video-edit-card-export"
                className="inline-flex items-center gap-1.5 text-xs text-white/70
                           px-3 py-1.5 rounded-lg border border-white/10
                           hover:bg-white/8 hover:text-white/90
                           transition-colors duration-150"
              >
                <Download className="size-3.5" />
                Export
              </button>
            )}

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                aria-label="Re-generate"
                data-testid="video-edit-card-regenerate"
                className="inline-flex items-center gap-1.5 text-xs text-white/70
                           px-3 py-1.5 rounded-lg border border-white/10
                           hover:bg-white/8 hover:text-white/90
                           transition-colors duration-150"
              >
                <RefreshCw className="size-3.5" />
                Re-generate
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── video player ────────────────────────────────────────────── */}
      <Skiper91VideoPlayer src={src} />
    </div>
  );
}
