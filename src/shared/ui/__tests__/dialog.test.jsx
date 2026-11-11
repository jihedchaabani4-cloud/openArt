import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { ConfirmDeleteDialog } from "@/shared/ui/ConfirmDeleteDialog";

describe("Dialog Primitive — Higgsfield Cinema Studio Architecture", () => {
  describe("1. Visual Token Alignment (Surface-Primary, Border-Default, Radii)", () => {
    it("renders default variant with bg-[var(--bg-surface)], border-[var(--border-default)], and rounded-[var(--r-xl)]", () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Project Settings</DialogTitle>
              <DialogDescription>Manage project settings here.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByText("Project Settings").closest('[data-slot="dialog-content"]');
      expect(content).not.toBeNull();
      expect(content?.className).toContain("rounded-[var(--r-xl)]");
      expect(content?.className).toContain("bg-[var(--bg-surface)]");
      expect(content?.className).toContain("border-[var(--border-default)]");
    });

    it("renders glass variant with controlled translucent surface", () => {
      render(
        <Dialog open={true}>
          <DialogContent variant="glass">
            <DialogHeader>
              <DialogTitle>Glass Surface Dialog</DialogTitle>
              <DialogDescription>Description text</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByText("Glass Surface Dialog").closest('[data-slot="dialog-content"]');
      expect(content).not.toBeNull();
      expect(content?.className).toContain("rounded-[var(--r-xl)]");
      expect(content?.className).toContain("bg-[var(--bg-surface)]");
      expect(content?.className).toContain("border-[var(--border-default)]");
    });
  });

  describe("2. Interactive Behavior & Accessibility", () => {
    it("renders close button with close icon and closes dialog on click", () => {
      const onOpenChange = vi.fn();
      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent showCloseButton={true}>
            <DialogTitle>Closeable Dialog</DialogTitle>
            <DialogDescription>Description text</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const closeBtn = screen.getByRole("button", { name: /close/i });
      expect(closeBtn).toBeDefined();
      fireEvent.click(closeBtn);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("triggers onOpenChange(false) when Escape key is pressed", () => {
      const onOpenChange = vi.fn();
      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogContent aria-describedby={undefined}>
            <DialogTitle>Escape Test</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("3. ConfirmDeleteDialog Specialization", () => {
    it("renders confirm dialog and handles confirm action", async () => {
      const handleConfirm = vi.fn().mockResolvedValue({});
      const handleOpenChange = vi.fn();

      render(
        <ConfirmDeleteDialog
          open={true}
          onOpenChange={handleOpenChange}
          description="Voulez-vous supprimer cet élément ?"
          onConfirm={handleConfirm}
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
        />
      );

      expect(screen.getByText("Voulez-vous supprimer cet élément ?")).toBeDefined();
      const cancelBtn = screen.getByRole("button", { name: "Annuler" });
      const confirmBtn = screen.getByRole("button", { name: "Supprimer" });

      expect(cancelBtn).toBeDefined();
      expect(confirmBtn).toBeDefined();

      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
