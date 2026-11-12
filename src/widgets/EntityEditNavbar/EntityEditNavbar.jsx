"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { NavbarCore, NavbarAction } from "@/widgets/NavbarCore";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/ui/dropdown-menu";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";

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
                <Button
                  type="button"
                  variant="ghost"
                  className="size-8 p-0"
                  data-testid="import-dropdown-trigger"
                  disabled={isAddDisabled}
                  title={addTitle}
                  aria-label={addTitle}
                >
                  <GoogleIcon iconName="add" className="text-xl text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className="w-52 p-1.5">
                {onUpload && (
                  <DropdownMenuItem
                    onSelect={() => onUpload()}
                  >
                    <GoogleIcon iconName="upload" className="text-xl text-white/80 shrink-0" />
                    <span className="font-medium">Importer depuis l'ordinateur</span>
                  </DropdownMenuItem>
                )}
                {onOpenAssets && (
                  <DropdownMenuItem
                    onSelect={() => onOpenAssets()}
                  >
                    <GoogleIcon iconName="perm_media" className="text-xl text-white/80 shrink-0" />
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
              className="size-8 p-0"
              data-testid={likeTestId}
              onClick={onToggleLike}
              title={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-label={isLiked ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <GoogleIcon
                iconName="favorite"
                fill={isLiked}
                className="text-xl text-white"
              />
            </Button>
          )}

          {actions}

          {onDelete && (
            <NavbarAction
              variant="ghost"
              icon="delete"
              size="icon"
              title={deleteLabel}
              aria-label={deleteLabel}
              onClick={onDelete}
              className="text-white hover:text-white hover:bg-white/10 h-8 w-8 transition-colors cursor-pointer"
            />
          )}

          <NavbarAction
            variant="white"
            label={doneLabel}
            onClick={handleDone}
          />
        </>
      }
    />
  );
}

export default EntityEditNavbar;
