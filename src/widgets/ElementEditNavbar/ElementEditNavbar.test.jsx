import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ElementEditNavbar } from "./ElementEditNavbar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useParams: () => ({ projectId: "proj-1" }),
  useRouter: () => ({ push: vi.fn() }),
}));

function renderWithClient(ui) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe("ElementEditNavbar", () => {
  it("renders upload and import from assets action buttons in the navbar", () => {
    const onUpload = vi.fn();
    const onOpenAssets = vi.fn();

    renderWithClient(
      <ElementEditNavbar
        onUpload={onUpload}
        onOpenAssets={onOpenAssets}
      />
    );

    const uploadBtn = screen.getByTitle("Importer depuis l'ordinateur");
    const assetsBtn = screen.getByTitle("Ajouter à partir du projet");
    expect(uploadBtn).toBeDefined();
    expect(assetsBtn).toBeDefined();
  });

  it("renders a simple white icon-only delete button without text and without danger red styling", () => {
    const onDelete = vi.fn();

    renderWithClient(
      <ElementEditNavbar
        onDeleteElement={onDelete}
      />
    );

    // Should NOT have visible "Delete" text
    expect(screen.queryByText("Delete")).toBeNull();

    // Should have delete button with icon and title/aria-label
    const deleteBtn = screen.getByTitle("Delete");
    expect(deleteBtn).toBeDefined();
    expect(deleteBtn.textContent).toContain("delete");
    expect(deleteBtn.className).toContain("text-white");
    expect(deleteBtn.className).not.toContain("foreground-color-danger");

    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
