"use client";

import { EntityEditNavbar } from "@/components/layout/EntityEditNavbar";

/**
 * CharacterEditNavbar
 * Thin specialization layer for the Character Edit view, delegating to unified EntityEditNavbar.
 */
export function CharacterEditNavbar({
  onDeleteCharacter,
  onDelete,
  ...props
}) {
  return (
    <EntityEditNavbar
      entityType="character"
      onDelete={onDeleteCharacter || onDelete}
      {...props}
    />
  );
}

export default CharacterEditNavbar;
