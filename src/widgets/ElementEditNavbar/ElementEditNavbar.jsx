"use client";

import * as React from "react";
import { EntityEditNavbar } from "@/widgets/EntityEditNavbar";

/**
 * ElementEditNavbar
 * Specialization layer for the Element Edit view, powered by EntityEditNavbar & NavbarCore.
 */
export function ElementEditNavbar({
  onDeleteElement,
  onDone,
  actions,
  children,
}) {
  return (
    <EntityEditNavbar
      entityType="element"
      onDelete={onDeleteElement}
      onDone={onDone}
      actions={actions}
      left={children}
    />
  );
}

export default ElementEditNavbar;
