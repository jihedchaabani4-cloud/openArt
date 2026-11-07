"use client";

import { EntityEditNavbar } from "@/widgets/EntityEditNavbar";

/**
 * ElementEditNavbar
 * Thin specialization layer for the Element Edit view, delegating to unified EntityEditNavbar.
 */
export function ElementEditNavbar({
  onDeleteElement,
  onDelete,
  ...props
}) {
  return (
    <EntityEditNavbar
      entityType="element"
      onDelete={onDeleteElement || onDelete}
      {...props}
    />
  );
}

export default ElementEditNavbar;
