"use client";

import { useState } from "react";
import { Input } from "@/components/base/input";
import { Textarea } from "@/components/primitives/textarea";
import { Button } from "@/components/base/button";
import { IconButton } from "@/components/base/icon-button";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { ELEMENT_TYPES } from "@/features/workflows/model/elementSheetConfig";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/base/dropdown-menu";
import { MenuItemContent } from "@/components/base/menu";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/primitives/hover-card";
import { cn } from "@/shared/lib/utils";

/**
 * InputInfoHover
 * Sleek, subtle hover trigger button that presents contextual input descriptions
 * on hover without cluttering the sidebar layout with static text blocks.
 */
export function InputInfoHover({ content, title, testId }) {
  const [open, setOpen] = useState(false);

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={80} closeDelay={150}>
      <HoverCardTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          className={cn(
            "size-4 rounded-full text-white/40 hover:text-white hover:bg-white/10 shrink-0",
            open && "text-white bg-white/15"
          )}
          aria-label={title || content}
          title={content}
          data-testid={testId}
        >
          <HugeIcon name="information-circle" className="text-[13px] leading-none" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        sideOffset={6}
        className="z-50 w-64 rounded-lg border border-white/10 bg-omni-bg backdrop-blur-xl p-3 text-[11.5px] text-white/80 shadow-none leading-relaxed"
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
    <div className={cn("lg:col-span-3 xl:col-span-3 flex flex-col gap-4", className)}>
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
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white/70">Type d'élément</span>
          <InputInfoHover
            content="Définit la catégorie de référence (Objet, Style, Police ou Logo) pour guider la génération."
            title="Info type"
            testId="type-info-hover"
          />
        </div>
        <DropdownMenu open={typeOpen} onOpenChange={setTypeOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              className="flex items-center gap-2.5 w-full text-left justify-start"
            >
              <HugeIcon
                name={currentType.icon}
                size="md"
                className="text-white/60 shrink-0"
              />
              <span className="flex-1 text-white/90">{currentType.label}</span>
              <HugeIcon
                name="arrow-down-01"
                size="md"
                className={cn(
                  "text-white/40 shrink-0 transition-transform duration-200",
                  typeOpen && "rotate-180"
                )}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ELEMENT_TYPES.map((type) => {
              const isSelected =
                type.id.toLowerCase() ===
                (elementType || "object").toLowerCase();
              return (
                <DropdownMenuItem
                  key={type.id}
                  selected={isSelected}
                  onSelect={() => {
                    onSaveElementType && onSaveElementType(type.id);
                    setTypeOpen(false);
                  }}
                >
                  <MenuItemContent icon={type.icon} checked={isSelected}>
                    {type.label}
                  </MenuItemContent>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 3. Element Description / Notes */}
      <div className="personality-section gap-1">
        <div className="label-row pb-1">
          <div className="flex items-center gap-1.5">
            <span className="field-label text-xs font-semibold">Description / Contexte</span>
            <span className="field-label-optional text-[11px]">(optionnel)</span>
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
              title="Analyser automatiquement les images avec Vision AI"
            >
              {isAnalyzingVision ? (
                <HugeIcon name="loading-03" className="text-xs animate-spin text-white/60" />
              ) : (
                <HugeIcon name="sparkles" className="text-xs text-white/60" />
              )}
              <span>{isAnalyzingVision ? "Analyse…" : "Vision AI"}</span>
            </Button>
          )}
        </div>

        <Textarea
          variant="personality"
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
      <div className="personality-section gap-1 pt-1.5 border-t border-white/10">
        <div className="label-row pb-1">
          <div className="flex items-center gap-1.5">
            <span className="field-label text-xs font-semibold">Directives de rendu</span>
            <span className="field-label-optional text-[11px]">(règles d'utilisation)</span>
            <InputInfoHover
              content="Consignes et règles spécifiques que l'IA doit suivre lors de l'utilisation de cet élément."
              title="Info directives"
              testId="guidelines-info-hover"
            />
          </div>

          {draftGuidelines?.trim() && (
            <IconButton
              type="button"
              variant="ghost"
              onClick={copyGuidelines}
              title="Copier les directives"
            >
              {copied ? (
                <HugeIcon name="tick-02" className="text-sm text-emerald-400" />
              ) : (
                <HugeIcon name="copy-01" className="text-sm" />
              )}
            </IconButton>
          )}
        </div>

        <Textarea
          variant="personality"
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
