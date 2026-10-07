"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { GoogleIcon } from "@/shared/ui/GoogleIcon";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useCreateFolder } from "@/features/folders";
import { useWorkflowsStore } from "@/features/workflows";

export function CreateCollectionDialog({
  open,
  onOpenChange,
  projectId,
  onCreated,
}) {
  const [name, setName] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState(null);
  const inputRef = React.useRef(null);
  const { mutateAsync: createFolder, isPending } = useCreateFolder();
  const setActiveCollectionId = useWorkflowsStore((s) => s.setActiveCollectionId);

  React.useEffect(() => {
    if (open) {
      setName("");
      setErrorMsg(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!projectId) {
      setErrorMsg("Project is required to create a collection.");
      return;
    }

    setErrorMsg(null);
    try {
      const created = await createFolder({
        projectId,
        name: trimmed,
      });

      if (created?.id) {
        setActiveCollectionId(created.id);
      }
      onCreated?.(created);
      onOpenChange?.(false);
    } catch (err) {
      setErrorMsg(err.message || "Failed to create collection");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        variant="small"
        className="bg-[rgba(22,23,24,0.92)] backdrop-blur-[80px] border border-white/10 text-white rounded-[24px] max-w-[340px] p-5 shadow-2xl"
        showCloseButton={false}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <GoogleIcon iconName="create_new_folder" className="text-[20px] text-white/90" />
            </div>
            <DialogHeader className="space-y-0.5 text-left">
              <DialogTitle className="text-[15px] font-semibold text-white tracking-tight">
                New collection
              </DialogTitle>
              <DialogDescription className="text-[12px] text-white/50">
                Organize your assets inside this project
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-1.5">
            <Input
              ref={inputRef}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Collection name"
              className="h-10 text-[13px] bg-white/5 border-white/10 rounded-xl focus:border-white/25"
              disabled={isPending}
              autoFocus
            />
            {errorMsg && (
              <p className="text-[11px] text-red-400 px-1">{errorMsg}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="studio-ghost"
              size="sm"
              onClick={() => onOpenChange?.(false)}
              disabled={isPending}
              className="text-[13px] text-white/70 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="studio-accent"
              size="sm"
              disabled={!name.trim() || isPending}
              className="text-[13px] px-4 font-medium"
            >
              {isPending ? (
                <GoogleIcon iconName="progress_activity" className="text-[14px] animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
