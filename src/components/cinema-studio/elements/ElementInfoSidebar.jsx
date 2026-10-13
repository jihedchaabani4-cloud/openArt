"use client";

import React, { useState } from "react";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { ELEMENT_TYPES } from "@/features/workflows/model/elementSheetConfig";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
import { Check, Copy, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * ElementInfoSidebar
 * Left sidebar for the Element edit view:
 * - Editable Element Name with "@" prefix
 * - Element Type selector (Dropdown: Object, Style, Font, Logo) — bg-white/5, no border, neutral blur style
 * - Element Description / Notes textarea with Vision AI quick-trigger (neutral styling)
 * - Directives de rendu editable textarea with copy button
 */
export function ElementInfoSidebar({
  draftTitle,
  setDraftTitle,
  onSaveTitle,
  draftDesc,
  setDraftDesc,
  onSaveDescription,
  elementType = "object",
  onSaveElementType,
  draftGuidelines = "",
  setDraftGuidelines,
  onSaveGuidelines,
  onAnalyzeVision,
  isAnalyzingVision = false,
  className,
}) {
  const [copied, setCopied] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const copyGuidelines = () => {
    if (!draftGuidelines) return;
    navigator.clipboard.writeText(draftGuidelines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentType =
    ELEMENT_TYPES.find(
      (t) => t.id.toLowerCase() === (elementType || "object").toLowerCase()
    ) || ELEMENT_TYPES[0];

  return (
    <div className={cn("lg:col-span-3 xl:col-span-3 flex flex-col gap-5", className)}>
      {/* 1. Editable Element Name */}
      <div className="flex flex-col gap-1">
        <Input
          prefix="@"
          placeholder="Element Name"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={() => onSaveTitle(draftTitle)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="text-[2rem] leading-[2.5rem] font-normal text-white"
          containerClassName="w-full"
        />
      </div>

      {/* 2. Element Type Dropdown — style matches DropdownSegmented (bg-white/5, no border, blur) */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-white/70">Type d'élément</span>
        <DropdownMenu open={typeOpen} onOpenChange={setTypeOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "flex items-center gap-2.5 w-full h-auto px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left outline-none select-none justify-start cursor-pointer",
                "bg-white/5 text-white hover:bg-white/[0.08] hover:text-white",
                typeOpen && "bg-white/[0.08]"
              )}
            >
              <GoogleIcon
                iconName={currentType.googleIcon}
                className="text-[18px] text-white/60 shrink-0"
              />
              <span className="flex-1 text-white/90">{currentType.label}</span>
              <GoogleIcon
                iconName="expand_more"
                className={cn(
                  "text-[18px] text-white/40 shrink-0 transition-transform duration-200",
                  typeOpen && "rotate-180"
                )}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={6} className="min-w-[180px]">
            {ELEMENT_TYPES.map((type) => {
              const isSelected =
                type.id.toLowerCase() ===
                (elementType || "object").toLowerCase();
              return (
                <DropdownMenuItem
                  key={type.id}
                  onSelect={() => {
                    onSaveElementType && onSaveElementType(type.id);
                    setTypeOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors",
                    isSelected ? "text-white bg-white/10" : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  <GoogleIcon
                    iconName={type.googleIcon}
                    className={cn(
                      "text-[18px] shrink-0",
                      isSelected ? "text-white" : "text-white/50"
                    )}
                  />
                  <span className="flex-1">{type.label}</span>
                  {isSelected && (
                    <Check className="size-3.5 text-white/70 ml-auto" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 3. Element Description / Notes */}
      <div className="flex flex-col gap-1 pt-1">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-semibold text-white/70">Description / Contexte</span>
            <span className="text-[11px] text-white/40">(optionnel)</span>
          </div>

          {onAnalyzeVision && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isAnalyzingVision}
              onClick={onAnalyzeVision}
              className="h-6 px-2 text-[11px] text-white/60 hover:text-white hover:bg-white/10 gap-1.5 rounded-lg transition-colors cursor-pointer"
              title="Analyser automatiquement les images avec Vision AI"
            >
              {isAnalyzingVision ? (
                <Loader2 className="size-3 animate-spin text-white/60" />
              ) : (
                <Sparkles className="size-3 text-white/60" />
              )}
              <span>{isAnalyzingVision ? "Analyse…" : "Vision AI"}</span>
            </Button>
          )}
        </div>

        <Textarea
          placeholder="Décrivez les spécificités, matériaux, et style de cet élément..."
          value={draftDesc}
          onChange={(e) => setDraftDesc(e.target.value)}
          onBlur={() => onSaveDescription(draftDesc)}
          rows={3}
          minHeight={90}
          maxHeight={240}
          hint="Le modèle utilisera cette description pour intégrer fidèlement l'élément dans vos prompts."
        />
      </div>

      {/* 4. Directives de rendu (Guidelines) */}
      <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-semibold text-white/70">Directives de rendu</span>
            <span className="text-[11px] text-white/40">(règles d'utilisation)</span>
          </div>

          {draftGuidelines?.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={copyGuidelines}
              className="text-white/40 hover:text-white"
              title="Copier les directives"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          )}
        </div>

        <Textarea
          placeholder="Règles à respecter (ex: Maintenir un éclairage doux, éviter les reflets intenses, ne pas modifier la texture...)"
          value={draftGuidelines}
          onChange={(e) => setDraftGuidelines && setDraftGuidelines(e.target.value)}
          onBlur={() => onSaveGuidelines && onSaveGuidelines(draftGuidelines)}
          minHeight={160}
          maxHeight={340}
          hint="Consignes et règles spécifiques que l'IA doit suivre lors de l'utilisation de cet élément."
        />
      </div>
    </div>
  );
}

export default ElementInfoSidebar;
