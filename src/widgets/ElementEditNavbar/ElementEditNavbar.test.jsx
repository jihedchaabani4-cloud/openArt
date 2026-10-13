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
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  });
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

    // Verify standardized width and compact item sizing
    const menuContent = uploadItem.closest('[data-slot="dropdown-menu-content"]');
    expect(menuContent.className).toContain("w-52");
    expect(menuContent.className).not.toContain("min-w-[210px]");

    const uploadMenuItem = uploadItem.closest('[data-slot="dropdown-menu-item"]');
    expect(uploadMenuItem.className).toContain("min-h-[48px]");
    expect(uploadMenuItem.className).toContain("text-[14px]");

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

  it("renders like button that toggles favorite state when clicked", () => {
    const onToggleLike = vi.fn();

    const { rerender } = renderWithClient(
      <ElementEditNavbar
        isLiked={false}
        onToggleLike={onToggleLike}
      />
    );

    const likeBtn = screen.getByTestId("like-element-button");
    expect(likeBtn).toBeDefined();
    expect(likeBtn.textContent).toContain("favorite");
    // When unliked: outline / white
    expect(likeBtn.className).toContain("text-white");

    fireEvent.click(likeBtn);
    expect(onToggleLike).toHaveBeenCalledTimes(1);

    // When liked: filled heart in white, never red
    rerender(
      <ElementEditNavbar
        isLiked={true}
        onToggleLike={onToggleLike}
      />
    );
    const likedBtn = screen.getByTestId("like-element-button");
    expect(likedBtn.className).toContain("text-white");
    expect(likedBtn.className).not.toContain("text-red-500");
    const likedIcon = likedBtn.querySelector("span[data-mat-icon-type='font']");
    expect(likedIcon.className).toContain("text-white");
    expect(likedIcon.className).not.toContain("text-red-500");
  });

  it("does not render the user dropdown or user button in edit navbar", () => {
    const { container } = renderWithClient(<ElementEditNavbar />);

    expect(screen.queryByRole("button", { name: /login/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /open user menu/i })).toBeNull();
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });

  it("uses the global button border radius CSS variable across all navbar buttons including Done", () => {
    const { container } = renderWithClient(
      <ElementEditNavbar
        onDeleteElement={() => {}}
        onUpload={() => {}}
        onToggleLike={() => {}}
        onDone={() => {}}
      />
    );

    const doneBtn = container.querySelector("button[data-variant='white']");
    expect(doneBtn.className).toContain("var(--button-border-radius");

    const deleteBtn = container.querySelector("button[title='Delete']");
    expect(deleteBtn.className).toContain("var(--button-border-radius");

    const likeBtn = container.querySelector("[data-testid='like-element-button']");
    expect(likeBtn.className).toContain("var(--button-border-radius");

    const addBtn = container.querySelector("[data-testid='import-dropdown-trigger']");
    expect(addBtn.className).toContain("var(--button-border-radius");
  });
});
