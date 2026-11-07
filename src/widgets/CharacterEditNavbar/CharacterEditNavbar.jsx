"use client";

import * as React from "react";
import { EntityEditNavbar } from "@/widgets/EntityEditNavbar";

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
