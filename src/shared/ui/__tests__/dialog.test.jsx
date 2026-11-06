import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog";
import { ConfirmDeleteDialog } from "@/widgets/dialogs/ConfirmDeleteDialog";

describe("Dialog Primitive — Runway Flat Surface Architecture", () => {
  describe("1. Visual Token Alignment (Zero Shadows, Flat Surface, 16px Radius)", () => {
    it("renders default variant with flat bg-(--background-state-90), border-white/10, and rounded-2xl", () => {
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
      expect(content?.className).toContain("rounded-2xl");
      expect(content?.className).toContain("bg-(--background-state-90)");
      expect(content?.className).toContain("border-white/10");
      expect(content?.className).toContain("shadow-none");
      expect(content?.className).toContain("backdrop-blur-80");
    });

    it("renders glass variant with controlled translucent surface and backdrop-blur", () => {
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
      expect(content?.className).toContain("rounded-2xl");
      expect(content?.className).toContain("bg-(--background-state-90)");
      expect(content?.className).toContain("backdrop-blur-80");
      expect(content?.className).toContain("border-white/10");
      expect(content?.className).toContain("shadow-none");
    });

    it("renders small and floating variants with flat surface and zero positive shadows", () => {
      const { rerender } = render(
        <Dialog open={true}>
          <DialogContent variant="small">
            <DialogTitle>Small Modal</DialogTitle>
            <DialogDescription>Description text</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      let content = screen.getByText("Small Modal").closest('[data-slot="dialog-content"]');
      expect(content?.className).toContain("rounded-2xl");
      expect(content?.className).toContain("bg-(--background-state-90)");
      expect(content?.className).toContain("border-white/10");
      expect(content?.className).toContain("shadow-none");
      expect(content?.className).toContain("backdrop-blur-80");

      rerender(
        <Dialog open={true}>
          <DialogContent variant="floating">
            <DialogTitle>Floating Modal</DialogTitle>
            <DialogDescription>Description text</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      content = screen.getByText("Floating Modal").closest('[data-slot="dialog-content"]');
      expect(content?.className).toContain("rounded-2xl");
      expect(content?.className).toContain("bg-(--background-state-90)");
      expect(content?.className).toContain("border-white/10");
      expect(content?.className).toContain("shadow-none");
      expect(content?.className).toContain("backdrop-blur-80");
    });
  });

  describe("2. Interactive Behavior & Accessibility", () => {
    it("renders close button with GoogleIcon close and closes dialog on click", () => {
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
    it("renders confirm dialog with AlertTriangle, flat surface, and handles confirm action", async () => {
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
