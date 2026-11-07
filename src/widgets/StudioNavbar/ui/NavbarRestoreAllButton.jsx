"use client";

import { usePathname } from "next/navigation";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { useWorkflowsStore as useGenerationsStore } from "@/features/workflows";
import { useProjectData } from "@/features/workflows/api/queries/useProjectData";
import { useRestoreAllWorkflows } from "@/features/trash";

export function NavbarRestoreAllButton() {
  const pathname = usePathname() || "";
  const activeStudioTab = useGenerationsStore((s) => s.activeStudioTab);
  const projectId = useGenerationsStore((s) => s.selectedProjectId);

  const isTrashTab = activeStudioTab === "trash" || pathname.includes("/trash");
  const { data } = useProjectData(projectId);
  const trashedWorkflows = data?.projectContents?.trashedWorkflows || [];
  const hasTrashed = trashedWorkflows.length > 0;

  const { mutateAsync: restoreAll, isPending } = useRestoreAllWorkflows();

  if (!isTrashTab) return null;

  const handleRestoreAll = async () => {
    if (!projectId || isPending || !hasTrashed) return;
    try {
      await restoreAll({ projectId });
      toast.success("Tous les éléments ont été restaurés avec succès.");
    } catch (err) {
      toast.error(err?.message || "Erreur lors de la restauration.");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleRestoreAll}
      disabled={isPending || !hasTrashed}
      className="flex items-center gap-1.5 cursor-pointer"
    >
      <GoogleIcon iconName="restore" className="text-base" />
      <span>{isPending ? "Restauration..." : "Tout restaurer"}</span>
    </Button>
  );
}

export default NavbarRestoreAllButton;
