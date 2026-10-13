"use client";

import * as React from "react";
import { EntityEditNavbar } from "@/widgets/EntityEditNavbar";

/**
 * CharacterEditNavbar
 * Specialization layer for the Character Edit view, powered by EntityEditNavbar & NavbarCore.
 */
export function CharacterEditNavbar({
  onDeleteCharacter,
  onDone,
  actions,
  children,
  showUserDropdown = false,
}) {
  return (
    <EntityEditNavbar
      entityType="character"
      onDelete={onDeleteCharacter}
      onDone={onDone}
      actions={actions}
      left={children}
      showUserDropdown={showUserDropdown}
    />
  );
}

export default CharacterEditNavbar;
