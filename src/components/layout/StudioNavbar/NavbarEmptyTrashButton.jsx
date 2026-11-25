"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/base/button";
import { ConfirmDeleteDialog } from "@/components/primitives/ConfirmDeleteDialog";
import { HugeIcon } from "@/components/primitives/HugeIcon";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { useStudioSelectionStore } from "@/features/workflows/model/useStudioSelectionStore";
import { useTrashDelete } from "@/features/trash/api/mutations/useTrashDelete";

export function NavbarEmptyTrashButton() {
  const pathname = usePathname() || "";
  const activeStudioTab = useGenerationsStore((s) => s.activeStudioTab);
  const projectId = useGenerationsStore((s) => s.selectedProjectId);

  const isTrashTab = activeStudioTab === "trash" || pathname.includes("/trash");
  const { data } = useProjectData(projectId);
  const trashedWorkflows = data?.projectContents?.trashedWorkflows || [];
  const trashedCount = trashedWorkflows.length;

  const trashDelete = useTrashDelete();
  const isPending = Boolean(trashDelete?.isPending);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!isTrashTab || trashedCount === 0) return null;

  const handleConfirmEmptyTrash = async () => {
    if (!projectId || isPending) return;
    try {
      const result = await trashDelete.mutateAsync({ projectId, all: true });
      useStudioSelectionStore.getState().clearSelection();

      const deletedCount =
        typeof result?.count === "number"
          ? result.count
          : Array.isArray(result?.deleted_workflow_ids)
            ? result.deleted_workflow_ids.length
            : 0;
      const storageFailures = Array.isArray(result?.storage_failures)
        ? result.storage_failures.length
        : typeof result?.storage_failures === "number"
          ? result.storage_failures
          : 0;

      if (deletedCount === 0) {
        toast.info("Trash is already empty.");
      } else if (storageFailures > 0) {
        toast.warning(
          `Trash emptied (${deletedCount} ${deletedCount === 1 ? "item" : "items"} deleted; ${storageFailures} storage cleanup ${storageFailures === 1 ? "failure" : "failures"}).`
        );
      } else {
        toast.success(
          `Trash emptied (${deletedCount} ${deletedCount === 1 ? "item" : "items"} permanently deleted).`
        );
      }
    } catch (err) {
      toast.error(err?.message || "Failed to empty trash.", {
        id: "trash-delete-error",
      });
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsConfirmOpen(true)}
        disabled={isPending || !projectId}
        className="flex items-center gap-1.5 cursor-pointer h-7 max-h-full text-destructive"
      >
        <HugeIcon name="delete-02" />
        <span>{isPending ? "Emptying..." : "Empty Trash"}</span>
      </Button>

      <ConfirmDeleteDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Confirm empty trash"
        description="Empty Trash? All trashed items will be permanently deleted."
        confirmLabel="Empty Trash"
        cancelLabel="Cancel"
        loading={isPending}
        onConfirm={handleConfirmEmptyTrash}
      />
    </>
  );
}

export default NavbarEmptyTrashButton;
