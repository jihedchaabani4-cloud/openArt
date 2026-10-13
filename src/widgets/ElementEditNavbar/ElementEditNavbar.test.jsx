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
  it("renders a unified dropdown for upload and project assets with both menu items", () => {
    const onUpload = vi.fn();
    const onOpenAssets = vi.fn();

    renderWithClient(
      <ElementEditNavbar
        onUpload={onUpload}
        onOpenAssets={onOpenAssets}
        importMenuOpen={true}
      />
    );

    // Dropdown trigger is rendered as a simple icon-only '+' button without text or bg
    const trigger = screen.getByTestId("import-dropdown-trigger");
    expect(trigger).toBeDefined();
    expect(trigger.textContent).toBe("add");
    expect(trigger.textContent).not.toContain("Importer");
    expect(trigger.className).toContain("bg-transparent");
    expect(trigger.className).not.toMatch(/(^|\s)bg-white\/10(\s|$)/);

    // Both options are in the dropdown menu
    const uploadItem = screen.getByText("Importer depuis l'ordinateur");
    const assetsItem = screen.getByText("Depuis le projet");
    expect(uploadItem).toBeDefined();
    expect(assetsItem).toBeDefined();

    // Clicking options triggers callbacks
    fireEvent.click(uploadItem);
    expect(onUpload).toHaveBeenCalledTimes(1);

    fireEvent.click(assetsItem);
    expect(onOpenAssets).toHaveBeenCalledTimes(1);
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
