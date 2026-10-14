"use client";

import React, { useState } from "react";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Button } from "@/shared/ui/button";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { ELEMENT_TYPES } from "@/features/workflows/model/elementSheetConfig";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/shared/ui/select";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/shared/ui/hover-card";
import { Check, Copy, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * InputInfoHover
 * Sleek, subtle hover trigger button that presents contextual input descriptions
 * on hover without cluttering the sidebar layout with static text blocks.
 * Conforms to global Google Flow / Material 3 styling tokens.
 */
export function InputInfoHover({ content, title, testId }) {
  const [open, setOpen] = useState(false);

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={80} closeDelay={150}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          className={cn(
            "inline-flex items-center justify-center size-4 rounded-full text-[var(--mat-sys-on-surface-variant,#8e918f)] hover:text-[var(--mat-sys-on-surface,#e3e3e3)] hover:bg-[var(--foreground-state-10)] transition-colors cursor-pointer outline-none shrink-0",
            open && "text-[var(--mat-sys-on-surface,#e3e3e3)] bg-[var(--foreground-state-15)]"
          )}
          aria-label={title || content}
          title={content}
          data-testid={testId}
        >
          <GoogleIcon iconName="info" className="text-[13px] leading-none" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        sideOffset={6}
        className="z-50 w-64 rounded-[var(--mat-menu-container-shape,16px)] border border-[var(--mat-sys-outline-variant,rgba(255,255,255,0.08))] bg-[var(--mat-menu-container-color,var(--background-state-90))] backdrop-blur-xl p-3 text-[11.5px] text-[var(--mat-sys-on-surface,#e3e3e3)] shadow-[var(--mat-menu-container-elevation-shadow)] leading-relaxed"
      >
        {content}
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * ElementInfoSidebar
 * Left sidebar for the Element edit view:
 * - Editable Element Name with "@" prefix
 * - Element Type selector via Select component (variant="blur") with global CSS tokens
 * - Element Description / Notes textarea (variant="blur") with Vision AI trigger
 * - Directives de rendu editable textarea (variant="blur") with copy action
 *
 * Fully unified styling:
 * - Rounded corners: rounded-[var(--mat-sys-corner-medium,12px)]
 * - Background: var(--foreground-state-10) with blur(80px)
 * - Padding: unified SaaS scale (p-3 / px-3.5)
 * - Harmonious global CSS tokens across all fields
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
    <div className={cn("lg:col-span-4 xl:col-span-4 flex flex-col gap-5", className)}>
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

      {/* 2. Element Type Selector — Unified Select with variant="blur" */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[var(--mat-sys-on-surface,#e3e3e3)]">Type d'élément</span>
          <InputInfoHover
            content="Définit la catégorie de référence (Objet, Style, Police ou Logo) pour guider la génération."
            title="Info type"
            testId="type-info-hover"
          />
        </div>
        <Select
          value={currentType.id}
          onValueChange={(val) => onSaveElementType && onSaveElementType(val)}
        >
          <SelectTrigger
            variant="blur"
            className="w-full h-11 px-3.5 rounded-[var(--mat-sys-corner-medium,12px)] text-sm font-medium"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <GoogleIcon
                iconName={currentType.googleIcon}
                className="text-[18px] text-[var(--mat-sys-on-surface-variant,#8e918f)] shrink-0"
              />
              <SelectValue placeholder="Type d'élément">
                {currentType.label}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent align="start" className="w-[var(--radix-select-trigger-width)]">
            {ELEMENT_TYPES.map((type) => (
              <SelectItem
                key={type.id}
                value={type.id}
                icon={
                  <GoogleIcon
                    iconName={type.googleIcon}
                    className="text-[18px]"
                  />
                }
              >
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 3. Element Description / Notes */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--mat-sys-on-surface,#e3e3e3)]">Description / Contexte</span>
            <span className="text-[11px] text-[var(--mat-sys-on-surface-variant,#8e918f)]">(optionnel)</span>
            <InputInfoHover
              content="Le modèle utilisera cette description pour intégrer fidèlement l'élément dans vos prompts."
              title="Info description"
              testId="desc-info-hover"
            />
          </div>

          {onAnalyzeVision && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isAnalyzingVision}
              onClick={onAnalyzeVision}
              className="h-6 px-2.5 text-[11px] text-[var(--mat-sys-on-surface-variant,#8e918f)] hover:text-[var(--mat-sys-on-surface,#e3e3e3)] hover:bg-[var(--foreground-state-10)] gap-1.5 rounded-[var(--button-border-radius,12px)] transition-colors cursor-pointer font-medium"
              title="Analyser automatiquement les images avec Vision AI"
            >
              {isAnalyzingVision ? (
                <Loader2 className="size-3 animate-spin text-[var(--mat-sys-primary,#a8c7fa)]" />
              ) : (
                <Sparkles className="size-3 text-[var(--mat-sys-primary,#a8c7fa)]" />
              )}
              <span>{isAnalyzingVision ? "Analyse…" : "Vision AI"}</span>
            </Button>
          )}
        </div>

        <Textarea
          variant="blur"
          placeholder="Décrivez les spécificités, matériaux, et style de cet élément..."
          value={draftDesc}
          onChange={(e) => setDraftDesc(e.target.value)}
          onBlur={() => onSaveDescription(draftDesc)}
          rows={3}
          minHeight={90}
          maxHeight={240}
        />
      </div>

      {/* 4. Directives de rendu (Guidelines) */}
      <div className="flex flex-col gap-1.5 w-full pt-2 border-t border-[var(--mat-sys-outline-variant,rgba(255,255,255,0.08))]">
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--mat-sys-on-surface,#e3e3e3)]">Directives de rendu</span>
            <span className="text-[11px] text-[var(--mat-sys-on-surface-variant,#8e918f)]">(règles d'utilisation)</span>
            <InputInfoHover
              content="Consignes et règles spécifiques que l'IA doit suivre lors de l'utilisation de cet élément."
              title="Info directives"
              testId="guidelines-info-hover"
            />
          </div>

          {draftGuidelines?.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={copyGuidelines}
              className="text-[var(--mat-sys-on-surface-variant,#8e918f)] hover:text-[var(--mat-sys-on-surface,#e3e3e3)] hover:bg-[var(--foreground-state-10)] rounded-[var(--button-border-radius,12px)] transition-colors"
              title="Copier les directives"
            >
              {copied ? (
                <Check className="size-3.5 text-[var(--mat-sys-success,#80da88)]" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          )}
        </div>

        <Textarea
          variant="blur"
          placeholder="Règles à respecter (ex: Maintenir un éclairage doux, éviter les reflets intenses, ne pas modifier la texture...)"
          value={draftGuidelines}
          onChange={(e) => setDraftGuidelines && setDraftGuidelines(e.target.value)}
          onBlur={() => onSaveGuidelines && onSaveGuidelines(draftGuidelines)}
          minHeight={130}
          maxHeight={340}
        />
      </div>
    </div>
  );
}

export default ElementInfoSidebar;
