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

/**
 * CharacterEditNavbar
 * Specialization layer for the Character Edit view, powered by EntityEditNavbar & NavbarCore.
 * Mirrors ElementEditNavbar with standard studio import dropdown (Upload & Assets) and favorite toggle.
 */
export function CharacterEditNavbar({
  onDeleteCharacter,
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
      entityType="character"
      onDelete={onDeleteCharacter}
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
                  className="rounded-[var(--button-border-radius,12px)] h-8 w-8 p-0 text-white hover:text-white hover:bg-white/10 bg-transparent cursor-pointer transition-colors outline-none flex items-center justify-center"
                  title="Ajouter des images"
                  aria-label="Ajouter des images"
                >
                  <GoogleIcon iconName="add" className="text-[20px] text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className="w-52 p-1.5">
                {onUpload && (
                  <DropdownMenuItem
                    onSelect={() => onUpload()}
                    className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-[16px] min-h-[2.125rem] text-[14px] leading-5 font-medium cursor-pointer text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <GoogleIcon iconName="upload" className="text-[20px] text-white/80 shrink-0" />
                    <span className="font-medium">Importer depuis l'ordinateur</span>
                  </DropdownMenuItem>
                )}
                {onOpenAssets && (
                  <DropdownMenuItem
                    onSelect={() => onOpenAssets()}
                    className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-[16px] min-h-[2.125rem] text-[14px] leading-5 font-medium cursor-pointer text-white/90 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <GoogleIcon iconName="perm_media" className="text-[20px] text-white/80 shrink-0" />
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
              data-testid="like-character-button"
              onClick={onToggleLike}
              className="rounded-[var(--button-border-radius,12px)] h-8 w-8 p-0 cursor-pointer transition-colors outline-none flex items-center justify-center bg-transparent hover:bg-white/10 text-white hover:text-white"
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

export default CharacterEditNavbar;
