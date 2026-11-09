"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { cn } from "@/shared/lib/utils";
import { useCreateFolder } from "@/features/folders/api/mutations/useCreateFolder";
import { FOLDER_COLOR_OPTIONS, DEFAULT_FOLDER_COLOR } from "@/features/folders/model/folder-color-tokens";
import { useWorkflowsStore } from "@/features/workflows/model/useWorkflowsStore";
import { logger } from "@/shared/lib/logger";

/**
 * CreateFolderDialog
 * Clean design-system compliant modal for "New folder" / "Create collection".
 * Uses canonical Dialog, Button, Textarea primitives and Google Flow semantic tokens.
 */
export function CreateFolderDialog({
  open,
  onOpenChange,
  projectId: propProjectId,
  parentId = null,
  title = "New folder",
  onSuccess,
}) {
  const storeProjectId = useWorkflowsStore((s) => s.selectedProjectId);
  const setActiveCollectionId = useWorkflowsStore((s) => s.setActiveCollectionId);
  const projectId = propProjectId || storeProjectId;

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  const [selectedColor, setSelectedColor] = React.useState(DEFAULT_FOLDER_COLOR);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { mutateAsync: createFolder } = useCreateFolder();

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setIsDescriptionExpanded(false);
      setSelectedColor(DEFAULT_FOLDER_COLOR);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!projectId || isSubmitting) return;

    const trimmedName = name.trim() || "My folder";
    const trimmedDesc = description.trim() || null;

    setIsSubmitting(true);
    try {
      const created = await createFolder({
        projectId,
        name: trimmedName,
        color: selectedColor || null,
        description: trimmedDesc,
        parentId: parentId || null,
      });

      if (created?.id) {
        setActiveCollectionId(created.id);
      }
      onSuccess?.(created);
      onOpenChange?.(false);
    } catch (err) {
      logger.error("create_folder_dialog_failed", { message: err?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="folder"
        showCloseButton={false}
        aria-describedby={undefined}
        className="flex flex-col gap-4 select-none"
      >
        {/* Header */}
        <div className="flex w-full items-center justify-between gap-3">
          <DialogTitle className="text-lg font-semibold text-on-surface tracking-tight">
            {title}
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="s"
            onClick={() => onOpenChange?.(false)}
            className="size-8 rounded-full p-0 text-on-surface-subtle hover:text-on-surface"
            aria-label="Close"
          >
            <GoogleIcon iconName="close" className="text-lg" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
          {/* Hero Centered Title Input */}
          <div className="flex w-full items-center justify-center py-4">
            <input
              maxLength={200}
              aria-label="Folder name"
              data-tour="folder-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My folder"
              type="text"
              className="w-full text-center text-3xl font-semibold leading-9 tracking-tight text-on-surface bg-transparent outline-none caret-primary placeholder:text-on-surface-subtle disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-2">
            {/* Description Section (Collapsible) */}
            <div className="flex flex-col">
              <div className="flex min-h-8 w-full items-center justify-between gap-2 rounded-sm p-1">
                <span className="text-sm font-medium text-on-surface-variant">Description</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="s"
                  onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                  aria-label={isDescriptionExpanded ? "Collapse description" : "Expand description"}
                  aria-expanded={isDescriptionExpanded}
                  className="size-7 rounded-full p-0 text-on-surface-subtle hover:text-on-surface"
                >
                  <GoogleIcon
                    iconName={isDescriptionExpanded ? "remove" : "add"}
                    className="text-base"
                  />
                </Button>
              </div>
              {isDescriptionExpanded && (
                <div className="pt-1">
                  <Textarea
                    aria-label="Folder description"
                    placeholder="Add description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    minHeight={80}
                    maxHeight={160}
                    maxLength={2000}
                    className="text-sm font-normal text-on-surface placeholder:text-on-surface-subtle"
                  />
                </div>
              )}
            </div>

            {/* Color Palette Row */}
            <div className="flex min-h-8 w-full items-center justify-between gap-2 rounded-sm p-1">
              <span className="text-sm font-medium text-on-surface-variant">Color</span>
              <div
                className="flex min-w-0 items-center gap-1.5 flex-1 justify-end"
                role="group"
                aria-label="Folder color"
              >
                {FOLDER_COLOR_OPTIONS.map((col) => {
                  const isSelected = selectedColor === col.hex;
                  return (
                    <Button
                      key={col.id}
                      type="button"
                      variant="ghost"
                      size="s"
                      aria-label={`Folder color ${col.label}`}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedColor(isSelected ? null : col.hex)}
                      className={cn(
                        "size-6 rounded-full p-0 flex items-center justify-center transition-all",
                        isSelected
                          ? "ring-2 ring-white ring-offset-2 ring-offset-surface-container-highest opacity-100"
                          : "hover:opacity-100 opacity-70"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn("size-4 rounded-full shrink-0", col.bgClass)}
                      />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Create Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="l"
            disabled={isSubmitting}
            className="w-full rounded-md font-semibold text-sm mt-2"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
