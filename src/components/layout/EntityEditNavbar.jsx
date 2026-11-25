"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { NavbarCore, NavbarAction } from "@/components/layout/NavbarCore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/base/dropdown-menu";
import { MenuItemContent } from "@/components/base/menu";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { IconButton } from "@/components/base/icon-button";

/**
 * EntityEditNavbar
 * Shared layer on top of NavbarCore for editing project entities (Elements, Characters, etc.).
 * Unifies the standard import dropdown (Upload & Assets), favorite toggle, and Delete/Done actions.
 */
export function EntityEditNavbar({
  entityType = "element",
  backUrl,
  onDelete,
  onDone,
  deleteLabel = "Delete",
  doneLabel = "Done",
  left,
  actions,
  children,
  showUserDropdown = false,
  onUpload,
  onOpenAssets,
  isAddDisabled = false,
  isLiked = false,
  onToggleLike,
  importMenuOpen,
  onImportMenuOpenChange,
}) {
  const { projectId } = useParams();
  const router = useRouter();

  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = importMenuOpen !== undefined ? importMenuOpen : internalOpen;
  const setOpen = onImportMenuOpenChange || setInternalOpen;

  const entityPlural = entityType === "character" ? "characters" : "elements";
  const defaultBackUrl = backUrl || `/cinema-studio/${projectId}/${entityPlural}`;

  const hasImportOptions = Boolean(onUpload || onOpenAssets);
  const likeTestId = entityType === "character" ? "like-character-button" : "like-element-button";
  const addTitle = isAddDisabled
    ? (entityType === "character" ? "Maximum 5 images de détail autorisées" : "Maximum d'images atteint")
    : "Ajouter des images";

  const handleDone = () => {
    if (typeof onDone === "function") {
      onDone();
    } else {
      router.push(defaultBackUrl);
    }
  };

  return (
    <NavbarCore
      onBack={() => router.push(defaultBackUrl)}
      backLabel={`Back to ${entityPlural}`}
      left={left || children}
      showUserDropdown={showUserDropdown}
      right={
        <>
          {hasImportOptions && (
            <DropdownMenu open={isAddDisabled ? false : isOpen} onOpenChange={isAddDisabled ? undefined : setOpen}>
              <DropdownMenuTrigger asChild>
                <IconButton
                  type="button"
                  variant="ghost"
                  data-testid="import-dropdown-trigger"
                  disabled={isAddDisabled}
                  title={addTitle}
                  aria-label={addTitle}
                >
                  <HugeIcon name="add-01" className="text-white" />
                </IconButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onUpload && (
                  <DropdownMenuItem onSelect={() => onUpload()}>
                    <MenuItemContent icon="upload-04">Importer depuis l&apos;ordinateur</MenuItemContent>
                  </DropdownMenuItem>
                )}
                {onOpenAssets && (
                  <DropdownMenuItem onSelect={() => onOpenAssets()}>
                    <MenuItemContent icon="album-02">Depuis le projet</MenuItemContent>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {onToggleLike && (
            <IconButton
              type="button"
              variant="ghost"
              data-testid={likeTestId}
              onClick={onToggleLike}
              title={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-label={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <HugeIcon
                name="favourite"
                filled={isLiked}
                className="text-white"
              />
            </IconButton>
          )}

          {actions}

          {onDelete && (
            <NavbarAction
              variant="ghost"
              icon="delete-02"
              size="icon"
              title={deleteLabel}
              aria-label={deleteLabel}
              onClick={onDelete}
              className="text-white hover:text-white hover:bg-white/10 h-7 w-7 transition-colors cursor-pointer rounded-subtle"
            />
          )}

          <NavbarAction
            variant="white"
            label={doneLabel}
            onClick={handleDone}
            className="rounded-subtle"
          />
        </>
      }
    />
  );
}

export default EntityEditNavbar;
