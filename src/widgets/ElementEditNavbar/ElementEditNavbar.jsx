"use client";

import * as React from "react";
import { EntityEditNavbar } from "@/widgets/EntityEditNavbar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

/**
 * ElementEditNavbar
 * Specialization layer for the Element Edit view, powered by EntityEditNavbar & NavbarCore.
 */
export function ElementEditNavbar({
  onDeleteElement,
  onDone,
  onUpload,
  onOpenAssets,
  isLiked = false,
  onToggleLike,
  actions,
  children,
  importMenuOpen,
  onImportMenuOpenChange,
  showUserDropdown = false,
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = importMenuOpen !== undefined ? importMenuOpen : internalOpen;
  const setOpen = onImportMenuOpenChange || setInternalOpen;

  const hasImportOptions = Boolean(onUpload || onOpenAssets);

  return (
    <EntityEditNavbar
      entityType="element"
      onDelete={onDeleteElement}
      onDone={onDone}
      showUserDropdown={showUserDropdown}
      actions={
        <>
          {hasImportOptions && (
            <DropdownMenu open={isOpen} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  data-testid="import-dropdown-trigger"
                  className="rounded-[var(--button-border-radius,9999px)] h-8 w-8 p-0 text-white hover:text-white hover:bg-white/10 bg-transparent cursor-pointer transition-colors outline-none flex items-center justify-center"
                  title="Ajouter des images"
                  aria-label="Ajouter des images"
                >
                  <GoogleIcon iconName="add" className="text-[20px] text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className="min-w-[210px] p-1.5">
                {onUpload && (
                  <DropdownMenuItem
                    onSelect={() => onUpload()}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <GoogleIcon iconName="upload" className="text-[18px] text-white/70 shrink-0" />
                    <span className="font-medium">Importer depuis l'ordinateur</span>
                  </DropdownMenuItem>
                )}
                {onOpenAssets && (
                  <DropdownMenuItem
                    onSelect={() => onOpenAssets()}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <GoogleIcon iconName="perm_media" className="text-[18px] text-white/70 shrink-0" />
                    <span className="font-medium">Depuis le projet</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {onToggleLike && (
            <Button
              type="button"
              variant="ghost"
              data-testid="like-element-button"
              onClick={onToggleLike}
              className="rounded-[var(--button-border-radius,9999px)] h-8 w-8 p-0 cursor-pointer transition-colors outline-none flex items-center justify-center bg-transparent hover:bg-white/10 text-white hover:text-white"
              title={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-label={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <GoogleIcon
                iconName="favorite"
                fill={isLiked}
                className="text-[20px] text-white"
              />
            </Button>
          )}

          {actions}
        </>
      }
      left={children}
    />
  );
}

export default ElementEditNavbar;
