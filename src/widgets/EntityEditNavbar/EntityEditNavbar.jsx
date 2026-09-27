"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { NavbarCore, NavbarAction } from "@/widgets/NavbarCore";

/**
 * EntityEditNavbar
 * Shared layer on top of NavbarCore for editing project entities (Elements, Characters, etc.).
 *
 * @param {Object} props
 * @param {"element" | "character" | "generation"} [props.entityType="element"]
 * @param {string} [props.backUrl] - Overrides default `/cinema-studio/[projectId]/[entities]`
 * @param {Function} [props.onDelete] - Delete entity action
 * @param {Function} [props.onDone] - Done action handler
 * @param {string} [props.deleteLabel="Delete"]
 * @param {string} [props.doneLabel="Done"]
 * @param {React.ReactNode} [props.left] - Optional breadcrumb or title
 * @param {React.ReactNode} [props.actions] - Additional action buttons before Delete/Done
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
}) {
  const { projectId } = useParams();
  const router = useRouter();

  const entityPlural = entityType === "character" ? "characters" : "elements";
  const defaultBackUrl = backUrl || `/cinema-studio/${projectId}/${entityPlural}`;

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
      left={left}
      right={
        <>
          {actions}

          {onDelete && (
            <NavbarAction
              variant="danger"
              icon="delete"
              label={deleteLabel}
              onClick={onDelete}
            />
          )}

          <NavbarAction
            variant="primary"
            label={doneLabel}
            onClick={handleDone}
          />
        </>
      }
    />
  );
}

export default EntityEditNavbar;
