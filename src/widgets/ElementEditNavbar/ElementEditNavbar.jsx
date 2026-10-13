"use client";

import * as React from "react";
import { EntityEditNavbar } from "@/widgets/EntityEditNavbar";
import { NavbarAction } from "@/widgets/NavbarCore";

/**
 * ElementEditNavbar
 * Specialization layer for the Element Edit view, powered by EntityEditNavbar & NavbarCore.
 */
export function ElementEditNavbar({
  onDeleteElement,
  onDone,
  onUpload,
  onOpenAssets,
  actions,
  children,
}) {
  return (
    <EntityEditNavbar
      entityType="element"
      onDelete={onDeleteElement}
      onDone={onDone}
      actions={
        <>
          {onUpload && (
            <NavbarAction
              variant="blur"
              icon="upload"
              label="Importer"
              onClick={onUpload}
              title="Importer depuis l'ordinateur"
              className="rounded-full h-8 px-3.5 text-[12px] bg-white/10 hover:bg-white/15 text-white"
            />
          )}
          {onOpenAssets && (
            <NavbarAction
              variant="blur"
              icon="add"
              label="Depuis le projet"
              onClick={onOpenAssets}
              title="Ajouter à partir du projet"
              className="rounded-full h-8 px-3 text-[12px] bg-white/5 hover:bg-white/10 text-white/70"
            />
          )}
          {actions}
        </>
      }
      left={children}
    />
  );
}

export default ElementEditNavbar;
